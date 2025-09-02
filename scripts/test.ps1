# TeamBeam Test Runner
# Runs unit tests, e2e tests, and optional performance tests

param(
    [string]$Type = "all",      # all, unit, e2e, perf
    [switch]$Watch,
    [switch]$Coverage,
    [switch]$Verbose
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "🧪 $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

try {
    $StartTime = Get-Date

    if ($Verbose) {
        $env:VERBOSE = "1"
    }

    Write-Step "Starting TeamBeam test suite..."
    Write-Host "Test type: $Type" -ForegroundColor Yellow

    # Check if built
    if (!(Test-Path "core/dist") -or !(Test-Path "cli/dist")) {
        Write-Warning "Packages not built. Building first..."
        pwsh .\scripts\build.ps1
    }

    $TestsPassed = 0
    $TestsFailed = 0

    switch ($Type.ToLower()) {
        "unit" {
            Write-Step "Running unit tests..."
            
            $UnitArgs = @()
            if ($Watch) { $UnitArgs += "--watchAll" }
            if ($Coverage) { $UnitArgs += "--coverage" }
            if ($Verbose) { $UnitArgs += "--verbose" }
            
            pnpm run test:unit @UnitArgs
            if ($LASTEXITCODE -eq 0) {
                $TestsPassed++
                Write-Success "Unit tests passed"
            } else {
                $TestsFailed++
                Write-Error "Unit tests failed"
            }
        }
        
        "e2e" {
            Write-Step "Running E2E tests..."
            
            # Check if Playwright is installed
            if (!(Test-Path "node_modules/@playwright")) {
                Write-Step "Installing Playwright browsers..."
                npx playwright install
            }
            
            $E2EArgs = @()
            if ($Verbose) { $E2EArgs += "--reporter=list" }
            
            pnpm run test:e2e @E2EArgs
            if ($LASTEXITCODE -eq 0) {
                $TestsPassed++
                Write-Success "E2E tests passed"
            } else {
                $TestsFailed++
                Write-Error "E2E tests failed"
            }
        }
        
        "perf" {
            Write-Step "Running performance tests..."
            Write-Warning "Performance tests may take several minutes..."
            
            pnpm run test:perf
            if ($LASTEXITCODE -eq 0) {
                $TestsPassed++
                Write-Success "Performance tests passed"
            } else {
                $TestsFailed++
                Write-Error "Performance tests failed"
            }
        }
        
        "all" {
            Write-Step "Running all test suites..."
            
            # Unit tests
            Write-Step "1/3 Unit tests..."
            pnpm run test:unit
            if ($LASTEXITCODE -eq 0) {
                $TestsPassed++
                Write-Success "Unit tests passed"
            } else {
                $TestsFailed++
                Write-Error "Unit tests failed"
            }
            
            # E2E tests (only if unit tests passed)
            if ($TestsFailed -eq 0) {
                Write-Step "2/3 E2E tests..."
                pnpm run test:e2e
                if ($LASTEXITCODE -eq 0) {
                    $TestsPassed++
                    Write-Success "E2E tests passed"
                } else {
                    $TestsFailed++
                    Write-Error "E2E tests failed"
                }
            } else {
                Write-Warning "Skipping E2E tests due to unit test failures"
            }
            
            # Performance tests (optional)
            if ($TestsFailed -eq 0) {
                Write-Step "3/3 Performance tests..."
                pnpm run test:perf
                if ($LASTEXITCODE -eq 0) {
                    $TestsPassed++
                    Write-Success "Performance tests passed"
                } else {
                    $TestsFailed++
                    Write-Error "Performance tests failed"
                }
            } else {
                Write-Warning "Skipping performance tests due to previous failures"
            }
        }
        
        default {
            throw "Unknown test type: $Type. Use 'all', 'unit', 'e2e', or 'perf'"
        }
    }

    $Duration = (Get-Date) - $StartTime
    
    Write-Host ""
    Write-Host "📊 Test Results Summary:" -ForegroundColor Yellow
    Write-Host "   ✅ Passed: $TestsPassed" -ForegroundColor Green
    Write-Host "   ❌ Failed: $TestsFailed" -ForegroundColor Red
    Write-Host "   ⏱️  Duration: $($Duration.TotalSeconds.ToString('F1'))s" -ForegroundColor Cyan

    if ($TestsFailed -gt 0) {
        Write-Error "Some tests failed. Check output above for details."
        exit 1
    } else {
        Write-Success "All tests passed!"
    }

} catch {
    Write-Error "Test execution failed: $($_.Exception.Message)"
    exit 1
}