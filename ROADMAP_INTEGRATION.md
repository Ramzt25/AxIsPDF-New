# 🎯 Roadmap VS Code Integration

This integration allows you to update roadmap item statuses directly from within VS Code, streamlining your development workflow.

## 🚀 Quick Start

### Method 1: VS Code Tasks (Recommended)
Use the Command Palette (`Ctrl+Shift+P`) and type "Tasks: Run Task", then select:
- **Roadmap: List All Items** - View all roadmap items
- **Roadmap: Mark Item In Progress** - Set item to "progress" status
- **Roadmap: Mark Item Done** - Set item to "done" status  
- **Roadmap: Mark Item Blocked** - Set item to "blocked" status
- **Roadmap: Custom Update** - Choose any status

### Method 2: Keyboard Shortcuts
- `Ctrl+Shift+R, Ctrl+Shift+L` - List all items
- `Ctrl+Shift+R, Ctrl+Shift+P` - Mark item in progress
- `Ctrl+Shift+R, Ctrl+Shift+D` - Mark item done
- `Ctrl+Shift+R, Ctrl+Shift+B` - Mark item blocked
- `Ctrl+Shift+R, Ctrl+Shift+U` - Custom update

### Method 3: PowerShell Script
```powershell
# List all items
.\update-roadmap.ps1 -List

# Update by title (partial match)
.\update-roadmap.ps1 -ItemTitle "PDF" -Status "progress"

# Update by exact ID
.\update-roadmap.ps1 -ItemId "item-1693000000000" -Status "done"
```

### Method 4: Node.js CLI
```bash
# List all items
node roadmap-cli.js list

# Update by title
node roadmap-cli.js update "PDF Parsing" progress

# Update by ID
node roadmap-cli.js update-id "item-1693000000000" done
```

## 📋 Available Statuses
- `planned` - Item is planned but not started
- `progress` - Item is currently being worked on
- `done` - Item is completed
- `blocked` - Item is blocked by dependencies or issues

## 🔧 Integration Features

### Smart Item Search
- Search by partial title (case-insensitive)
- Search by exact item ID
- Automatic matching for convenience

### Safety Features
- Automatic backups before updates
- Validation of status values
- Clear success/error messaging

### Browser Integration
The roadmap HTML file includes a JavaScript API for external tools:

```javascript
// Access the API in browser console
window.roadmapAPI.getAllItems()           // Get all items
window.roadmapAPI.findItem("PDF")         // Find by title
window.roadmapAPI.updateStatus(id, status) // Update status
window.roadmapAPI.getNextSteps()          // Get AI suggestions
```

## 📁 Files Overview

- **`.vscode/tasks.json`** - VS Code task definitions
- **`.vscode/keybindings.json`** - Keyboard shortcuts
- **`update-roadmap.ps1`** - PowerShell integration script
- **`roadmap-cli.js`** - Node.js command-line interface
- **`axis-roadmap-pro.html`** - Main roadmap with embedded API

## 🎯 Workflow Examples

### Starting Work on an Item
```powershell
# See what's available
.\update-roadmap.ps1 -List

# Start working on PDF parsing
.\update-roadmap.ps1 -ItemTitle "PDF" -Status "progress"
```

### Completing Work
```powershell
# Mark as done when finished
.\update-roadmap.ps1 -ItemTitle "PDF" -Status "done"
```

### Handling Blockers
```powershell
# Mark as blocked if issues arise
.\update-roadmap.ps1 -ItemTitle "PDF" -Status "blocked"
```

## 🧠 AI Coach Integration

The Coach system in the roadmap provides intelligent suggestions based on:
- Development workflow priorities (PDF Engine → AI Engine → UI/UX)
- Milestone importance (MVP → Beta → v1.0)
- Dependency relationships
- Current work in progress

Access suggestions via the Coach button in the web interface or:
```javascript
window.roadmapAPI.getNextSteps()
```

## 🔄 Real-time Updates

After updating via any method:
1. The HTML file is automatically updated
2. Refresh your browser to see changes
3. The Coach system recalculates suggestions
4. Backup files are created for safety

## 🎨 Customization

### Adding New Statuses
Edit the validation arrays in:
- `update-roadmap.ps1` (line 6)
- `roadmap-cli.js` (line 108)
- `.vscode/tasks.json` (input options)

### Modifying Shortcuts
Edit `.vscode/keybindings.json` to change key combinations.

### Custom Scripts
Use the `window.roadmapAPI` interface to create your own integrations.

## 🔍 Troubleshooting

### PowerShell Execution Policy
If scripts won't run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Item Not Found
- Use `-List` to see all available items
- Check spelling and try partial matches
- Verify the item exists in the roadmap

### No Changes Made
- Item might already have the target status
- Check the item ID is correct
- Ensure the roadmap file is writable

---

**Happy coding! 🚀** The roadmap integration helps you stay organized and focused on the right priorities.