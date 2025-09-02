# TeamBeam Build Script
# Builds all workspaces in the correct order

param(
    [switch]$Clean,
    [switch]$Verbose
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "🔧 $Message" -ForegroundColor Cyan
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

    Write-Step "Starting TeamBeam build process..."

    # Clean if requested
    if ($Clean) {
        Write-Step "Cleaning previous builds..."
        if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
        if (Test-Path "core/dist") { Remove-Item -Recurse -Force "core/dist" }
        if (Test-Path "cli/dist") { Remove-Item -Recurse -Force "cli/dist" }
        if (Test-Path "app/renderer/dist") { Remove-Item -Recurse -Force "app/renderer/dist" }
        if (Test-Path "app/electron/dist") { Remove-Item -Recurse -Force "app/electron/dist" }
        Write-Success "Clean completed"
    }

    # Check for required tools
    Write-Step "Checking prerequisites..."
    
    if (!(Get-Command "node" -ErrorAction SilentlyContinue)) {
        throw "Node.js not found. Please install Node.js 18+ and try again."
    }
    
    if (!(Get-Command "pnpm" -ErrorAction SilentlyContinue)) {
        Write-Step "pnpm not found, enabling corepack..."
        corepack enable
    }

    $NodeVersion = (node --version).Substring(1)
    if ([System.Version]$NodeVersion -lt [System.Version]"18.0.0") {
        throw "Node.js 18+ required. Found: $NodeVersion"
    }
    
    Write-Success "Prerequisites OK (Node: v$NodeVersion)"

    # Install dependencies
    Write-Step "Installing dependencies..."
    pnpm install --frozen-lockfile
    Write-Success "Dependencies installed"

    # Build core (required by others)
    Write-Step "Building core package..."
    pnpm --filter core run build
    Write-Success "Core package built"

    # Build CLI
    Write-Step "Building CLI package..."
    pnpm --filter cli run build
    Write-Success "CLI package built"

    # Build renderer
    Write-Step "Building renderer package..."
    pnpm --filter renderer run build
    Write-Success "Renderer package built"

    # Build electron main process
    Write-Step "Building Electron main process..."
    pnpm --filter electron run build
    Write-Success "Electron main process built"

    $Duration = (Get-Date) - $StartTime
    Write-Success "Build completed successfully in $($Duration.TotalSeconds.ToString('F1'))s"
    
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor Yellow
    Write-Host "   • Run app:     pwsh .\scripts\run.ps1" -ForegroundColor White
    Write-Host "   • Test CLI:    node .\cli\dist\index.js --help" -ForegroundColor White
    Write-Host "   • Run tests:   pwsh .\scripts\test.ps1" -ForegroundColor White
    Write-Host "   • Package:     pwsh .\scripts\pack.ps1" -ForegroundColor White

} catch {
    Write-Error "Build failed: $($_.Exception.Message)"
    exit 1
}