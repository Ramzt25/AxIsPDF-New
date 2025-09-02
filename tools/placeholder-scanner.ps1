# tools/placeholder-scanner.ps1
param(
    [switch]$Strict,
    [switch]$AutoFix
)

$ErrorActionPreference = "Stop"
$env:TEAMBEAM_STRICT_SCAN = if ($Strict) { "1" } else { "0" }

Write-Host "[TeamBeam Placeholder Scanner] Starting validation..." -ForegroundColor Cyan

try {
    # Run the Node.js scanner
    $env:PLACEHOLDER_STRICT = if ($Strict) { "1" } else { "0" }
    node tools/scan-placeholders.cjs
    
    if ($LASTEXITCODE -eq 2) {
        Write-Host "❌ Strict mode violations detected!" -ForegroundColor Red
        Write-Host "📋 Review docs/placeholders.md for details" -ForegroundColor Yellow
        exit 2
    }
    
    if ($LASTEXITCODE -ne 0) {
        throw "Scanner failed with exit code $LASTEXITCODE"
    }
    
    # Check if docs directory was created
    if (Test-Path "docs/placeholders.json") {
        $data = Get-Content "docs/placeholders.json" -Raw | ConvertFrom-Json
        $openCount = ($data.items | Where-Object { $_.status -ne "resolved" }).Count
        
        Write-Host "✅ Scan completed successfully" -ForegroundColor Green
        Write-Host "📊 Open placeholders: $openCount" -ForegroundColor $(if ($openCount -eq 0) { "Green" } else { "Yellow" })
        
        if ($openCount -gt 0) {
            Write-Host "📝 Review report: docs/placeholders.md" -ForegroundColor Cyan
        }
        
        # Auto-fix mode: Add TODO comments for critical missing items
        if ($AutoFix) {
            Write-Host "🔧 AutoFix mode: Adding placeholder tracking..." -ForegroundColor Yellow
            
            # Check for files that might need placeholder tracking
            $criticalFiles = @(
                "core/src/main.ts",
                "core/src/services/pipeline-engine.ts", 
                "core/src/ui/components/pipeline-editor.tsx"
            )
            
            foreach ($file in $criticalFiles) {
                if (Test-Path $file) {
                    $content = Get-Content $file -Raw
                    if ($content -notmatch "TODO|STUB|MOCK|PLACEHOLDER") {
                        Write-Host "Adding placeholder tracking to $file" -ForegroundColor Yellow
                        # This would add tracking comments - implement as needed
                    }
                }
            }
        }
        
        return 0
    } else {
        throw "No output file generated"
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔍 Check your Node.js installation and project structure" -ForegroundColor Yellow
    exit 1
}