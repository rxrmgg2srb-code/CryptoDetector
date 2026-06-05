# Script para verificar configuración de .env.local
Write-Host "=== Verificando configuración de .env.local ===" -ForegroundColor Cyan
Write-Host ""

$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ ERROR: Archivo .env.local no encontrado" -ForegroundColor Red
    exit 1
}

$content = Get-Content $envFile -Raw

# Variables requeridas
$required = @{
    "DATABASE_URL" = "Conexión a Supabase (Connection pooling)"
    "DIRECT_URL" = "Conexión directa a Supabase"
    "HELIUS_API_KEY" = "API key de Helius"
    "NEXT_PUBLIC_HELIUS_RPC_URL" = "RPC URL de Helius"
    "NEXT_PUBLIC_TREASURY_WALLET" = "Tu wallet de Solana"
    "TREASURY_WALLET" = "Tu wallet de Solana (duplicado)"
    "NEXT_PUBLIC_JWT_SECRET" = "Secret para JWT (ya configurado)"
}

# Variables opcionales
$optional = @{
    "UPSTASH_REDIS_REST_URL" = "Redis cache (mejora rendimiento)"
    "UPSTASH_REDIS_REST_TOKEN" = "Token de Redis"
    "OPENAI_API_KEY" = "OpenAI API (para AI features)"
}

Write-Host "📋 Variables REQUERIDAS:" -ForegroundColor Yellow
Write-Host ""

$allGood = $true
foreach ($key in $required.Keys) {
    if ($content -match "$key=([^\r\n]+)") {
        $value = $matches[1]
        if ($value -match "TU_|XXXXX|AQUI" -or $value -eq "") {
            Write-Host "  ❌ $key" -ForegroundColor Red
            Write-Host "     → $($required[$key])" -ForegroundColor Gray
            $allGood = $false
        } else {
            Write-Host "  ✅ $key" -ForegroundColor Green
        }
    } else {
        Write-Host "  ❌ $key (no encontrado)" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""
Write-Host "📦 Variables OPCIONALES:" -ForegroundColor Yellow
Write-Host ""

foreach ($key in $optional.Keys) {
    if ($content -match "$key=([^\r\n]+)") {
        $value = $matches[1]
        if ($value -notmatch "TU_|XXXXX|AQUI" -and $value -ne "") {
            Write-Host "  ✅ $key" -ForegroundColor Green
        } else {
            Write-Host "  ⚪ $key (no configurado)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ⚪ $key (no configurado)" -ForegroundColor Gray
    }
}

Write-Host ""
if ($allGood) {
    Write-Host "🎉 ¡Configuración completa! Puedes ejecutar: npm run dev" -ForegroundColor Green
} else {
    Write-Host "⚠️  Faltan variables requeridas. Revisa la guía en ENV_SETUP_GUIDE.md" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pasos siguientes:" -ForegroundColor Cyan
    Write-Host "1. Abre .env.local en tu editor" -ForegroundColor White
    Write-Host "2. Busca las líneas marcadas con ❌" -ForegroundColor White
    Write-Host "3. Reemplaza los valores TU_XXX_AQUI con tus credenciales reales" -ForegroundColor White
    Write-Host "4. Ejecuta este script nuevamente para verificar" -ForegroundColor White
}
