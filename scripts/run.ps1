# TeamBeam Development Runner
# Starts the development environment with hot reload

param(
    [string]$Mode = "electron",  # electron, cli, or web
    [switch]$Verbose
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "🚀 $Message" -ForegroundColor Cyan
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
    if ($Verbose) {
        $env:VERBOSE = "1"
    }

    Write-Step "Starting TeamBeam development environment..."
    Write-Host "Mode: $Mode" -ForegroundColor Yellow

    # Check prerequisites
    if (!(Get-Command "pnpm" -ErrorAction SilentlyContinue)) {
        Write-Step "Enabling corepack for pnpm..."
        corepack enable
    }

    # Install dependencies if needed
    if (!(Test-Path "node_modules")) {
        Write-Step "Installing dependencies..."
        pnpm install
        Write-Success "Dependencies installed"
    }

    # Build core if needed
    if (!(Test-Path "core/dist")) {
        Write-Step "Building core package..."
        pnpm --filter core run build
        Write-Success "Core package built"
    }

    switch ($Mode.ToLower()) {
        "electron" {
            Write-Step "Starting Electron development mode..."
            Write-Host "This will start the renderer dev server and then launch Electron" -ForegroundColor Yellow
            
            # Start renderer dev server in background
            $RendererJob = Start-Job -ScriptBlock {
                Set-Location $using:PWD
                pnpm --filter renderer run dev
            }
            
            # Wait a moment for Vite to start
            Start-Sleep -Seconds 3
            
            # Build electron main process using direct TypeScript compilation
            Write-Step "Building Electron main process..."
            Set-Location "desktop/electron"
            npx tsc main.ts --outDir ../dist --module commonjs --target es2020 --moduleResolution node
            Set-Location "../.."
            
            # Start electron
            Write-Step "Launching Electron..."
            Set-Location "desktop"
            .\node_modules\.bin\electron.cmd dist/main.js
            Set-Location ".."
            
            # Clean up background job
            Stop-Job $RendererJob -ErrorAction SilentlyContinue
            Remove-Job $RendererJob -ErrorAction SilentlyContinue
        }
        
        "cli" {
            Write-Step "Starting CLI development mode..."
            pnpm --filter cli run dev
        }
        
        "web" {
            Write-Step "Starting web development mode..."
            Write-Host "Renderer will be available at http://localhost:5173" -ForegroundColor Yellow
            pnpm --filter renderer run dev
        }
        
        default {
            throw "Unknown mode: $Mode. Use 'electron', 'cli', or 'web'"
        }
    }

} catch {
    Write-Error "Development startup failed: $($_.Exception.Message)"
    
    # Clean up any background jobs
    Get-Job | Stop-Job -ErrorAction SilentlyContinue
    Get-Job | Remove-Job -ErrorAction SilentlyContinue
    
    exit 1
}