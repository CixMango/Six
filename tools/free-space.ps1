# Frees disk space by removing only files HexBot rebuilds by itself. Nothing irreplaceable is touched:
# every generation's weights (net.pt), all game records, the helper zip and the current networks stay.
#   - TensorRT caches (net.onnx.trt) of old generations: rebuilt in about a minute if that network is ever played again
#   - ONNX exports (net.onnx) of old generations that still have net.pt: trainer/export.py remakes them from net.pt
#   - dist\hexbot-helper and dist\parts: package.py rebuilds both; dist\hexbot-helper.zip is kept
# Kept whole: the newest 13 generations, every 10th, and the ones used as benchmarks.
#   powershell -ExecutionPolicy Bypass -File tools\free-space.ps1          (shows what it would remove)
#   powershell -ExecutionPolicy Bypass -File tools\free-space.ps1 -Apply   (removes it)
param([switch]$Apply)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$rl = Join-Path $repo 'runs\rl'
$current = (Get-Content (Join-Path $rl 'state.json') -Raw | ConvertFrom-Json).generation
$keep = @(94, 120, 137, 140, 156, 164, 172, 175, 191, 207, 282) + (($current - 12)..($current + 1))

$targets = @()
foreach ($dir in Get-ChildItem $rl -Directory -Filter 'gen-*') {
    $g = [int]($dir.Name -replace 'gen-', '')
    if ($g -in $keep) { continue }
    $trt = Join-Path $dir.FullName 'net.onnx.trt'
    if (Test-Path $trt) { $targets += $trt }
    $onnx = Join-Path $dir.FullName 'net.onnx'
    if ($g % 10 -ne 0 -and (Test-Path $onnx) -and (Test-Path (Join-Path $dir.FullName 'net.pt'))) { $targets += $onnx }
}
foreach ($extra in 'dist\hexbot-helper', 'dist\parts') {
    $path = Join-Path $repo $extra
    if (Test-Path $path) { $targets += $path }
}

$bytes = 0
foreach ($t in $targets) {
    $item = Get-Item $t
    $bytes += if ($item.PSIsContainer) { (Get-ChildItem $t -Recurse -File | Measure-Object Length -Sum).Sum } else { $item.Length }
}
"{0} items, {1:N2} GB (current generation {2})" -f $targets.Count, ($bytes / 1GB), $current
if (-not $Apply) { 'Nothing removed. Run again with -Apply to remove them.'; exit 0 }
foreach ($t in $targets) { Remove-Item $t -Recurse -Force }
"Removed. {0:N2} GB freed." -f ($bytes / 1GB)
