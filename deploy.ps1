# Blockchain Dashboard Deploy Script for Windows
# Run as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Blockchain Dashboard Deploy Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Set-Location $ScriptDir

Write-Host ""
Write-Host "[1/5] Checking prerequisites..." -ForegroundColor Yellow

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker is required but not installed. Aborting." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "Docker Compose is required but not installed. Aborting." -ForegroundColor Red
    exit 1
}

Write-Host "[2/5] Checking environment..." -ForegroundColor Yellow

if (-not (Test-Path "$ScriptDir\backend\.env")) {
    Write-Host "Creating .env from .env.example..." -ForegroundColor Cyan
    Copy-Item "$ScriptDir\backend\.env.example" "$ScriptDir\backend\.env"
    Write-Host "Please edit backend\.env and set your ENCRYPTION_KEY" -ForegroundColor Green
}

Write-Host "[3/5] Building Docker images..." -ForegroundColor Yellow
docker-compose build

Write-Host "[4/5] Starting services..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "[5/5] Checking status..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
docker-compose ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "API:      http://localhost:8000/api" -ForegroundColor Cyan
Write-Host "Health:   http://localhost:8000/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view logs: docker-compose logs -f" -ForegroundColor Gray
Write-Host "To stop:     docker-compose down" -ForegroundColor Gray
Write-Host ""
