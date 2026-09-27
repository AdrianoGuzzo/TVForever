$ErrorActionPreference = 'Stop'

Write-Host "Building Adriano IPTV..." -ForegroundColor Cyan

# Validate appinfo.json
Write-Host "Validating appinfo.json..." -ForegroundColor Yellow
$appinfo = Get-Content "src/appinfo.json" | ConvertFrom-Json
$required = @("id", "title", "main", "icon", "type", "version")
foreach ($field in $required) {
    if (-not $appinfo.$field) {
        Write-Error "Missing required field in appinfo.json: $field"
        exit 1
    }
}
Write-Host "✓ appinfo.json valid" -ForegroundColor Green

# Run tests
Write-Host "Running tests..." -ForegroundColor Yellow
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Error "Tests failed"
    exit 1
}
Write-Host "✓ Tests passed" -ForegroundColor Green

# Copy to dist
Write-Host "Preparing distribution..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item "dist" -Recurse -Force
}
Copy-Item -Path "src" -Destination "dist" -Recurse

Write-Host "✓ Build complete" -ForegroundColor Green
Write-Host "Output: $(Resolve-Path dist)" -ForegroundColor Cyan
