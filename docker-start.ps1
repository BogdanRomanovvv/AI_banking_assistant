# Banking AI Assistant - Docker Start Script

Write-Host "Banking AI Assistant - Docker Start" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

# Проверка Docker
Write-Host "Checking Docker..." -ForegroundColor Cyan
$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "Error: Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "Docker is running" -ForegroundColor Green
Write-Host ""

# Проверка .env файла
if (-not (Test-Path ".env")) {
    Write-Host "Warning: .env file not found!" -ForegroundColor Yellow
    Write-Host "Creating .env from template..." -ForegroundColor Cyan
    Copy-Item .env.docker .env
    Write-Host ""
    Write-Host "Please edit .env file and add your Yandex GPT credentials:" -ForegroundColor Yellow
    Write-Host "  - YANDEX_API_KEY" -ForegroundColor White
    Write-Host "  - YANDEX_FOLDER_ID" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 0
}

# Запуск Docker Compose
Write-Host "Starting services with Docker Compose..." -ForegroundColor Cyan
docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "====================================" -ForegroundColor Green
    Write-Host "Services started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access URLs:" -ForegroundColor Yellow
    Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
    Write-Host "  Backend:   http://localhost:8000" -ForegroundColor White
    Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor White
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor Cyan
    Write-Host "  View logs:     docker-compose logs -f" -ForegroundColor White
    Write-Host "  Stop:          docker-compose stop" -ForegroundColor White
    Write-Host "  Restart:       docker-compose restart" -ForegroundColor White
    Write-Host "  Full cleanup:  docker-compose down -v" -ForegroundColor White
    Write-Host ""
}
else {
    Write-Host ""
    Write-Host "Error: Failed to start services!" -ForegroundColor Red
    Write-Host "Check the logs with: docker-compose logs" -ForegroundColor Yellow
}
