# Starts the self-play loop as a detached process. It resumes from runs/rl/state.json; progress goes to runs\rl\log.txt.
#   powershell -ExecutionPolicy Bypass -File trainer\start_loop.ps1
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$running = Get-CimInstance Win32_Process -Filter "Name='python.exe'" | Where-Object { $_.CommandLine -match 'trainer.loop\.py' }
if ($running) {
  "the loop is already running (pid $($running.ProcessId -join ', ')); stop it first with trainer\stop_loop.ps1"
  exit 1
}

$python = Join-Path $root '.venv\Scripts\python.exe'
$arguments = @('trainer\loop.py')
if (-not (Test-Path (Join-Path $root 'runs\rl\gen-0000\net.pt'))) {
  $arguments += @('--start', 'runs\v1-mixed\best.pt')  # the first generation is the warm-start network
}
New-Item -ItemType Directory -Force (Join-Path $root 'runs\rl') | Out-Null
$process = Start-Process -FilePath $python -ArgumentList $arguments -WorkingDirectory $root -WindowStyle Hidden -PassThru `
  -RedirectStandardOutput (Join-Path $root 'runs\rl\loop-console.txt') -RedirectStandardError (Join-Path $root 'runs\rl\loop-errors.txt')
"learning loop started (pid $($process.Id))"
