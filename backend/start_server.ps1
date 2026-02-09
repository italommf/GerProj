# Script para iniciar o servidor Django
param(
    [int]$Port = 8000
)

Write-Host "Verificando se a porta $Port esta livre..." -ForegroundColor Yellow

$connections = netstat -ano | findstr ":$Port" | findstr LISTENING

if ($connections) {
    Write-Host "ERRO: A porta $Port esta em uso!" -ForegroundColor Red
    Write-Host "`nProcessos usando a porta:" -ForegroundColor Yellow
    $connections | ForEach-Object {
        $parts = $_ -split '\s+'
        $pid = $parts[-1]
        if ($pid -match '^\d+$') {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "  PID: $pid - $($process.ProcessName)" -ForegroundColor Yellow
            }
        }
    }
    Write-Host "`nOpcoes:" -ForegroundColor Cyan
    Write-Host "  1. Execute: .\stop_server.ps1 para parar os processos" -ForegroundColor White
    Write-Host "  2. Use outra porta: .\start_server.ps1 -Port 8001" -ForegroundColor White
    exit 1
}

Write-Host "Porta $Port esta livre. Iniciando servidor..." -ForegroundColor Green
Write-Host "`nServidor Django rodando em: http://127.0.0.1:$Port" -ForegroundColor Cyan
Write-Host "Pressione Ctrl+C para parar`n" -ForegroundColor Yellow

python manage.py runserver $Port
