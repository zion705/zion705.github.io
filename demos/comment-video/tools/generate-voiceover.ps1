[CmdletBinding()]
param(
    [string]$PlanPath = "",
    [string]$OutputPath = "",
    [string]$FfmpegPath = "D:\23\tmp\video_tools\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe",
    [string]$PythonPath = "",
    [string]$PiperModulePath = "D:\23\tmp\piper_runtime",
    [string]$PiperModelPath = "D:\23\tmp\piper_voice\en_US-lessac-medium.onnx",
    [double]$PiperLengthScale = 0.92,
    [string]$VoiceCulture = "en-US",
    [string]$VoiceName = "Microsoft Zira Desktop",
    [int]$Rate = 1,
    [switch]$ForcePiper,
    [switch]$ValidateOnly,
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-ExistingFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Label
    )
    $resolved = [System.IO.Path]::GetFullPath($Path)
    if (-not (Test-Path -LiteralPath $resolved -PathType Leaf)) {
        throw "$Label is missing: $resolved"
    }
    return $resolved
}

function Get-Executable {
    param([Parameter(Mandatory = $true)][string[]]$Names)
    foreach ($name in $Names) {
        if ([System.IO.Path]::IsPathRooted($name) -and (Test-Path -LiteralPath $name -PathType Leaf)) {
            return [System.IO.Path]::GetFullPath($name)
        }
        $command = Get-Command $name -ErrorAction SilentlyContinue
        if ($null -ne $command) {
            return $command.Source
        }
    }
    throw "Required executable was not found: $($Names -join ', ')"
}

function Get-MediaDuration {
    param(
        [Parameter(Mandatory = $true)][string]$Executable,
        [Parameter(Mandatory = $true)][string]$MediaPath
    )
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $Executable
    $escapedPath = $MediaPath.Replace('"', '\"')
    $startInfo.Arguments = "-hide_banner -i `"$escapedPath`" -f null -"
    $startInfo.UseShellExecute = $false
    $startInfo.RedirectStandardError = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.CreateNoWindow = $true
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $startInfo
    [void]$process.Start()
    $probeText = $process.StandardError.ReadToEnd()
    [void]$process.StandardOutput.ReadToEnd()
    $process.WaitForExit()
    $process.Dispose()
    $match = [System.Text.RegularExpressions.Regex]::Match(
        $probeText,
        "Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)"
    )
    if (-not $match.Success) {
        throw "Could not read synthesized duration: $MediaPath"
    }
    $hours = [double]$match.Groups[1].Value
    $minutes = [double]$match.Groups[2].Value
    $seconds = [double]::Parse(
        $match.Groups[3].Value,
        [System.Globalization.CultureInfo]::InvariantCulture
    )
    return ($hours * 3600) + ($minutes * 60) + $seconds
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)][string]$Executable,
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [Parameter(Mandatory = $true)][string]$Label
    )
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE."
    }
}

$demoDirectory = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
if ([string]::IsNullOrWhiteSpace($PythonPath)) {
    $PythonPath = Join-Path `
        ([Environment]::GetFolderPath("UserProfile")) `
        ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
}
if ([string]::IsNullOrWhiteSpace($PlanPath)) {
    $PlanPath = Join-Path $demoDirectory "assets\output\llm-plan.json"
}
if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $OutputPath = Join-Path $demoDirectory "assets\library\voiceover-en-final.wav"
}

$planFullPath = Resolve-ExistingFile -Path $PlanPath -Label "LLM plan"
$outputFullPath = [System.IO.Path]::GetFullPath($OutputPath)
if ((Test-Path -LiteralPath $outputFullPath -PathType Leaf) -and -not $Force -and -not $ValidateOnly) {
    throw "Voiceover already exists: $outputFullPath. Pass -Force to overwrite it."
}

$plan = Get-Content -LiteralPath $planFullPath -Raw -Encoding UTF8 | ConvertFrom-Json
$outputProperty = $plan.PSObject.Properties["output"]
$planOutput = if ($null -ne $outputProperty -and $null -ne $outputProperty.Value) {
    $outputProperty.Value
}
else {
    $plan
}
$spokenLines = @($planOutput.script.spokenLines)
if (($spokenLines.Count -lt 1) -or ($spokenLines.Count -gt 8)) {
    throw "The LLM plan must contain 1 to 8 spoken lines."
}
$finalDuration = [double]$planOutput.script.durationSec
if ($finalDuration -lt 5 -or $finalDuration -gt 60) {
    throw "Unexpected script duration: $finalDuration"
}

if ($ValidateOnly) {
    Write-Host "Voiceover input validation passed."
    Write-Host "Language: $VoiceCulture"
    Write-Host "Lines:    $($spokenLines.Count)"
    Write-Host "Duration: $finalDuration seconds"
    if ($ForcePiper) {
        Write-Host "Engine:   Piper forced with model: $PiperModelPath"
    }
    else {
        Write-Host "Engine:   System.Speech preferred, Piper fallback."
    }
    exit 0
}

$synthesizer = $null
$selectedVoice = $null
$voiceEngine = "piper"
if (-not $ForcePiper) {
    try {
        Add-Type -AssemblyName System.Speech
        $synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
        $installedVoices = @($synthesizer.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo })
        $selectedVoice = $installedVoices |
            Where-Object { $_.Name -eq $VoiceName } |
            Select-Object -First 1
        if ($null -eq $selectedVoice) {
            $selectedVoice = $installedVoices |
                Where-Object { $_.Culture.Name -eq $VoiceCulture } |
                Select-Object -First 1
        }
        if ($null -ne $selectedVoice) {
            $synthesizer.SelectVoice($selectedVoice.Name)
            $synthesizer.Rate = [math]::Max(-10, [math]::Min(10, $Rate))
            $synthesizer.Volume = 100
            $voiceEngine = "system-speech"
        }
    }
    catch {
        if ($null -ne $synthesizer) {
            $synthesizer.Dispose()
        }
        $synthesizer = $null
        $selectedVoice = $null
    }
}

$python = $null
if ($voiceEngine -eq "piper") {
    if ([string]::IsNullOrWhiteSpace($PiperModelPath)) {
        throw "Piper requires -PiperModelPath. Pass an English Piper .onnx model, for example en_US-lessac-medium.onnx."
    }
    $python = Get-Executable -Names @($PythonPath, "python.exe", "python")
    $piperModule = Join-Path $PiperModulePath "piper\__main__.py"
    if (-not (Test-Path -LiteralPath $piperModule -PathType Leaf)) {
        throw (
            "System.Speech is unavailable and Piper is not installed at " +
            "$PiperModulePath. Install piper-tts there or pass -PiperModulePath."
        )
    }
    $PiperModelPath = Resolve-ExistingFile -Path $PiperModelPath -Label "Piper voice model"
    $piperConfigPath = "$PiperModelPath.json"
    $piperConfigPath = Resolve-ExistingFile -Path $piperConfigPath -Label "Piper voice config"
}

$ffmpeg = Get-Executable -Names @($FfmpegPath, "ffmpeg.exe", "ffmpeg")

$outputDirectory = Split-Path -Parent $outputFullPath
if (-not (Test-Path -LiteralPath $outputDirectory -PathType Container)) {
    New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
}

$temporaryRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("comment-voiceover-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $temporaryRoot | Out-Null
$originalPythonPath = $env:PYTHONPATH

try {
    $audioFiles = New-Object System.Collections.Generic.List[string]
    $filters = New-Object System.Collections.Generic.List[string]
    $ffmpegArguments = New-Object System.Collections.Generic.List[string]
    $ffmpegArguments.Add("-hide_banner")
    $ffmpegArguments.Add("-loglevel")
    $ffmpegArguments.Add("warning")
    $ffmpegArguments.Add("-y")

    for ($index = 0; $index -lt $spokenLines.Count; $index++) {
        $line = $spokenLines[$index]
        $text = [string]$line.text
        if ([string]::IsNullOrWhiteSpace($text)) {
            throw "spokenLines[$index].text is empty."
        }

        $sourcePath = Join-Path $temporaryRoot ("line-{0}.wav" -f $index)
        if ($voiceEngine -eq "system-speech") {
            $synthesizer.SetOutputToWaveFile($sourcePath)
            $synthesizer.Speak($text)
            $synthesizer.SetOutputToNull()
        }
        else {
            $env:PYTHONPATH = if ([string]::IsNullOrWhiteSpace($originalPythonPath)) {
                $PiperModulePath
            }
            else {
                "$PiperModulePath;$originalPythonPath"
            }
            $textPath = Join-Path $temporaryRoot ("line-{0}.txt" -f $index)
            $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
            [System.IO.File]::WriteAllText($textPath, $text, $utf8NoBom)
            Invoke-Checked `
                -Executable $python `
                -Arguments @(
                    "-m",
                    "piper",
                    "--model",
                    $PiperModelPath,
                    "--config",
                    $piperConfigPath,
                    "--input-file",
                    $textPath,
                    "--output-file",
                    $sourcePath,
                    "--length-scale",
                    $PiperLengthScale.ToString(
                        "0.###",
                        [System.Globalization.CultureInfo]::InvariantCulture
                    )
                ) `
                -Label "Piper spokenLines[$index]"
        }
        $audioFiles.Add($sourcePath)

        $sourceDuration = Get-MediaDuration -Executable $ffmpeg -MediaPath $sourcePath

        $startSeconds = [double]$line.startSec
        $endSeconds = [double]$line.endSec
        $slotDuration = $endSeconds - $startSeconds
        if ($slotDuration -le 0) {
            throw "spokenLines[$index] has an invalid time range."
        }

        # Leave a short tail before the next cut. Only speed up when needed.
        $targetDuration = [math]::Max(0.6, $slotDuration - 0.22)
        $tempo = if ($sourceDuration -gt $targetDuration) {
            $sourceDuration / $targetDuration
        }
        else {
            1.0
        }
        if ($tempo -gt 2.0) {
            throw "spokenLines[$index] is too long for its slot after synthesis."
        }

        $ffmpegArguments.Add("-i")
        $ffmpegArguments.Add($sourcePath)
        $lineFilterTemplate =
            "[{0}:a]aresample=48000,atempo={1},volume=0.96," +
            "apad,atrim=duration={2},asetpts=PTS-STARTPTS[line{0}]"
        $tempoText = $tempo.ToString(
            "0.000000",
            [System.Globalization.CultureInfo]::InvariantCulture
        )
        $durationText = $finalDuration.ToString(
            "0.###",
            [System.Globalization.CultureInfo]::InvariantCulture
        )
        $slotDurationText = $slotDuration.ToString(
            "0.###",
            [System.Globalization.CultureInfo]::InvariantCulture
        )
        $formattedLineFilter = $lineFilterTemplate -f `
            $index, $tempoText, $slotDurationText
        $filters.Add($formattedLineFilter)
    }

    $inputPads = (0..($audioFiles.Count - 1) | ForEach-Object { "[line$_]" }) -join ""
    $mixFilterTemplate =
        "concat=n={0}:v=0:a=1," +
        "alimiter=limit=0.95,atrim=duration={1}[voice]"
    $mixDurationText = $finalDuration.ToString(
        "0.###",
        [System.Globalization.CultureInfo]::InvariantCulture
    )
    $formattedMixFilter = $mixFilterTemplate -f $audioFiles.Count, $mixDurationText
    $filters.Add($inputPads + $formattedMixFilter)

    $ffmpegArguments.Add("-filter_complex")
    $ffmpegArguments.Add(($filters -join ";"))
    $ffmpegArguments.Add("-map")
    $ffmpegArguments.Add("[voice]")
    $ffmpegArguments.Add("-c:a")
    $ffmpegArguments.Add("pcm_s16le")
    $ffmpegArguments.Add($outputFullPath)

    Invoke-Checked -Executable $ffmpeg -Arguments $ffmpegArguments.ToArray() -Label "Voiceover mix"

    $file = Get-Item -LiteralPath $outputFullPath
    if ($file.Length -lt 4096) {
        throw "Generated voiceover is unexpectedly small: $($file.Length) bytes."
    }

    Write-Host "Voiceover generated."
    if ($voiceEngine -eq "system-speech") {
        Write-Host "Engine:   System.Speech"
        Write-Host "Voice:    $($selectedVoice.Name)"
    }
    else {
        Write-Host "Engine:   Piper offline"
        Write-Host "Voice:    $([System.IO.Path]::GetFileNameWithoutExtension($PiperModelPath))"
    }
    Write-Host "Output:   $outputFullPath"
    Write-Host "Duration: $finalDuration seconds"
}
finally {
    if ($null -eq $originalPythonPath) {
        Remove-Item Env:PYTHONPATH -ErrorAction SilentlyContinue
    }
    else {
        $env:PYTHONPATH = $originalPythonPath
    }
    if ($null -ne $synthesizer) {
        $synthesizer.Dispose()
    }
    if (Test-Path -LiteralPath $temporaryRoot -PathType Container) {
        $resolvedTemporaryRoot = [System.IO.Path]::GetFullPath($temporaryRoot)
        $resolvedSystemTemp = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
        if ($resolvedTemporaryRoot.StartsWith($resolvedSystemTemp, [System.StringComparison]::OrdinalIgnoreCase)) {
            Remove-Item -LiteralPath $resolvedTemporaryRoot -Recurse -Force
        }
    }
}
