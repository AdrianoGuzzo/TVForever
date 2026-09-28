$ErrorActionPreference = 'Stop'

Write-Host "Packaging Adriano IPTV..." -ForegroundColor Cyan

# Ensure dist exists
if (-not (Test-Path "dist")) {
    Write-Host "Running build first..." -ForegroundColor Yellow
    & "$PSScriptRoot/build.ps1"
    if ($LASTEXITCODE -ne 0) {
        exit 1
    }
}

# Verify ares-package is available
ares-package --version | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "ares-package not found. Install webOS CLI: npm install -g @webos-tools/cli"
    exit 1
}

# Verify dist directory and files
if (-not (Test-Path "dist/appinfo.json")) {
    Write-Error "dist/appinfo.json not found. Build may have failed."
    exit 1
}

Write-Host "Creating .ipk..." -ForegroundColor Yellow

# Package - use relative path
Push-Location dist
ares-package .
$result = $LASTEXITCODE
Pop-Location

if ($result -ne 0) {
    Write-Error "ares-package failed with exit code $result"
    exit 1
}

Write-Host "[OK] Package created" -ForegroundColor Green
