[CmdletBinding()]
param(
    [string]$FfmpegPath = "D:\23\tmp\video_tools\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe",
    [string]$TimelinePath,
    [string]$AssetsDirectory,
    [string]$OutputPath,
    [string]$FontPath,
    [switch]$Force,
    [switch]$ValidateOnly,
    [switch]$KeepRenderFiles
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($TimelinePath)) {
    $TimelinePath = Join-Path $PSScriptRoot "timeline.json"
}

function Format-Number {
    param([double]$Value)
    return $Value.ToString("0.###", [System.Globalization.CultureInfo]::InvariantCulture)
}

function Write-Utf8NoBom {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Content
    )

    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

function ConvertTo-FilterPath {
    param([Parameter(Mandatory = $true)][string]$Path)

    $fullPath = [System.IO.Path]::GetFullPath($Path).Replace("\", "/")
    $fullPath = $fullPath.Replace(":", "\:")
    $fullPath = $fullPath.Replace("'", "\'")
    return $fullPath
}

function Get-OptionalValue {
    param(
        [Parameter(Mandatory = $true)]$InputObject,
        [Parameter(Mandatory = $true)][string]$Name,
        $DefaultValue
    )

    $property = $InputObject.PSObject.Properties[$Name]
    if ($null -eq $property -or $null -eq $property.Value) {
        return $DefaultValue
    }
    return $property.Value
}

function Find-ChineseFont {
    param([string]$RequestedPath)

    if (-not [string]::IsNullOrWhiteSpace($RequestedPath)) {
        if (-not (Test-Path -LiteralPath $RequestedPath -PathType Leaf)) {
            throw "Font not found: $RequestedPath"
        }
        return (Resolve-Path -LiteralPath $RequestedPath).Path
    }

    $windowsRoots = New-Object System.Collections.Generic.List[string]
    foreach ($candidateRoot in @($env:WINDIR, $env:SystemRoot, "C:\Windows")) {
        if (-not [string]::IsNullOrWhiteSpace($candidateRoot) -and -not $windowsRoots.Contains($candidateRoot)) {
            $windowsRoots.Add($candidateRoot)
        }
    }

    $fontNames = @(
        "NotoSansSC-VF.ttf",
        "msyhbd.ttc",
        "msyh.ttc",
        "simhei.ttf",
        "Dengb.ttf",
        "Deng.ttf",
        "simsun.ttc"
    )

    foreach ($root in $windowsRoots) {
        foreach ($fontName in $fontNames) {
            $candidate = Join-Path (Join-Path $root "Fonts") $fontName
            if (Test-Path -LiteralPath $candidate -PathType Leaf) {
                return (Resolve-Path -LiteralPath $candidate).Path
            }
        }
    }

    throw "No Chinese font found. Pass -FontPath with a local .ttf or .ttc file."
}

function Get-MotionExpression {
    param([string]$Motion)

    switch ($Motion) {
        "drift-left" {
            return @{
                Z = "min(zoom+0.0004,1.055)"
                X = "iw/2-(iw/zoom/2)+on*0.055"
                Y = "ih/2-(ih/zoom/2)"
            }
        }
        "drift-right" {
            return @{
                Z = "min(zoom+0.0004,1.055)"
                X = "iw/2-(iw/zoom/2)-on*0.055"
                Y = "ih/2-(ih/zoom/2)"
            }
        }
        "rise" {
            return @{
                Z = "min(zoom+0.00042,1.055)"
                X = "iw/2-(iw/zoom/2)"
                Y = "ih/2-(ih/zoom/2)-on*0.035"
            }
        }
        "settle" {
            return @{
                Z = "min(zoom+0.00024,1.035)"
                X = "iw/2-(iw/zoom/2)"
                Y = "ih/2-(ih/zoom/2)"
            }
        }
        default {
            return @{
                Z = "min(zoom+0.00048,1.06)"
                X = "iw/2-(iw/zoom/2)"
                Y = "ih/2-(ih/zoom/2)"
            }
        }
    }
}

function Test-MediaHasAudioStream {
    param(
        [Parameter(Mandatory = $true)][string]$ExecutablePath,
        [Parameter(Mandatory = $true)][string]$MediaPath
    )

    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $ExecutablePath
    $startInfo.Arguments = '-hide_banner -i "' + $MediaPath.Replace('"', '\"') + '"'
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $startInfo
    [void]$process.Start()
    $standardOutput = $process.StandardOutput.ReadToEnd()
    $standardError = $process.StandardError.ReadToEnd()
    $process.WaitForExit()
    $probeText = $standardOutput + [Environment]::NewLine + $standardError
    $process.Dispose()

    return ($probeText -match "(?m)^\s*Stream #.*Audio:")
}

function Find-UsableAudioFile {
    param(
        [Parameter(Mandatory = $true)][string]$Directory,
        [Parameter(Mandatory = $true)][string[]]$CandidateNames,
        [Parameter(Mandatory = $true)][string]$ExecutablePath,
        [long]$MinimumBytes = 4096
    )

    foreach ($fileName in $CandidateNames) {
        $candidate = Join-Path $Directory $fileName
        if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            continue
        }

        $file = Get-Item -LiteralPath $candidate
        if ($file.Length -lt $MinimumBytes) {
            Write-Warning "Ignoring invalid audio candidate '$candidate' ($($file.Length) bytes; minimum is $MinimumBytes)."
            continue
        }
        if (-not (Test-MediaHasAudioStream -ExecutablePath $ExecutablePath -MediaPath $candidate)) {
            Write-Warning "Ignoring audio candidate without a readable audio stream: $candidate"
            continue
        }
        return $candidate
    }

    return $null
}

if (-not (Test-Path -LiteralPath $FfmpegPath -PathType Leaf)) {
    throw "FFmpeg not found: $FfmpegPath"
}
if (-not (Test-Path -LiteralPath $TimelinePath -PathType Leaf)) {
    throw "Timeline not found: $TimelinePath"
}

$timelineFullPath = (Resolve-Path -LiteralPath $TimelinePath).Path
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path (Split-Path -Parent $timelineFullPath) ".."))
$timeline = Get-Content -LiteralPath $timelineFullPath -Raw -Encoding UTF8 | ConvertFrom-Json
$segments = @($timeline.segments)

if ($segments.Count -lt 1) {
    throw "Timeline must contain at least one segment."
}

$width = [int]$timeline.canvas.width
$height = [int]$timeline.canvas.height
$fps = [int]$timeline.canvas.fps
$transitionSeconds = [double]$timeline.transitionSeconds

if ($width -le 0 -or $height -le 0 -or $fps -le 0) {
    throw "Canvas width, height and fps must be positive."
}
if ([math]::Abs(($width / [double]$height) - (9.0 / 16.0)) -gt 0.002) {
    throw "Canvas must be 9:16. Current canvas is ${width}x${height}."
}
if ($transitionSeconds -lt 0 -or $transitionSeconds -ge 1.5) {
    throw "transitionSeconds must be between 0 and 1.5 seconds."
}

if ([string]::IsNullOrWhiteSpace($AssetsDirectory)) {
    $AssetsDirectory = Join-Path $projectRoot "assets\library"
}
$assetsFullPath = [System.IO.Path]::GetFullPath($AssetsDirectory)

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $timelineOutput = [string]$timeline.output
    if ([System.IO.Path]::IsPathRooted($timelineOutput)) {
        $OutputPath = $timelineOutput
    }
    else {
        $OutputPath = Join-Path $projectRoot $timelineOutput
    }
}
$outputFullPath = [System.IO.Path]::GetFullPath($OutputPath)

$missingAssets = New-Object System.Collections.Generic.List[string]
$assetPaths = New-Object System.Collections.Generic.List[string]
$assetTypes = New-Object System.Collections.Generic.List[string]
$assetHasAudio = New-Object System.Collections.Generic.List[bool]
$videoExtensions = @(".mp4", ".mov", ".m4v", ".webm", ".mkv")
$totalDuration = 0.0

foreach ($segment in $segments) {
    $assetName = [string]$segment.asset
    $duration = [double]$segment.duration

    if ([string]::IsNullOrWhiteSpace($assetName)) {
        throw "Every segment must define an asset filename."
    }
    if ($duration -le $transitionSeconds) {
        throw "Segment '$($segment.id)' duration must be greater than transitionSeconds."
    }

    $assetPath = Join-Path $assetsFullPath $assetName
    $assetPaths.Add($assetPath)
    $extension = [System.IO.Path]::GetExtension($assetName).ToLowerInvariant()
    if ($videoExtensions -contains $extension) {
        $assetTypes.Add("video")
    }
    else {
        $assetTypes.Add("image")
    }
    if (-not (Test-Path -LiteralPath $assetPath -PathType Leaf)) {
        $missingAssets.Add($assetPath)
    }
    $totalDuration += $duration
}

if ($missingAssets.Count -gt 0) {
    $missingList = ($missingAssets | ForEach-Object { "  - $_" }) -join [Environment]::NewLine
    throw "Missing required source media:$([Environment]::NewLine)$missingList$([Environment]::NewLine)Expected every timeline asset in: $assetsFullPath"
}

for ($index = 0; $index -lt $segments.Count; $index++) {
    if ($assetTypes[$index] -eq "video") {
        $assetHasAudio.Add((Test-MediaHasAudioStream -ExecutablePath $FfmpegPath -MediaPath $assetPaths[$index]))
    }
    else {
        $assetHasAudio.Add($false)
    }
}

$voiceoverPath = Find-UsableAudioFile `
    -Directory $assetsFullPath `
    -CandidateNames @("voiceover-en-final.wav", "voiceover-en-final.mp3", "voiceover-en-final.m4a", "voiceover.wav", "voiceover.mp3", "voiceover.m4a") `
    -ExecutablePath $FfmpegPath
$musicPath = Find-UsableAudioFile `
    -Directory $assetsFullPath `
    -CandidateNames @("bgm.mp3", "bgm.wav", "bgm.m4a") `
    -ExecutablePath $FfmpegPath

$fontFullPath = Find-ChineseFont -RequestedPath $FontPath
$finalDuration = $totalDuration - (($segments.Count - 1) * $transitionSeconds)

$filterListOutput = & $FfmpegPath -hide_banner -filters 2>&1 | Out-String
foreach ($requiredFilter in @("drawtext", "zoompan", "xfade")) {
    if ($filterListOutput -notmatch "\b$requiredFilter\b") {
        throw "This FFmpeg build does not include the required '$requiredFilter' filter."
    }
}

Write-Host "Timeline: $timelineFullPath"
Write-Host "Assets:   $assetsFullPath"
Write-Host "Font:     $fontFullPath"
Write-Host ("Video:    {0}x{1}, {2} fps, {3}s" -f $width, $height, $fps, (Format-Number $finalDuration))
Write-Host "Output:   $outputFullPath"

if ($ValidateOnly) {
    Write-Host "Validation passed. No video was rendered."
    exit 0
}

$outputDirectory = Split-Path -Parent $outputFullPath
if (-not (Test-Path -LiteralPath $outputDirectory -PathType Container)) {
    New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
}
if ((Test-Path -LiteralPath $outputFullPath -PathType Leaf) -and -not $Force) {
    throw "Output already exists: $outputFullPath. Pass -Force to overwrite it."
}

$renderRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("comment-video-render-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $renderRoot | Out-Null

try {
    $fontFilterPath = ConvertTo-FilterPath -Path $fontFullPath
    $filters = New-Object System.Collections.Generic.List[string]
    $ffmpegArguments = New-Object System.Collections.Generic.List[string]

    $ffmpegArguments.Add("-hide_banner")
    $ffmpegArguments.Add("-loglevel")
    $ffmpegArguments.Add("warning")
    if ($Force) {
        $ffmpegArguments.Add("-y")
    }
    else {
        $ffmpegArguments.Add("-n")
    }

    for ($index = 0; $index -lt $segments.Count; $index++) {
        $durationText = Format-Number ([double]$segments[$index].duration)
        if ($assetTypes[$index] -eq "video") {
            $ffmpegArguments.Add("-stream_loop")
            $ffmpegArguments.Add("-1")
        }
        else {
            $ffmpegArguments.Add("-loop")
            $ffmpegArguments.Add("1")
            $ffmpegArguments.Add("-framerate")
            $ffmpegArguments.Add([string]$fps)
        }
        $ffmpegArguments.Add("-t")
        $ffmpegArguments.Add($durationText)
        $ffmpegArguments.Add("-i")
        $ffmpegArguments.Add($assetPaths[$index])
    }

    $commentText = [string]$timeline.brief.comment
    $commentAuthor = [string]$timeline.brief.commentAuthor
    $commentBadge = [string](Get-OptionalValue -InputObject $timeline.brief -Name "commentBadge" -DefaultValue "Comment")
    $commentFile = Join-Path $renderRoot "comment.txt"
    $commentAuthorFile = Join-Path $renderRoot "comment-author.txt"
    Write-Utf8NoBom -Path $commentFile -Content $commentText
    Write-Utf8NoBom -Path $commentAuthorFile -Content ($commentAuthor + "  /  " + $commentBadge)
    $commentFilterPath = ConvertTo-FilterPath -Path $commentFile
    $commentAuthorFilterPath = ConvertTo-FilterPath -Path $commentAuthorFile

    for ($index = 0; $index -lt $segments.Count; $index++) {
        $segment = $segments[$index]
        $durationText = Format-Number ([double]$segment.duration)
        $motionName = [string](Get-OptionalValue -InputObject $segment -Name "motion" -DefaultValue "push-in")
        $motion = Get-MotionExpression -Motion $motionName

        $labelFile = Join-Path $renderRoot ("label-{0}.txt" -f $index)
        $subtitleFile = Join-Path $renderRoot ("subtitle-{0}.txt" -f $index)
        Write-Utf8NoBom -Path $labelFile -Content ([string]$segment.label)
        Write-Utf8NoBom -Path $subtitleFile -Content ([string]$segment.subtitle)
        $labelFilterPath = ConvertTo-FilterPath -Path $labelFile
        $subtitleFilterPath = ConvertTo-FilterPath -Path $subtitleFile

        if ($assetTypes[$index] -eq "video") {
            $segmentFilter = (
                "[{0}:v]scale={1}:{2}:force_original_aspect_ratio=increase," +
                "crop={1}:{2},fps={3},trim=duration={4},setpts=PTS-STARTPTS," +
                "setsar=1,format=yuv420p," +
                "drawbox=x=70:y=80:w=500:h=76:color=0xE84A3C@0.96:t=fill," +
                "drawtext=fontfile='{5}':textfile='{6}':expansion=none:fontcolor=white:fontsize=34:" +
                "x=105:y=94:fix_bounds=true"
            ) -f $index, $width, $height, $fps, $durationText, $fontFilterPath, $labelFilterPath
        }
        else {
            $segmentFilter = (
                "[{0}:v]scale={1}:{2}:force_original_aspect_ratio=increase," +
                "crop={1}:{2}," +
                "zoompan=z='{3}':x='{4}':y='{5}':d=1:s={1}x{2}:fps={6}," +
                "trim=duration={7},setpts=PTS-STARTPTS,setsar=1,format=yuv420p," +
                "drawbox=x=70:y=80:w=500:h=76:color=0xE84A3C@0.96:t=fill," +
                "drawtext=fontfile='{8}':textfile='{9}':expansion=none:fontcolor=white:fontsize=34:" +
                "x=105:y=94:fix_bounds=true"
            ) -f $index, $width, $height, $motion.Z, $motion.X, $motion.Y, $fps, $durationText, $fontFilterPath, $labelFilterPath
        }

        $showComment = [bool](Get-OptionalValue -InputObject $segment -Name "showComment" -DefaultValue $false)
        if ($showComment) {
            $segmentFilter += (
                ",drawbox=x=70:y=190:w=940:h=360:color=white@0.94:t=fill," +
                "drawtext=fontfile='{0}':textfile='{1}':expansion=none:fontcolor=0x555555:fontsize=34:" +
                "x=118:y=225:fix_bounds=true," +
                "drawtext=fontfile='{0}':textfile='{2}':expansion=none:fontcolor=0x151515:fontsize=48:" +
                "line_spacing=16:x=118:y=300:fix_bounds=true"
            ) -f $fontFilterPath, $commentAuthorFilterPath, $commentFilterPath
        }

        $segmentFilter += (
            ",drawbox=x=70:y=1450:w=940:h=260:color=black@0.55:t=fill," +
            "drawtext=fontfile='{0}':textfile='{1}':expansion=none:fontcolor=white:fontsize=50:" +
            "line_spacing=14:x=(w-text_w)/2:y=1500:fix_bounds=true," +
            "fps={2}[v{3}]"
        ) -f $fontFilterPath, $subtitleFilterPath, $fps, $index

        $filters.Add($segmentFilter)
    }

    $videoLabel = "v0"
    $currentDuration = [double]$segments[0].duration
    $allowedTransitions = @("fade", "fadeblack", "fadewhite", "slideleft", "slideright", "smoothleft", "smoothright")

    for ($index = 1; $index -lt $segments.Count; $index++) {
        $previousSegment = $segments[$index - 1]
        $transitionName = [string](Get-OptionalValue -InputObject $previousSegment -Name "transitionToNext" -DefaultValue "fade")
        if ($allowedTransitions -notcontains $transitionName) {
            throw "Unsupported transition '$transitionName' in segment '$($previousSegment.id)'."
        }

        $offset = $currentDuration - $transitionSeconds
        $nextLabel = "vx$index"
        $filters.Add(
            (("[{0}][v{1}]xfade=transition={2}:duration={3}:offset={4}," +
                "format=yuv420p,fps={6}[{5}]") -f
                $videoLabel,
                $index,
                $transitionName,
                (Format-Number $transitionSeconds),
                (Format-Number $offset),
                $nextLabel,
                $fps
            )
        )
        $videoLabel = $nextLabel
        $currentDuration += [double]$segments[$index].duration - $transitionSeconds
    }

    $audioInputIndex = $segments.Count
    $audioLabels = New-Object System.Collections.Generic.List[string]
    $finalDurationText = Format-Number $finalDuration

    if ($assetTypes[0] -eq "video" -and $assetHasAudio[0] -and $null -eq $voiceoverPath) {
        $openerDurationText = Format-Number ([double]$segments[0].duration)
        $openerAudioFilter = "[0:a]aresample=48000,volume=1.0,atrim=duration=$openerDurationText,apad," +
            "atrim=duration=$finalDurationText,asetpts=PTS-STARTPTS[openeraudio]"
        $filters.Add($openerAudioFilter)
        $audioLabels.Add("openeraudio")
    }

    if ($null -ne $voiceoverPath) {
        $ffmpegArguments.Add("-i")
        $ffmpegArguments.Add($voiceoverPath)
        $filters.Add(
            ("[{0}:a]aresample=48000,volume=0.98,apad,atrim=duration={1},asetpts=PTS-STARTPTS[voice]" -f
                $audioInputIndex, $finalDurationText)
        )
        $audioLabels.Add("voice")
        $audioInputIndex++
    }

    if ($null -ne $musicPath) {
        $ffmpegArguments.Add("-stream_loop")
        $ffmpegArguments.Add("-1")
        $ffmpegArguments.Add("-i")
        $ffmpegArguments.Add($musicPath)
        $musicFadeStart = Format-Number ([math]::Max(0, $finalDuration - 1.2))
        $musicFilterTemplate =
            "[{0}:a]aresample=48000,volume=0.08,afade=t=out:st={2}:d=1.2," +
            "apad,atrim=duration={1},asetpts=PTS-STARTPTS[music]"
        $filters.Add(
            ($musicFilterTemplate -f $audioInputIndex, $finalDurationText, $musicFadeStart)
        )
        $audioLabels.Add("music")
    }

    if ($audioLabels.Count -gt 1) {
        $audioInputPads = ($audioLabels | ForEach-Object { "[$_]" }) -join ""
        $audioCount = $audioLabels.Count
        $mixedAudioFilter = $audioInputPads + "amix=inputs=${audioCount}:duration=longest:" +
            "dropout_transition=0:normalize=0,alimiter=limit=0.95," +
            "atrim=duration=$finalDurationText[aout]"
        $filters.Add($mixedAudioFilter)
    }
    elseif ($audioLabels.Count -eq 1) {
        $filters.Add("[$($audioLabels[0])]anull[aout]")
    }
    else {
        $filters.Add("anullsrc=channel_layout=stereo:sample_rate=48000,atrim=duration=$finalDurationText[aout]")
    }

    $filterScriptPath = Join-Path $renderRoot "filter-complex.txt"
    Write-Utf8NoBom -Path $filterScriptPath -Content ($filters -join ";`n")

    $ffmpegArguments.Add("-/filter_complex")
    $ffmpegArguments.Add($filterScriptPath)
    $ffmpegArguments.Add("-map")
    $ffmpegArguments.Add("[$videoLabel]")
    $ffmpegArguments.Add("-map")
    $ffmpegArguments.Add("[aout]")
    $ffmpegArguments.Add("-t")
    $ffmpegArguments.Add($finalDurationText)
    $ffmpegArguments.Add("-c:v")
    $ffmpegArguments.Add("libx264")
    $ffmpegArguments.Add("-preset")
    $ffmpegArguments.Add("medium")
    $ffmpegArguments.Add("-crf")
    $ffmpegArguments.Add("20")
    $ffmpegArguments.Add("-pix_fmt")
    $ffmpegArguments.Add("yuv420p")
    $ffmpegArguments.Add("-r")
    $ffmpegArguments.Add([string]$fps)
    $ffmpegArguments.Add("-c:a")
    $ffmpegArguments.Add("aac")
    $ffmpegArguments.Add("-b:a")
    $ffmpegArguments.Add("128k")
    $ffmpegArguments.Add("-movflags")
    $ffmpegArguments.Add("+faststart")
    $ffmpegArguments.Add($outputFullPath)

    Write-Host "Rendering..."
    & $FfmpegPath $ffmpegArguments
    if ($LASTEXITCODE -ne 0) {
        throw "FFmpeg exited with code $LASTEXITCODE. Filter script: $filterScriptPath"
    }

    if (-not (Test-Path -LiteralPath $outputFullPath -PathType Leaf)) {
        throw "FFmpeg completed without creating the expected output."
    }
    $outputFile = Get-Item -LiteralPath $outputFullPath
    if ($outputFile.Length -lt 10240) {
        throw "Rendered file is unexpectedly small ($($outputFile.Length) bytes)."
    }

    Write-Host ("Rendered: {0} ({1:N1} MB)" -f $outputFullPath, ($outputFile.Length / 1MB))
    if ($null -ne $voiceoverPath) {
        Write-Host "Audio: aligned voiceover used for all $($segments.Count) script slots; opener source audio muted."
    }
    elseif ($assetTypes[0] -eq "video" -and $assetHasAudio[0]) {
        Write-Host "Audio: opener source audio preserved."
    }
    elseif ($null -eq $voiceoverPath) {
        Write-Host "Audio: silent AAC track. Add assets/library/voiceover-en-final.wav (or .mp3/.m4a) to include narration."
    }
    if ($null -eq $musicPath) {
        Write-Host "Music: none. Add assets/library/bgm.mp3 (or .wav/.m4a) for an automatic low-volume mix."
    }
}
finally {
    if ($KeepRenderFiles) {
        Write-Host "Render files kept at: $renderRoot"
    }
    elseif (Test-Path -LiteralPath $renderRoot -PathType Container) {
        $resolvedRenderRoot = [System.IO.Path]::GetFullPath($renderRoot)
        $resolvedTempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
        if ($resolvedRenderRoot.StartsWith($resolvedTempRoot, [System.StringComparison]::OrdinalIgnoreCase) -and
            (Split-Path -Leaf $resolvedRenderRoot).StartsWith("comment-video-render-")) {
            Remove-Item -LiteralPath $resolvedRenderRoot -Recurse -Force
        }
    }
}
