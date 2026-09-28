$ErrorActionPreference = 'Stop'

# Get arguments from environment variables
$Device = $env:DEV_DEVICE
$Inspect = $env:DEV_INSPECT -eq '1'

if (-not $Device) {
    Write-Error "Error: Device parameter is required"
    exit 1
}

Write-Host "Development workflow: build -> package -> install -> launch" -ForegroundColor Cyan

# Build
Write-Host "`n[1/4] Building..." -ForegroundColor Yellow
& "$PSScriptRoot/build.ps1"
if ($LASTEXITCODE -ne 0) { exit 1 }

# Package
Write-Host "`n[2/4] Packaging..." -ForegroundColor Yellow
& "$PSScriptRoot/package.ps1"
if ($LASTEXITCODE -ne 0) { exit 1 }

# Install
Write-Host "`n[3/4] Installing..." -ForegroundColor Yellow
$env:DEV_DEVICE = $Device
& "$PSScriptRoot/install.ps1"
if ($LASTEXITCODE -ne 0) { exit 1 }

# Launch
Write-Host "`n[4/4] Launching..." -ForegroundColor Yellow
$env:DEV_DEVICE = $Device
$env:DEV_INSPECT = if ($Inspect) { '1' } else { '0' }
& "$PSScriptRoot/launch.ps1"
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`n[OK] Complete!" -ForegroundColor Green
