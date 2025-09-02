#!/usr/bin/env node

/**
 * VS Code Roadmap Integration Bridge
 * Provides command-line interface to update roadmap status
 */

const fs = require('fs');
const path = require('path');

const ROADMAP_FILE = 'axis-roadmap-pro.html';

function showHelp() {
    console.log(`
🎯 Roadmap CLI - VS Code Integration

USAGE:
  node roadmap-cli.js list
  node roadmap-cli.js update <item-title> <status>
  node roadmap-cli.js update-id <item-id> <status>

EXAMPLES:
  node roadmap-cli.js list
  node roadmap-cli.js update "PDF Parsing" progress
  node roadmap-cli.js update-id "item-1693000000000" done

STATUS OPTIONS: planned, progress, done, blocked
`);
}

function extractDefaultData() {
    try {
        const content = fs.readFileSync(ROADMAP_FILE, 'utf8');
        const dataStart = content.indexOf('const DEFAULT_DATA = [');
        const dataEnd = content.indexOf('];', dataStart);
        
        if (dataStart === -1 || dataEnd === -1) {
            throw new Error('Could not find DEFAULT_DATA in roadmap file');
        }
        
        const dataSection = content.substring(dataStart + 21, dataEnd + 1);
        
        // Use eval to parse the JavaScript array (safe in this controlled context)
        const items = eval(dataSection);
        return items;
    } catch (error) {
        console.error('❌ Error reading roadmap data:', error.message);
        return null;
    }
}

function updateItemStatus(itemId, newStatus) {
    try {
        let content = fs.readFileSync(ROADMAP_FILE, 'utf8');
        
        // Create backup
        fs.writeFileSync(ROADMAP_FILE + '.backup', content);
        
        // Find and replace the status
        const regex = new RegExp(
            `(\\{[^}]*id:\\s*['"\`]${itemId}['"\`][^}]*status:\\s*['"\`])[^'"\`]+(['"\`])`,
            'g'
        );
        
        const newContent = content.replace(regex, `$1${newStatus}$2`);
        
        if (newContent === content) {
            console.log('⚠️  No changes made. Item not found or status already set.');
            return false;
        }
        
        fs.writeFileSync(ROADMAP_FILE, newContent);
        console.log(`✅ Updated item '${itemId}' status to '${newStatus}'`);
        return true;
    } catch (error) {
        console.error('❌ Error updating roadmap:', error.message);
        return false;
    }
}

function listItems() {
    const items = extractDefaultData();
    if (!items) return;
    
    console.log('\\n🎯 Roadmap Items:');
    console.log('='.repeat(60));
    
    const statusEmojis = {
        planned: '📋',
        progress: '🔄',
        done: '✅',
        blocked: '🚫'
    };
    
    items.forEach(item => {
        const emoji = statusEmojis[item.status] || '❓';
        console.log(`${emoji} ${item.title}`);
        console.log(`   ID: ${item.id}`);
        console.log(`   Status: ${item.status}`);
        console.log(`   Lane: ${item.lane} | Milestone: ${item.milestone}`);
        if (item.tags && item.tags.length > 0) {
            console.log(`   Tags: ${item.tags.join(', ')}`);
        }
        console.log('─'.repeat(40));
    });
}

function updateByTitle(title, status) {
    const items = extractDefaultData();
    if (!items) return;
    
    const item = items.find(item => 
        item.title.toLowerCase().includes(title.toLowerCase())
    );
    
    if (!item) {
        console.error(`❌ Item with title containing "${title}" not found`);
        console.log('\\n💡 Available items:');
        items.forEach(item => console.log(`   - ${item.title}`));
        return;
    }
    
    console.log(`🎯 Found: "${item.title}" (ID: ${item.id})`);
    console.log(`📊 Current status: ${item.status}`);
    console.log(`🔄 Updating to: ${status}`);
    
    if (updateItemStatus(item.id, status)) {
        console.log('\\n✨ Update completed! Refresh your browser to see changes.');
    }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === 'help') {
    showHelp();
    process.exit(0);
}

const command = args[0];
const validStatuses = ['planned', 'progress', 'done', 'blocked'];

switch (command) {
    case 'list':
        listItems();
        break;
        
    case 'update':
        if (args.length < 3) {
            console.error('❌ Usage: node roadmap-cli.js update <item-title> <status>');
            process.exit(1);
        }
        const title = args[1];
        const status = args[2];
        
        if (!validStatuses.includes(status)) {
            console.error(`❌ Invalid status. Must be one of: ${validStatuses.join(', ')}`);
            process.exit(1);
        }
        
        updateByTitle(title, status);
        break;
        
    case 'update-id':
        if (args.length < 3) {
            console.error('❌ Usage: node roadmap-cli.js update-id <item-id> <status>');
            process.exit(1);
        }
        const itemId = args[1];
        const newStatus = args[2];
        
        if (!validStatuses.includes(newStatus)) {
            console.error(`❌ Invalid status. Must be one of: ${validStatuses.join(', ')}`);
            process.exit(1);
        }
        
        if (updateItemStatus(itemId, newStatus)) {
            console.log('\\n✨ Update completed! Refresh your browser to see changes.');
        }
        break;
        
    default:
        console.error(`❌ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
}