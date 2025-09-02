# TeamBeam Package Script
# Creates distributable packages for Windows

param(
    [string]$Target = "win",    # win, portable, msi
    [switch]$Clean,
    [switch]$Verbose
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "📦 $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

try {
    $StartTime = Get-Date

    if ($Verbose) {
        $env:VERBOSE = "1"
    }

    Write-Step "Starting TeamBeam packaging process..."
    Write-Host "Target: $Target" -ForegroundColor Yellow

    # Clean previous packages if requested
    if ($Clean) {
        Write-Step "Cleaning previous packages..."
        if (Test-Path "dist/packages") { 
            Remove-Item -Recurse -Force "dist/packages" 
        }
        Write-Success "Clean completed"
    }

    # Ensure everything is built
    Write-Step "Ensuring all packages are built..."
    pwsh .\scripts\build.ps1
    Write-Success "Build completed"

    # Run tests before packaging
    Write-Step "Running tests before packaging..."
    pwsh .\scripts\test.ps1 -Type unit
    if ($LASTEXITCODE -ne 0) {
        throw "Tests failed. Cannot package with failing tests."
    }
    Write-Success "Tests passed"

    # Create output directory
    New-Item -ItemType Directory -Force -Path "dist/packages" | Out-Null

    switch ($Target.ToLower()) {
        "win" {
            Write-Step "Creating Windows installer..."
            pnpm --filter electron run pack
            Write-Success "Windows installer created"
        }
        
        "portable" {
            Write-Step "Creating portable package..."
            # TODO: Implement portable package creation
            Write-Warning "Portable packaging not yet implemented"
        }
        
        "msi" {
            Write-Step "Creating MSI package..."
            # TODO: Implement MSI package creation
            Write-Warning "MSI packaging not yet implemented"
        }
        
        default {
            throw "Unknown target: $Target. Use 'win', 'portable', or 'msi'"
        }
    }

    # CLI package (always create)
    Write-Step "Creating CLI package..."
    
    # Create CLI distribution
    $CliDistPath = "dist/packages/cli"
    New-Item -ItemType Directory -Force -Path $CliDistPath | Out-Null
    
    # Copy CLI files
    Copy-Item -Recurse "cli/dist/*" $CliDistPath
    Copy-Item "cli/package.json" $CliDistPath
    
    # Create CLI launcher script
    @"
@echo off
node "%~dp0\index.js" %*
"@ | Out-File -FilePath "$CliDistPath/teambeam.cmd" -Encoding ascii

    Write-Success "CLI package created"

    # Package information
    $Duration = (Get-Date) - $StartTime
    $PackageSize = (Get-ChildItem "dist/packages" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    
    Write-Host ""
    Write-Host "📦 Package Summary:" -ForegroundColor Yellow
    Write-Host "   🎯 Target: $Target" -ForegroundColor White
    Write-Host "   📁 Location: dist/packages/" -ForegroundColor White
    Write-Host "   📏 Size: $($PackageSize.ToString('F1')) MB" -ForegroundColor White
    Write-Host "   ⏱️  Duration: $($Duration.TotalSeconds.ToString('F1'))s" -ForegroundColor White
    
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor Yellow
    Write-Host "   • Test installer: Run the .exe in dist/packages/" -ForegroundColor White
    Write-Host "   • Test CLI: Add dist/packages/cli to PATH" -ForegroundColor White
    Write-Host "   • Distribution: Upload packages to release artifacts" -ForegroundColor White

    Write-Success "Packaging completed successfully!"

} catch {
    Write-Error "Packaging failed: $($_.Exception.Message)"
    exit 1
}