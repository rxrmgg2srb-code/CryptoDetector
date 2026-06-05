# Script para eliminar imports no usados conocidos
$files = @(
    @{
        Path = "pages\index.tsx"
        Remove = "import Link from 'next/link';"
    },
    @{
        Path = "components\LeaderboardContent.tsx"
        Remove = "import { BadgesDisplay } from '../components/BadgesDisplay';"
    }
)

foreach ($file in $files) {
    $fullPath = $file.Path
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        $newContent = $content -replace [regex]::Escape($file.Remove), ""
        $newContent = $newContent -replace "\r?\n\r?\n\r?\n", "`r`n`r`n"  # Remove extra blank lines
        $newContent | Set-Content $fullPath -NoNewline
        Write-Host "✅ Fixed: $fullPath"
    }
}

Write-Host "`nDone! Run git diff to see changes."
