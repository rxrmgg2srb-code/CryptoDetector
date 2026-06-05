# Script para actualizar HELIUS_API_KEY en .env.local
# Ejecutar con: .\update-helius-key.ps1

$envFilePath = ".env.local"

# Leer el archivo .env.local si existe
if (Test-Path $envFilePath) {
    $content = Get-Content $envFilePath -Raw
} else {
    $content = ""
}

# API Key de Helius
$heliusApiKey = "d65a816a-162e-4dd6-9841-c607146e03e3"
$heliusRpcUrl = "https://mainnet.helius-rpc.com/?api-key=$heliusApiKey"

# Actualizar o agregar HELIUS_API_KEY
if ($content -match "HELIUS_API_KEY=") {
    $content = $content -replace "HELIUS_API_KEY=.*", "HELIUS_API_KEY=$heliusApiKey"
    Write-Host "✅ HELIUS_API_KEY actualizada" -ForegroundColor Green
} else {
    $content += "`nHELIUS_API_KEY=$heliusApiKey`n"
    Write-Host "✅ HELIUS_API_KEY agregada" -ForegroundColor Green
}

# Actualizar o agregar HELIUS_RPC_URL
if ($content -match "HELIUS_RPC_URL=") {
    $content = $content -replace "HELIUS_RPC_URL=.*", "HELIUS_RPC_URL=$heliusRpcUrl"
    Write-Host "✅ HELIUS_RPC_URL actualizada" -ForegroundColor Green
} else {
    $content += "HELIUS_RPC_URL=$heliusRpcUrl`n"
    Write-Host "✅ HELIUS_RPC_URL agregada" -ForegroundColor Green
}

# Guardar el archivo
$content | Set-Content $envFilePath -NoNewline

Write-Host "`n🎉 Configuración de Helius completada en .env.local" -ForegroundColor Cyan
Write-Host "   API Key: $heliusApiKey" -ForegroundColor Gray
Write-Host "`n💡 Ahora puedes ejecutar: npx tsx scripts/ejemplo-helius-defi.ts" -ForegroundColor Yellow
