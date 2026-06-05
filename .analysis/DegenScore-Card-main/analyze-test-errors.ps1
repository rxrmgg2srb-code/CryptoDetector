# Script to analyze test errors and group them by type
Write-Host "Running tests and analyzing errors..." -ForegroundColor Cyan

# Run tests and capture output
$testOutput = npm test -- --passWithNoTests 2>&1 | Out-String

# Extract summary
$summary = $testOutput | Select-String -Pattern "Test Suites:.*|Tests:.*" | Select-Object -Last 2
Write-Host "`n=== TEST SUMMARY ===" -ForegroundColor Yellow
$summary | ForEach-Object { Write-Host $_.Line }

# Group errors by type
Write-Host "`n=== ERROR ANALYSIS ===" -ForegroundColor Yellow
$errors = $testOutput | Select-String -Pattern "TypeError:|Error:|Cannot find module" | 
    Group-Object @{Expression={
        if ($_.Line -match "Cannot read properties of undefined \(reading '(\w+)'\)") {
            "undefined.$($matches[1])"
        }
        elseif ($_.Line -match "Cannot find module '([^']+)'") {
            "Module: $($matches[1])"
        }
        else {
            $_.Line -replace '^\s+at.*', '' | Select-Object -First 1
        }
    }} |
    Sort-Object Count -Descending |
    Select-Object -First 15

$errors | ForEach-Object {
    Write-Host "`n[$($_.Count) occurrences] $($_.Name)" -ForegroundColor Red
}

Write-Host "`n=== TOP FAILING TEST FILES ===" -ForegroundColor Yellow
$failingFiles = $testOutput | Select-String -Pattern "● .* › .*|FAIL .*\.test\.(ts|tsx)" |
    ForEach-Object { 
        if ($_.Line -match "FAIL (.*)") {
            $matches[1]
        }
    } |
    Group-Object |
    Sort-Object Count -Descending |
    Select-Object -First 10

$failingFiles | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor Magenta
}

Write-Host "`nAnalysis complete!" -ForegroundColor Green
