# Environment Validation Script
# Run this on server startup to ensure all required env vars are set

$required_vars = @(
    "DATABASE_URL",
    "DIRECT_URL",
    "HELIUS_API_KEY",
    "NEXT_PUBLIC_TREASURY_WALLET",
    "JWT_SECRET",
    "NEXTAUTH_SECRET"
)

$optional_vars = @(
    "UPSTASH_REDIS_URL",
    "UPSTASH_REDIS_TOKEN",
    "SENTRY_DSN",
    "PUSHER_APP_ID",
    "OPENAI_API_KEY"
)

Write-Host "🔍 Validating Environment Variables..." -ForegroundColor Cyan
Write-Host ""

$missing = @()
$weak = @()

foreach ($var in $required_vars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    
    if ([string]::IsNullOrEmpty($value)) {
        Write-Host "❌ MISSING: $var" -ForegroundColor Red
        $missing += $var
    }
    elseif ($value -like "*CHANGE_THIS*" -or $value -like "*your-*-here*" -or $value -like "*placeholder*") {
        Write-Host "⚠️  WEAK: $var (using placeholder value)" -ForegroundColor Yellow
        $weak += $var
    }
    else {
        # Validate specific formats
        if ($var -eq "JWT_SECRET" -and $value.Length -lt 32) {
            Write-Host "⚠️  WEAK: $var (too short, minimum 32 chars)" -ForegroundColor Yellow
            $weak += $var
        }
        elseif ($var -eq "DATABASE_URL" -and -not ($value -like "postgres*")) {
            Write-Host "⚠️  INVALID: $var (must start with postgresql://)" -ForegroundColor Yellow
            $weak += $var
        }
        else {
            $masked = $value.Substring(0, [Math]::Min(8, $value.Length)) + "..."
            Write-Host "✅ OK: $var = $masked" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "📋 Optional Variables:" -ForegroundColor Cyan

foreach ($var in $optional_vars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    
    if ([string]::IsNullOrEmpty($value)) {
        Write-Host "⚪ NOT SET: $var (optional)" -ForegroundColor Gray
    }
    else {
        $masked = $value.Substring(0, [Math]::Min(8, $value.Length)) + "..."
        Write-Host "✅ SET: $var = $masked" -ForegroundColor Green
    }
}

Write-Host ""

if ($missing.Count -gt 0) {
    Write-Host "❌ VALIDATION FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Missing required variables:" -ForegroundColor Red
    foreach ($var in $missing) {
        Write-Host "  - $var" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please set these in your .env.local file" -ForegroundColor Yellow
    exit 1
}

if ($weak.Count -gt 0) {
    Write-Host "⚠️  WARNING: Weak/Placeholder Values Detected" -ForegroundColor Yellow
    Write-Host ""
    foreach ($var in $weak) {
        Write-Host "  - $var" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "These should be replaced in production!" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "✅ Environment validation passed!" -ForegroundColor Green
Write-Host ""

exit 0
