$ErrorActionPreference = 'Stop'

param(
    [string]$OutDir = "."
)

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
$aresCheck = ares-package --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "ares-package not found. Install webOS CLI: npm install -g @webos-tools/cli"
    exit 1
}

Write-Host "Using: $aresCheck" -ForegroundColor Yellow

# Package
Write-Host "Creating .ipk..." -ForegroundColor Yellow
$OutPath = Resolve-Path $OutDir
ares-package "dist" -o "$OutPath"

if ($LASTEXITCODE -ne 0) {
    Write-Error "ares-package failed"
    exit 1
}

# Find generated .ipk
$ipk = Get-ChildItem "$OutPath" -Filter "*.ipk" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($ipk) {
    Write-Host "✓ Package created: $($ipk.FullName)" -ForegroundColor Green
} else {
    Write-Error "No .ipk file found after packaging"
    exit 1
}
