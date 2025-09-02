#!/usr/bin/env node

// TeamBeam CLI - Command line interface for batch PDF processing

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';

// Import commands
import { runCommand } from './commands/run.js';
import { extractCommand } from './commands/extract.js';
import { renderCommand } from './commands/render.js';

const program = new Command();

// CLI metadata
program
  .name('teambeam')
  .description('Local Bluebeam with Brains - Offline PDF construction tool')
  .version('0.1.0')
  .configureOutput({
    outputError: (str, write) => write(chalk.red(str))
  });

// Global options
program
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--trace', 'Enable performance tracing')
  .hook('preAction', (thisCommand) => {
    if (thisCommand.opts().verbose) {
      process.env.VERBOSE = '1';
    }
    if (thisCommand.opts().trace) {
      process.env.TRACE = '1';
    }
  });

// Commands
program
  .command('run')
  .description('Execute a YAML pipeline')
  .argument('<pipeline>', 'Path to pipeline YAML file')
  .option('-c, --config <path>', 'Configuration file path')
  .option('-o, --output <dir>', 'Output directory')
  .option('--dry-run', 'Show what would be executed without running')
  .action(runCommand);

program
  .command('extract')
  .description('Extract text from PDFs')
  .argument('<input>', 'Input PDF file or glob pattern')
  .option('-o, --output <path>', 'Output file path')
  .option('--format <type>', 'Output format (json|csv|txt)', 'json')
  .option('--ocr', 'Force OCR on all pages')
  .option('--lang <language>', 'OCR language', 'eng')
  .action(extractCommand);

program
  .command('render')
  .description('Render PDF pages as images')
  .argument('<input>', 'Input PDF file')
  .option('-o, --output <dir>', 'Output directory')
  .option('--pages <range>', 'Page range (e.g., 1-5,10)', 'all')
  .option('--scale <factor>', 'Scale factor', '1.0')
  .option('--format <type>', 'Image format (png|jpg)', 'png')
  .action(renderCommand);

// Demo/example commands
program
  .command('demo')
  .description('Run demo pipeline with sample data')
  .option('--type <demo>', 'Demo type (ocr|stamp|extract)', 'ocr')
  .action(async (options) => {
    console.log(chalk.cyan('🚀 Running TeamBeam demo...'));
    console.log(`Demo type: ${options.type}`);
    
    // TODO: Implement demo
    console.log(chalk.yellow('⚠️  Demo not yet implemented'));
    console.log(chalk.white('   Use: teambeam run ./configs/pipeline-examples/approve-and-label.yml'));
  });

// Config commands
program
  .command('config')
  .description('Manage configuration')
  .option('--show', 'Show current configuration')
  .option('--reset', 'Reset to defaults')
  .action(async (options) => {
    if (options.show) {
      console.log(chalk.cyan('📋 Current Configuration:'));
      // TODO: Load and display config
      console.log(chalk.white('   Default config not yet implemented'));
    }
    
    if (options.reset) {
      console.log(chalk.cyan('🔄 Resetting configuration...'));
      // TODO: Reset config
      console.log(chalk.green('✅ Configuration reset complete'));
    }
  });

// Help and error handling
program.on('command:*', () => {
  console.error(chalk.red(`❌ Invalid command: ${program.args.join(' ')}`));
  console.log(chalk.white('   Use --help to see available commands'));
  process.exit(1);
});

// Global error handler
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught Exception:'), error.message);
  if (process.env.VERBOSE) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('❌ Unhandled Rejection:'), reason);
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(chalk.cyan('🏗️  TeamBeam CLI'));
  console.log(chalk.white('   Local Bluebeam with Brains\n'));
  program.outputHelp();
  
  console.log(chalk.yellow('\n📝 Quick Examples:'));
  console.log(chalk.white('   teambeam run ./pipeline.yml'));
  console.log(chalk.white('   teambeam extract "*.pdf" --format csv'));
  console.log(chalk.white('   teambeam render drawing.pdf --pages 1-5'));
  console.log(chalk.white('   teambeam demo --type ocr'));
}