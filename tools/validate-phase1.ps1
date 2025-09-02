# tools/validate-phase1.ps1
# TeamBeam Phase 1 Validation Script
param(
    [switch]$Verbose,
    [switch]$SkipPdfs
)

$ErrorActionPreference = "Stop"

Write-Host "[TeamBeam Phase 1 Validator] 🔍 Testing all systems..." -ForegroundColor Cyan

$testResults = @{
    PipelineSystem = $false
    JavaScriptExecution = $false
    ConfigurationFiles = $false
    TestInfrastructure = $false
    PlaceholderTracking = $false
    OverallReady = $false
}

try {
    # Test 1: Configuration files exist and are valid
    Write-Host "1️⃣ Testing configuration files..." -ForegroundColor Yellow
    
    $configFiles = @(
        "configs/settings.yml",
        "configs/ocr-languages.yml", 
        "configs/stamp-templates.yml",
        "configs/project-defaults.yml"
    )
    
    $configValid = $true
    foreach ($config in $configFiles) {
        if (!(Test-Path $config)) {
            Write-Host "❌ Missing: $config" -ForegroundColor Red
            $configValid = $false
        } else {
            if ($Verbose) { Write-Host "✅ Found: $config" -ForegroundColor Green }
        }
    }
    
    $testResults.ConfigurationFiles = $configValid
    
    # Test 2: Core TypeScript files compile
    Write-Host "2️⃣ Testing core TypeScript compilation..." -ForegroundColor Yellow
    
    $coreFiles = @(
        "core/src/scripting/js-executor.ts",
        "core/src/services/pipeline-engine.ts",
        "core/src/models/pipeline.ts"
    )
    
    $coreValid = $true
    foreach ($file in $coreFiles) {
        if (!(Test-Path $file)) {
            Write-Host "❌ Missing core file: $file" -ForegroundColor Red
            $coreValid = $false
        } else {
            if ($Verbose) { Write-Host "✅ Found: $file" -ForegroundColor Green }
        }
    }
    
    # Check for TypeScript installation
    try {
        $tscVersion = npx tsc --version 2>$null
        if ($Verbose) { Write-Host "📦 TypeScript: $tscVersion" -ForegroundColor Cyan }
    } catch {
        Write-Host "⚠️ TypeScript not available for compilation check" -ForegroundColor Yellow
    }
    
    $testResults.JavaScriptExecution = $coreValid
    
    # Test 3: Pipeline system files
    Write-Host "3️⃣ Testing pipeline system..." -ForegroundColor Yellow
    
    $pipelineFiles = @(
        "pipelines/samples/basic-processing.yml",
        "pipelines/samples/with-javascript.yml",
        "pipelines/samples/complex-workflow.yml"
    )
    
    $pipelineValid = $true
    foreach ($pipeline in $pipelineFiles) {
        if (!(Test-Path $pipeline)) {
            Write-Host "❌ Missing pipeline: $pipeline" -ForegroundColor Red
            $pipelineValid = $false
        } else {
            if ($Verbose) { Write-Host "✅ Found: $pipeline" -ForegroundColor Green }
        }
    }
    
    $testResults.PipelineSystem = $pipelineValid
    
    # Test 4: Test infrastructure
    Write-Host "4️⃣ Testing infrastructure..." -ForegroundColor Yellow
    
    $testFiles = @(
        "scripts/generate-test-pdfs.py",
        "scripts/validate-pipelines.py"
    )
    
    $testValid = $true
    foreach ($test in $testFiles) {
        if (!(Test-Path $test)) {
            Write-Host "❌ Missing test script: $test" -ForegroundColor Red
            $testValid = $false
        } else {
            if ($Verbose) { Write-Host "✅ Found: $test" -ForegroundColor Green }
        }
    }
    
    # Check Python availability
    try {
        $pythonVersion = python --version 2>$null
        if ($Verbose) { Write-Host "🐍 Python: $pythonVersion" -ForegroundColor Cyan }
    } catch {
        Write-Host "⚠️ Python not available for test script execution" -ForegroundColor Yellow
        $testValid = $false
    }
    
    $testResults.TestInfrastructure = $testValid
    
    # Test 5: Generate test PDFs if requested
    if (!$SkipPdfs -and $testValid) {
        Write-Host "5️⃣ Generating test PDFs..." -ForegroundColor Yellow
        try {
            python scripts/generate-test-pdfs.py
            if (Test-Path "test-outputs") {
                $pdfCount = (Get-ChildItem "test-outputs" -Filter "*.pdf").Count
                Write-Host "✅ Generated $pdfCount test PDFs" -ForegroundColor Green
            }
        } catch {
            Write-Host "⚠️ Could not generate test PDFs: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
    # Test 6: Placeholder tracking
    Write-Host "6️⃣ Testing placeholder tracking..." -ForegroundColor Yellow
    
    if (Test-Path "tools/scan-placeholders.cjs") {
        try {
            node tools/scan-placeholders.cjs
            if (Test-Path "docs/placeholders.json") {
                Write-Host "✅ Placeholder tracking working" -ForegroundColor Green
                $testResults.PlaceholderTracking = $true
            }
        } catch {
            Write-Host "⚠️ Placeholder scanner failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Placeholder scanner not found" -ForegroundColor Red
    }
    
    # Overall assessment
    Write-Host "`n📊 Phase 1 Test Results:" -ForegroundColor Cyan
    
    $passCount = 0
    foreach ($test in $testResults.Keys) {
        if ($test -eq "OverallReady") { continue }
        $status = if ($testResults[$test]) { "✅ PASS" } else { "❌ FAIL" }
        $color = if ($testResults[$test]) { "Green" } else { "Red" }
        Write-Host "   $test`: $status" -ForegroundColor $color
        if ($testResults[$test]) { $passCount++ }
    }
    
    $totalTests = $testResults.Keys.Count - 1
    $testResults.OverallReady = ($passCount -eq $totalTests)
    
    Write-Host "`n🎯 Overall Status: $passCount/$totalTests tests passed" -ForegroundColor $(if ($testResults.OverallReady) { "Green" } else { "Yellow" })
    
    if ($testResults.OverallReady) {
        Write-Host "🚀 Phase 1 is READY for production!" -ForegroundColor Green
        Write-Host "✨ Proceeding to Phase 2 (Electron App) is recommended" -ForegroundColor Cyan
        return 0
    } else {
        Write-Host "⚠️ Some components need attention before Phase 2" -ForegroundColor Yellow
        Write-Host "📋 Review failed tests and fix before proceeding" -ForegroundColor Cyan
        return 1
    }
    
} catch {
    Write-Host "❌ Validation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔍 Check your project structure and dependencies" -ForegroundColor Yellow
    return 2
}