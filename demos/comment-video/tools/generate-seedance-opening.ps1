[CmdletBinding()]
param(
    [string]$BaseUrl = "https://www.moyu.info",
    [string]$Model = "doubao-seedance-2-0-fast-260128",
    [string]$Prompt = "Vertical 9:16 realistic UGC ecommerce video. A young adult Chinese woman stands in a bright fitting room, holding a phone in her right hand and a black high-waist A-line denim skirt in her left hand. She reads a skeptical customer comment on the phone, raises one eyebrow, looks directly into camera, then lifts the skirt slightly as if about to explain the fit. Natural hand motion, stable identity, realistic fabric, warm daylight, energetic but friendly. One continuous chest-up shot, no camera cut, no text, no subtitles, no logo, no watermark.",
    [ValidateRange(5, 30)][int]$Duration = 5,
    [ValidateSet("9:16", "16:9", "1:1")][string]$Size = "9:16",
    [ValidateSet("480p", "720p", "1080p")][string]$Resolution = "720p",
    [string]$OutputPath,
    [ValidateRange(3, 60)][int]$PollIntervalSeconds = 8,
    [ValidateRange(60, 1800)][int]$TimeoutSeconds = 600,
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($env:SEEDANCE_API_KEY)) {
    throw "SEEDANCE_API_KEY is not set for this process."
}

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $OutputPath = Join-Path (Split-Path -Parent $PSScriptRoot) "assets\library\opener-generated.mp4"
}

$outputFullPath = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = Split-Path -Parent $outputFullPath

if ((Test-Path -LiteralPath $outputFullPath -PathType Leaf) -and -not $Force) {
    throw "Output already exists: $outputFullPath. Pass -Force to overwrite it."
}
if (-not (Test-Path -LiteralPath $outputDirectory -PathType Container)) {
    New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
}

$headers = @{
    Authorization = "Bearer $($env:SEEDANCE_API_KEY)"
    "Content-Type" = "application/json"
}

$payload = @{
    model = $Model
    prompt = $Prompt
    duration = $Duration
    size = $Size
    resolution = $Resolution
}

$submitUri = "$($BaseUrl.TrimEnd('/'))/v1/video/generations"
$json = $payload | ConvertTo-Json -Depth 8 -Compress
$body = [System.Text.Encoding]::UTF8.GetBytes($json)

Write-Host "Submitting Seedance task..."
Write-Host "Model:      $Model"
Write-Host "Format:     $Size, $Resolution, ${Duration}s"
Write-Host "Output:     $outputFullPath"

$submitResponse = Invoke-RestMethod `
    -Method Post `
    -Uri $submitUri `
    -Headers $headers `
    -Body $body `
    -TimeoutSec 60

$taskId = $submitResponse.task_id
if ([string]::IsNullOrWhiteSpace([string]$taskId)) {
    $taskId = $submitResponse.id
}
if ([string]::IsNullOrWhiteSpace([string]$taskId)) {
    throw "The service did not return a task_id or id."
}

Write-Host "Task:       $taskId"

function Get-PropertyValue {
    param(
        $Object,
        [string]$Name
    )

    if ($null -eq $Object) {
        return $null
    }
    $property = $Object.PSObject.Properties[$Name]
    if ($null -eq $property) {
        return $null
    }
    return $property.Value
}

function Get-VideoUrl {
    param($Response)

    $outerData = Get-PropertyValue -Object $Response -Name "data"
    if ($null -eq $outerData) {
        $outerData = $Response
    }
    $innerData = Get-PropertyValue -Object $outerData -Name "data"
    if ($null -eq $innerData) {
        $innerData = $outerData
    }

    $content = Get-PropertyValue -Object $innerData -Name "content"
    $videoUrl = Get-PropertyValue -Object $content -Name "video_url"
    if (-not [string]::IsNullOrWhiteSpace([string]$videoUrl)) {
        return [string]$videoUrl
    }

    $fallback = Get-PropertyValue -Object $outerData -Name "fail_reason"
    if ([string]$fallback -match "^https?://") {
        return [string]$fallback
    }
    return $null
}

$queryUri = "$submitUri/$taskId"
$deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
$lastStatus = ""
$videoUrl = $null

while ([DateTime]::UtcNow -lt $deadline) {
    $queryResponse = Invoke-RestMethod `
        -Method Get `
        -Uri $queryUri `
        -Headers $headers `
        -TimeoutSec 45

    $outerData = Get-PropertyValue -Object $queryResponse -Name "data"
    if ($null -eq $outerData) {
        $outerData = $queryResponse
    }
    $innerData = Get-PropertyValue -Object $outerData -Name "data"
    if ($null -eq $innerData) {
        $innerData = $outerData
    }

    $status = [string](Get-PropertyValue -Object $outerData -Name "status")
    if ([string]::IsNullOrWhiteSpace($status)) {
        $status = [string](Get-PropertyValue -Object $innerData -Name "status")
    }
    if ([string]::IsNullOrWhiteSpace($status)) {
        $status = "unknown"
    }

    if ($status -ne $lastStatus) {
        $progress = [string](Get-PropertyValue -Object $outerData -Name "progress")
        if ([string]::IsNullOrWhiteSpace($progress)) {
            Write-Host "Status:     $status"
        }
        else {
            Write-Host "Status:     $status ($progress)"
        }
        $lastStatus = $status
    }

    if ($status -in @("SUCCESS", "succeed", "succeeded")) {
        $videoUrl = Get-VideoUrl -Response $queryResponse
        if ([string]::IsNullOrWhiteSpace($videoUrl)) {
            throw "The task succeeded, but no video URL was returned."
        }
        break
    }

    if ($status -in @("FAILURE", "failed", "error")) {
        $reason = [string](Get-PropertyValue -Object $outerData -Name "fail_reason")
        if ([string]::IsNullOrWhiteSpace($reason)) {
            $reason = "The generation task failed without a reason."
        }
        throw $reason
    }

    Start-Sleep -Seconds $PollIntervalSeconds
}

if ([string]::IsNullOrWhiteSpace($videoUrl)) {
    throw "The generation task did not finish within $TimeoutSeconds seconds."
}

$temporaryPath = "$outputFullPath.download"
try {
    Invoke-WebRequest -UseBasicParsing -Uri $videoUrl -OutFile $temporaryPath -TimeoutSec 180
    $download = Get-Item -LiteralPath $temporaryPath
    if ($download.Length -lt 10240) {
        throw "Downloaded video is unexpectedly small ($($download.Length) bytes)."
    }
    Move-Item -LiteralPath $temporaryPath -Destination $outputFullPath -Force
}
finally {
    if (Test-Path -LiteralPath $temporaryPath -PathType Leaf) {
        Remove-Item -LiteralPath $temporaryPath -Force
    }
}

$file = Get-Item -LiteralPath $outputFullPath
Write-Host ("Generated:   {0} ({1:N1} MB)" -f $file.FullName, ($file.Length / 1MB))

