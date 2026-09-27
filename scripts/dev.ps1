$ErrorActionPreference = 'Stop'

param(
    [Parameter(Mandatory=$true)]
    [string]$Device,

    [switch]$Inspect
)

Write-Host "Development workflow: build → package → install → launch" -ForegroundColor Cyan

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
& "$PSScriptRoot/install.ps1" -Device "$Device"
if ($LASTEXITCODE -ne 0) { exit 1 }

# Launch
Write-Host "`n[4/4] Launching..." -ForegroundColor Yellow
$args = @("-Device", $Device)
if ($Inspect) { $args += "-Inspect" }
& "$PSScriptRoot/launch.ps1" @args
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`n✓ Complete!" -ForegroundColor Green
