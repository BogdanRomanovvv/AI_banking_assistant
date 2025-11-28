# Banking AI Assistant - Docker Stop Script

Write-Host "Banking AI Assistant - Docker Stop" -ForegroundColor Yellow
Write-Host "===================================" -ForegroundColor Yellow
Write-Host ""

$choice = Read-Host "Stop services? (keep data) [y/N] or Full cleanup? (remove data) [c]"

if ($choice -eq "c" -or $choice -eq "C") {
    Write-Host ""
    Write-Host "Stopping and removing all containers and volumes..." -ForegroundColor Red
    docker-compose down -v
    Write-Host ""
    Write-Host "Full cleanup complete! All data removed." -ForegroundColor Red
} elseif ($choice -eq "y" -or $choice -eq "Y") {
    Write-Host ""
    Write-Host "Stopping services..." -ForegroundColor Yellow
    docker-compose stop
    Write-Host ""
    Write-Host "Services stopped. Data preserved." -ForegroundColor Green
    Write-Host "Use 'docker-compose start' to resume." -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Operation cancelled." -ForegroundColor White
}
