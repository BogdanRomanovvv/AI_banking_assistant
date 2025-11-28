# Banking AI Assistant - Quick Start Script

Write-Host "Banking AI Assistant - Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# Backend setup
Write-Host "[1/4] Setting up Backend..." -ForegroundColor Cyan
Set-Location backend

if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

Write-Host "Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host ""
Write-Host "[2/4] Backend setup complete!" -ForegroundColor Green
Write-Host ""

# Frontend setup
Write-Host "[3/4] Setting up Frontend..." -ForegroundColor Cyan
Set-Location ..\frontend

Write-Host "Installing Node dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "[4/4] Frontend setup complete!" -ForegroundColor Green
Write-Host ""

Set-Location ..

Write-Host "================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Create PostgreSQL database 'banking_ai'" -ForegroundColor White
Write-Host "2. Configure backend\.env with your Yandex GPT credentials" -ForegroundColor White
Write-Host "3. Run .\start.ps1 to start both servers" -ForegroundColor White
Write-Host ""
