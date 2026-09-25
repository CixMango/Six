# Stops the self-play learning loop and whatever it is running (self-play, training, a match).
#   powershell -ExecutionPolicy Bypass -File trainer\stop_loop.ps1
# Finished games are already on disk; self-play plays the remaining ones when the loop restarts.
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$running = @(Get-CimInstance Win32_Process -Filter "Name='python.exe'" | Where-Object { $_.CommandLine -match 'trainer.loop\.py' })
if (-not $running) { 'the loop is not running'; exit 0 }
foreach ($process in $running) {
  & taskkill.exe /PID $process.ProcessId /T /F | Out-Null  # /T: include child processes
  "stopped the loop (pid $($process.ProcessId))"
}
