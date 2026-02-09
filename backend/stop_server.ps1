# Script para parar processos usando a porta 8000
Write-Host "Verificando processos na porta 8000..." -ForegroundColor Yellow

$port = 8000
$connections = netstat -ano | findstr ":$port" | findstr LISTENING

if ($connections) {
    Write-Host "Processos encontrados na porta $port:" -ForegroundColor Red
    $connections | ForEach-Object {
        $parts = $_ -split '\s+'
        $pid = $parts[-1]
        if ($pid -match '^\d+$') {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "  PID: $pid - Processo: $($process.ProcessName) - Caminho: $($process.Path)" -ForegroundColor Yellow
                $response = Read-Host "Deseja parar este processo? (S/N)"
                if ($response -eq 'S' -or $response -eq 's') {
                    Stop-Process -Id $pid -Force
                    Write-Host "  Processo $pid parado com sucesso!" -ForegroundColor Green
                }
            }
        }
    }
} else {
    Write-Host "Nenhum processo encontrado na porta $port" -ForegroundColor Green
}

Write-Host "`nVerificando novamente..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
$remaining = netstat -ano | findstr ":$port" | findstr LISTENING
if ($remaining) {
    Write-Host "Ainda há processos na porta $port" -ForegroundColor Red
} else {
    Write-Host "Porta $port esta livre!" -ForegroundColor Green
}
