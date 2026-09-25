# Plays self-play games for HexBot's training on this PC and sends them to the training PC over Hamachi.
# Start it with "Start helper.bat". Close the window to stop; it picks up where it left off next time.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'  # Invoke-WebRequest's progress bar slows downloads to a crawl
$root = $PSScriptRoot
$settings = Get-Content (Join-Path $root 'helper-settings.json') -Raw | ConvertFrom-Json
$server = $settings.server.TrimEnd('/')
$headers = @{ 'X-HexBot-Token' = $settings.token }
$bin = Join-Path $root 'bin'
$env:PATH = "$bin;$env:PATH"  # this window only
$selfplay = Join-Path $bin 'sixselfplay.exe'
$engineHash = (Get-FileHash $selfplay -Algorithm SHA256).Hash.ToLower()
$nets = Join-Path $root 'nets'
$work = Join-Path $root 'work'
New-Item -ItemType Directory -Force $nets, $work | Out-Null

function Say($text) { Write-Host ("{0:HH:mm:ss}  {1}" -f (Get-Date), $text) }

function Send-Games {
    # Uploads every finished batch; a batch whose upload fails stays on disk and is sent next time round.
    foreach ($batch in Get-ChildItem $work -Directory | Sort-Object Name) {
        $generation = [int]($batch.Name -split '-')[1]
        foreach ($file in Get-ChildItem $batch.FullName -Filter 'games-*.jsonl') {
            if ($file.Length -gt 0) {
                $url = "$server/games?generation=$generation&helper=$($settings.name)"
                $result = Invoke-RestMethod -Method Post -Uri $url -Headers $headers -InFile $file.FullName `
                    -ContentType 'application/x-ndjson' -TimeoutSec 300
                if ($result.stale) { Say "generation $generation is too old to use; skipped $($file.Name)" }
                elseif ($result.full) { Say "generation $generation already has enough games" }
                elseif ($result.rejected -gt 0) { Say "sent $($result.games) games ($($result.rejected) rejected)" }
            }
            Remove-Item $file.FullName
        }
        Remove-Item $batch.FullName -Recurse -Force
    }
}

Say "HexBot helper started. Leave this window open; close it to stop."
try {
    $driver = (& nvidia-smi --query-gpu=name,driver_version --format=csv,noheader) -split ',\s*'
    Say "GPU: $($driver[0]), driver $($driver[1])"
    if ([double]($driver[1]) -lt 580) { Say "This NVIDIA driver is too old. Update it (580 or newer), then start again." }
} catch { Say "Could not find an NVIDIA GPU driver (nvidia-smi)." }
$useTrt = $true  # TensorRT is fastest; if it cannot run here, plain CUDA still works
while ($true) {
    try {
        Send-Games
        $status = Invoke-RestMethod -Uri "$server/status" -Headers $headers -TimeoutSec 30
        if ($status.engine -ne $engineHash) {
            Say "The training PC has a newer engine. Download the new helper package, then start again."
            Start-Sleep -Seconds 600
            continue
        }
        if (-not $status.ready -or -not $status.wanted) {
            Say "Generation $($status.generation) has all the games it needs; waiting for the next one."
            Start-Sleep -Seconds 60
            continue
        }
        $g = [int]$status.generation
        $name = 'gen-{0:D4}' -f $g
        $net = Join-Path (Join-Path $nets $name) 'net.onnx'
        if (-not (Test-Path $net)) {
            Say "Downloading generation $g's network"
            New-Item -ItemType Directory -Force (Split-Path $net) | Out-Null
            Invoke-WebRequest -Uri "$server/net/$g" -Headers $headers -OutFile "$net.part" -TimeoutSec 600 -UseBasicParsing
            Move-Item "$net.part" $net -Force
            # Keep the two newest networks (and their TensorRT engines); older ones are never played again.
            Get-ChildItem $nets -Directory | Sort-Object Name -Descending | Select-Object -Skip 2 |
                Remove-Item -Recurse -Force
            Say "First games with a new network wait a minute or two while the GPU prepares it"
        }
        $out = Join-Path $work ('{0}-{1}' -f $name, (Get-Date -Format 'yyyyMMddHHmmss'))
        $s = $status.selfplay
        $seed = Get-Random -Minimum 1 -Maximum 2000000000
        $arguments = @('--net', $net, '--out', $out, '--games', $status.batch, '--threads', $s.threads,
            '--full', $s.full, '--fast', $s.fast, '--full-share', $s.fullShare, '--sampled', $s.sampled,
            '--fast-sampled', $s.fastSampled, '--max-stones', $s.maxStones, '--seed', $seed)
        if ($useTrt) { $arguments += '--trt' }
        Say "Playing $($status.batch) games with generation $g"
        $started = Get-Date
        & $selfplay @arguments | Out-Null
        if ($LASTEXITCODE -ne 0) {
            if ($useTrt) { $useTrt = $false; Say "TensorRT did not work here; carrying on without it (slower)" }
            throw "self-play stopped with code $LASTEXITCODE"
        }
        $minutes = ((Get-Date) - $started).TotalMinutes
        Send-Games
        Say ("Sent {0} games in {1:N1} min" -f $status.batch, $minutes)
    } catch {
        Say "Problem: $($_.Exception.Message). Trying again in a minute."
        Start-Sleep -Seconds 60
    }
}
