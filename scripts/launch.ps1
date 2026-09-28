$ErrorActionPreference = 'Stop'

# Get device from environment
$Device = $env:DEV_DEVICE
if (-not $Device) {
    Write-Error "Error: Device parameter is required (set DEV_DEVICE environment variable)"
    exit 1
}

$Inspect = $env:DEV_INSPECT -eq '1'

Write-Host "Launching Adriano IPTV on device: $Device" -ForegroundColor Cyan

# Verify ares-launch is available
$aresCheck = ares-launch --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "ares-launch not found. Install webOS CLI: npm install -g @webos-tools/cli"
    exit 1
}

# Launch
Write-Host "Launching app..." -ForegroundColor Yellow
ares-launch --device "$Device" "com.adriano.iptv"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Launch failed"
    exit 1
}

Write-Host "[OK] App launched" -ForegroundColor Green

# Open inspector if requested
if ($Inspect) {
    Write-Host "Opening Web Inspector..." -ForegroundColor Yellow
    Start-Sleep -Seconds 1
    ares-inspect --device "$Device" --app "com.adriano.iptv" --open
}
