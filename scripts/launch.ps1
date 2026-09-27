$ErrorActionPreference = 'Stop'

param(
    [Parameter(Mandatory=$true)]
    [string]$Device,

    [switch]$Inspect
)

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
