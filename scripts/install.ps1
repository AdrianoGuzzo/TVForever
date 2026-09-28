$ErrorActionPreference = 'Stop'

# Get device from environment
$Device = $env:DEV_DEVICE
if (-not $Device) {
    Write-Error "Error: Device parameter is required (set DEV_DEVICE environment variable)"
    exit 1
}

Write-Host "Installing Adriano IPTV to device: $Device" -ForegroundColor Cyan

# Verify ares-install is available
$aresCheck = ares-install --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "ares-install not found. Install webOS CLI: npm install -g @webos-tools/cli"
    exit 1
}

# Find .ipk if not specified in environment
$IpkPath = $env:IPK_PATH
if (-not $IpkPath) {
    $ipk = Get-ChildItem "." -Filter "*.ipk" -Recurse | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $ipk) {
        Write-Error "No .ipk file found. Run build first: npm run build"
        exit 1
    }
    $IpkPath = $ipk.FullName
}

$IpkPath = Resolve-Path $IpkPath

Write-Host "Installing: $IpkPath" -ForegroundColor Yellow
ares-install "$IpkPath" --device "$Device"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Installation failed"
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "- Check device is listed: ares-setup-device --list"
    Write-Host "- Verify TV is on and connected to network"
    Write-Host "- Check Key Server is enabled on TV"
    exit 1
}

Write-Host "[OK] Installation complete" -ForegroundColor Green
