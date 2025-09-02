# Roadmap Status Updater for VS Code Integration
# Usage: .\update-roadmap.ps1 -ItemId "item-123" -Status "progress"
# Usage: .\update-roadmap.ps1 -ItemTitle "PDF Parsing" -Status "done"

param(
    [string]$ItemId,
    [string]$ItemTitle,
    [ValidateSet("planned", "progress", "done", "blocked")]
    [string]$Status,
    [string]$RoadmapFile = "axis-roadmap-pro.html",
    [switch]$List,
    [switch]$Help
)

function Show-Help {
    Write-Host @"
🎯 Roadmap Status Updater

USAGE:
  .\update-roadmap.ps1 -ItemId "item-123" -Status "progress"
  .\update-roadmap.ps1 -ItemTitle "PDF Parsing" -Status "done"
  .\update-roadmap.ps1 -List
  .\update-roadmap.ps1 -Help

PARAMETERS:
  -ItemId      : Exact item ID to update
  -ItemTitle   : Search by item title (partial match)
  -Status      : New status (planned, progress, done, blocked)
  -List        : Show all roadmap items
  -Help        : Show this help

EXAMPLES:
  # Mark item as in progress
  .\update-roadmap.ps1 -ItemTitle "PDF" -Status "progress"
  
  # Mark item as completed
  .\update-roadmap.ps1 -ItemId "item-1693000000000" -Status "done"
  
  # List all items
  .\update-roadmap.ps1 -List
"@
}

function Get-RoadmapData {
    if (-not (Test-Path $RoadmapFile)) {
        Write-Error "Roadmap file not found: $RoadmapFile"
        return $null
    }
    
    $content = Get-Content $RoadmapFile -Raw
    
    # Extract the DEFAULT_DATA section
    $dataStart = $content.IndexOf("const DEFAULT_DATA = [")
    if ($dataStart -eq -1) {
        Write-Error "Could not find DEFAULT_DATA in roadmap file"
        return $null
    }
    
    $dataEnd = $content.IndexOf("];", $dataStart)
    if ($dataEnd -eq -1) {
        Write-Error "Could not find end of DEFAULT_DATA"
        return $null
    }
    
    $dataSection = $content.Substring($dataStart, $dataEnd - $dataStart + 2)
    
    # Parse the data (simplified parsing)
    $items = @()
    $regexMatches = [regex]::Matches($dataSection, '\{\s*id:\s*[''"]([^''"]+)[''"],\s*title:\s*[''"]([^''"]+)[''"],\s*desc:\s*[''"]([^''"]*)[''"],\s*status:\s*[''"]([^''"]+)[''"]')
    
    foreach ($match in $regexMatches) {
        $items += @{
            Id = $match.Groups[1].Value
            Title = $match.Groups[2].Value
            Description = $match.Groups[3].Value
            Status = $match.Groups[4].Value
        }
    }
    
    return $items
}

function Update-RoadmapStatus {
    param($TargetId, $NewStatus)
    
    $content = Get-Content $RoadmapFile -Raw
    
    # Find and replace the status for the specific item
    $pattern = "(\{\s*id:\s*[''`"]$TargetId[''`"],.*?status:\s*[''`"])[^'`"]+([''`"])"
    $replacement = "`${1}$NewStatus`${2}"
    
    $newContent = $content -replace $pattern, $replacement
    
    if ($newContent -eq $content) {
        Write-Warning "No changes made. Item ID '$TargetId' not found or status already set."
        return $false
    }
    
    # Backup original file
    $backupFile = $RoadmapFile + ".backup"
    Copy-Item $RoadmapFile $backupFile
    
    # Write updated content
    $newContent | Out-File $RoadmapFile -Encoding UTF8
    
    Write-Host "✅ Updated item '$TargetId' status to '$NewStatus'" -ForegroundColor Green
    Write-Host "📁 Backup saved as: $backupFile" -ForegroundColor Gray
    
    return $true
}

function Show-RoadmapItems {
    $items = Get-RoadmapData
    if (-not $items) { return }
    
    Write-Host "`n🎯 Roadmap Items:" -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Gray
    
    $statusColors = @{
        "planned" = "Yellow"
        "progress" = "Blue" 
        "done" = "Green"
        "blocked" = "Red"
    }
    
    foreach ($item in $items) {
        $color = $statusColors[$item.Status]
        Write-Host "ID: " -NoNewline -ForegroundColor Gray
        Write-Host $item.Id -ForegroundColor White
        Write-Host "Title: " -NoNewline -ForegroundColor Gray
        Write-Host $item.Title -ForegroundColor White
        Write-Host "Status: " -NoNewline -ForegroundColor Gray
        Write-Host $item.Status -ForegroundColor $color
        Write-Host ("─" * 40) -ForegroundColor DarkGray
    }
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

if ($List) {
    Show-RoadmapItems
    exit 0
}

if (-not $Status) {
    Write-Error "Status parameter is required. Use -Help for usage information."
    exit 1
}

if (-not $ItemId -and -not $ItemTitle) {
    Write-Error "Either ItemId or ItemTitle must be specified. Use -Help for usage information."
    exit 1
}

# Get roadmap data
$items = Get-RoadmapData
if (-not $items) { exit 1 }

# Find target item
$targetItem = $null
if ($ItemId) {
    $targetItem = $items | Where-Object { $_.Id -eq $ItemId }
} else {
    $targetItem = $items | Where-Object { $_.Title -like "*$ItemTitle*" } | Select-Object -First 1
}

if (-not $targetItem) {
    Write-Error "Item not found. Use -List to see all items."
    exit 1
}

Write-Host "🎯 Found item: $($targetItem.Title) (ID: $($targetItem.Id))" -ForegroundColor Cyan
Write-Host "📊 Current status: $($targetItem.Status)" -ForegroundColor Yellow
Write-Host "🔄 Updating to: $Status" -ForegroundColor Green

# Update the status
if (Update-RoadmapStatus -TargetId $targetItem.Id -NewStatus $Status) {
    Write-Host "`n✨ Update completed! Refresh your browser to see changes." -ForegroundColor Green
} else {
    Write-Error "Update failed."
    exit 1
}