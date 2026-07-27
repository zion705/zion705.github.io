[CmdletBinding()]
param(
    [string]$LanguageModel = "doubao-seed-2-0-mini-260428",
    [switch]$SkipLanguageModel,
    [switch]$SkipSeedance,
    [switch]$SkipVoiceover,
    [string]$VoiceCulture = "en-US",
    [string]$VoiceName = "Microsoft Zira Desktop",
    [string]$PiperModelPath = "D:\23\tmp\piper_voice\en_US-lessac-medium.onnx",
    [switch]$ForcePiper,
    [switch]$Force,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-File {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Label
    )
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "$Label is missing: $Path"
    }
}

function Invoke-PowerShellStep {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$ScriptPath,
        [hashtable]$Parameters = @{}
    )

    Write-Host ""
    Write-Host "==> $Name"
    if ($DryRun) {
        $parameterText = ($Parameters.GetEnumerator() | Sort-Object Key | ForEach-Object {
            if ($_.Value -is [System.Management.Automation.SwitchParameter]) {
                if ($_.Value.IsPresent) { "-$($_.Key)" }
            }
            else {
                "-$($_.Key) `"$($_.Value)`""
            }
        }) -join " "
        Write-Host "[dry-run] powershell -File `"$ScriptPath`" $parameterText"
        return
    }

    $global:LASTEXITCODE = 0
    & $ScriptPath @Parameters
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE."
    }
}

function Invoke-NodeStep {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$ScriptPath,
        [string[]]$Arguments = @()
    )

    Write-Host ""
    Write-Host "==> $Name"
    if ($DryRun) {
        $argumentText = ($Arguments | ForEach-Object { "`"$_`"" }) -join " "
        Write-Host "[dry-run] node `"$ScriptPath`" $argumentText"
        return
    }

    & node $ScriptPath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE."
    }
}

$demoDirectory = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$generatePlanScript = Join-Path $PSScriptRoot "generate-llm-plan.ps1"
$syncTimelineScript = Join-Path $PSScriptRoot "sync-llm-plan-to-timeline.mjs"
$generateVoiceoverScript = Join-Path $PSScriptRoot "generate-voiceover.ps1"
$generateOpeningScript = Join-Path $PSScriptRoot "generate-seedance-opening.ps1"
$renderScript = Join-Path $PSScriptRoot "render-comment-video.ps1"
$manifestScript = Join-Path $PSScriptRoot "write-run-manifest.mjs"
$validatorScript = Join-Path $PSScriptRoot "validate-demo.mjs"
$inputPath = Join-Path $demoDirectory "data\demo-input.json"
$planPath = Join-Path $demoDirectory "assets\output\llm-plan.json"
$timelinePath = Join-Path $PSScriptRoot "timeline.json"
$openingVideoPath = Join-Path $demoDirectory "assets\library\opener-generated.mp4"

if ([string]::IsNullOrWhiteSpace($LanguageModel)) {
    throw "LanguageModel must be a non-empty model identifier."
}
if (-not $DryRun -and
    (-not $SkipLanguageModel -or -not $SkipSeedance) -and
    [string]::IsNullOrWhiteSpace($env:SEEDANCE_API_KEY)) {
    throw "SEEDANCE_API_KEY is required for enabled generation steps. This workflow reads no other API key."
}

foreach ($required in @(
    @{ Path = $generatePlanScript; Label = "LLM plan generator" },
    @{ Path = $syncTimelineScript; Label = "Timeline synchronization tool" },
    @{ Path = $generateVoiceoverScript; Label = "Local voiceover generator" },
    @{ Path = $generateOpeningScript; Label = "Seedance opening generator" },
    @{ Path = $renderScript; Label = "Video renderer" },
    @{ Path = $manifestScript; Label = "Run manifest writer" },
    @{ Path = $validatorScript; Label = "Demo validator" },
    @{ Path = $inputPath; Label = "Demo input" },
    @{ Path = $timelinePath; Label = "Timeline" }
)) {
    Assert-File -Path $required.Path -Label $required.Label
}

if ($null -eq (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js is required but was not found on PATH."
}

Write-Host "Comment video full workflow"
Write-Host "Demo:      $demoDirectory"
Write-Host "Model:     $LanguageModel"
Write-Host "Dry run:   $($DryRun.IsPresent)"

$planParameters = @{
    Model = $LanguageModel
    InputPath = $inputPath
    OutputPath = $planPath
}

if ($SkipLanguageModel) {
    Write-Host ""
    Write-Host "==> 1. Generate LLM plan (skipped)"
    Assert-File -Path $planPath -Label "Existing LLM plan required by -SkipLanguageModel"
}
else {
    Invoke-PowerShellStep `
        -Name "1. Generate LLM plan" `
        -ScriptPath $generatePlanScript `
        -Parameters $planParameters
}

if ($DryRun -and -not $SkipLanguageModel) {
    Write-Host ""
    Write-Host "==> 1b. Verify caseId and synchronize 1-8 aligned captions"
    Write-Host "[dry-run] Deferred: llm-plan.json would be created by step 1."
    $openingPrompt = "<openingVideoPrompt.prompt from generated llm-plan.json>"
    $openingDuration = 5
}
else {
    $syncArguments = @(
        "--plan", $planPath,
        "--input", $inputPath,
        "--timeline", $timelinePath
    )
    if ($DryRun) {
        $syncArguments += "--check-only"
    }
    Invoke-NodeStep `
        -Name "1b. Verify caseId and synchronize 1-8 aligned captions" `
        -ScriptPath $syncTimelineScript `
        -Arguments $syncArguments

    $plan = Get-Content -LiteralPath $planPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $openingPrompt = [string]$plan.openingVideoPrompt.prompt
    if ([string]::IsNullOrWhiteSpace($openingPrompt)) {
        throw "llm-plan.openingVideoPrompt.prompt is missing after case validation."
    }
    $openingDuration = [int][math]::Round([double]$plan.openingVideoPrompt.durationSec)
    if ($openingDuration -lt 5) {
        $openingDuration = 5
    }
    if ($openingDuration -gt 30) {
        throw "openingVideoPrompt.durationSec exceeds the Seedance script limit."
    }
}

if ($SkipVoiceover) {
    Write-Host ""
    Write-Host "==> 1c. Generate aligned English voiceover (skipped)"
}
else {
    $voiceoverParameters = @{
        PlanPath = $planPath
        VoiceCulture = $VoiceCulture
        VoiceName = $VoiceName
        PiperModelPath = $PiperModelPath
    }
    if ($ForcePiper) {
        $voiceoverParameters.ForcePiper = [System.Management.Automation.SwitchParameter]::Present
    }
    if ($Force) {
        $voiceoverParameters.Force = [System.Management.Automation.SwitchParameter]::Present
    }
    Invoke-PowerShellStep `
        -Name "1c. Generate aligned English voiceover" `
        -ScriptPath $generateVoiceoverScript `
        -Parameters $voiceoverParameters
}

if ($SkipSeedance) {
    Write-Host ""
    Write-Host "==> 2. Generate Seedance opener (skipped)"
    if (-not $DryRun) {
        Assert-File -Path $openingVideoPath -Label "Existing opener required by -SkipSeedance"
    }
    elseif (-not (Test-Path -LiteralPath $openingVideoPath -PathType Leaf)) {
        Write-Host "[dry-run] Note: an existing opener would be required for the render step."
    }
}
else {
    $seedanceParameters = @{
        Prompt = $openingPrompt
        Duration = $openingDuration
        OutputPath = $openingVideoPath
    }
    if ($Force) {
        $seedanceParameters.Force = [System.Management.Automation.SwitchParameter]::Present
    }
    Invoke-PowerShellStep `
        -Name "2. Generate Seedance opener from openingVideoPrompt.prompt" `
        -ScriptPath $generateOpeningScript `
        -Parameters $seedanceParameters
}

$renderParameters = @{}
if ($Force) {
    $renderParameters.Force = [System.Management.Automation.SwitchParameter]::Present
}
Invoke-PowerShellStep `
    -Name "3. Render mixed video" `
    -ScriptPath $renderScript `
    -Parameters $renderParameters

Invoke-NodeStep `
    -Name "4. Write sanitized run manifest" `
    -ScriptPath $manifestScript

Invoke-NodeStep `
    -Name "5. Validate demo" `
    -ScriptPath $validatorScript

Write-Host ""
if ($DryRun) {
    Write-Host "Dry run passed. No model, TTS, Seedance, render, synchronization write, manifest, or validator was executed."
}
else {
    Write-Host "Workflow completed successfully."
}
