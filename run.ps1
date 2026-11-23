Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  DONOR LEAGUE - Starting Full Platform" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

$backendDir = Join-Path $PSScriptRoot "backend"
$frontendDir = Join-Path $PSScriptRoot "frontend"

Write-Host "`n[1/2] Launching Backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendDir'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Write-Host "[2/2] Launching Frontend on http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendDir'; npm.cmd run dev"

Write-Host "`nServices are launching! Opening browser..." -ForegroundColor Green
Write-Host "`n>>> SINGLE LINK: http://localhost:3000 <<<`n" -ForegroundColor Cyan

Start-Sleep -Seconds 4
Start-Process "http://localhost:3000"
