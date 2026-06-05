# Script para detectar posibles imports/variables no usados
Write-Host "Buscando posibles imports no usados..." -ForegroundColor Cyan

$potentialIssues = @()

# Patrón 1: Buscar archivos que importan cosas específicas que suelen quedar sin usar
$commonUnused = @{
    'Link' = 'next/link'
    'Head' = 'next/head'
    'useEffect' = 'react'
    'useState' = 'react'
}

foreach ($item in $commonUnused.GetEnumerator()) {
    $files = Get-ChildItem -Recurse -Include *.tsx,*.ts -Path components,pages,lib |
        Select-String -Pattern "import.*$($item.Key).*from.*'$($item.Value)'" |
        Select-Object -ExpandProperty Path -Unique
    
    foreach ($file in $files) {
        $content = Get-Content $file -Raw
        # Check if the imported item is actually used
        $pattern = "<$($item.Key)|$($item.Key)\(|$($item.Key)\."
        if ($content -notmatch $pattern -or $content -match "import {[^}]*$($item.Key)[^}]*} from") {
            # Might be unused, check more carefully
            $lines = $content -split "`n"
            $importLine = $lines | Where-Object { $_ -match "import.*$($item.Key)" } | Select-Object -First 1
            if ($importLine) {
                $potentialIssues += [PSCustomObject]@{
                    File = $file
                    Import = $item.Key
                    Line = $importLine.Trim()
                }
            }
        }
    }
}

if ($potentialIssues.Count -gt 0) {
    Write-Host "`nPotenciales imports no usados encontrados:" -ForegroundColor Yellow
    $potentialIssues | Format-Table -AutoSize
} else {
    Write-Host "`nNo se encontraron problemas obvios." -ForegroundColor Green
}

Write-Host "`nEsto es solo una detección aproximada." -ForegroundColor Gray
Write-Host "El build de Vercel encontrará los errores exactos." -ForegroundColor Gray
