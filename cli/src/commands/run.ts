// Run Command - Execute YAML pipelines

import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PipelineExecutor } from 'core/src/pipeline/executor.js';

export async function runCommand(
  pipelinePath: string,
  options: {
    config?: string;
    output?: string;
    dryRun?: boolean;
  }
): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log(chalk.cyan('🚀 Starting pipeline execution...'));
    console.log(chalk.white(`Pipeline: ${pipelinePath}`));
    
    // Check if pipeline file exists
    try {
      await fs.access(pipelinePath);
    } catch {
      throw new Error(`Pipeline file not found: ${pipelinePath}`);
    }

    // Create pipeline executor
    const executor = new PipelineExecutor();
    
    // Load and validate pipeline
    console.log(chalk.blue('📋 Loading pipeline configuration...'));
    const config = await executor.loadPipeline(pipelinePath);
    
    console.log(chalk.white(`   Name: ${config.name || 'Unnamed Pipeline'}`));
    console.log(chalk.white(`   Description: ${config.description || 'No description'}`));
    
    if (options.dryRun) {
      console.log(chalk.yellow('🔍 Dry run mode - showing execution plan:'));
      
      // Show what would be executed
      if (config.foreach) {
        console.log(chalk.white(`   Files: ${config.foreach.files}`));
        console.log(chalk.white(`   Steps per file: ${config.foreach.steps.length}`));
      }
      
      if (config.steps) {
        console.log(chalk.white(`   Direct steps: ${config.steps.length}`));
      }
      
      console.log(chalk.green('✅ Dry run completed'));
      return;
    }

    // Set output directory if provided
    if (options.output) {
      executor.setVar('output.dir', path.resolve(options.output));
      await fs.mkdir(options.output, { recursive: true });
    }

    // Execute pipeline
    console.log(chalk.blue('⚙️  Executing pipeline...'));
    await executor.executePipeline(config);
    
    const duration = Date.now() - startTime;
    console.log(chalk.green(`✅ Pipeline completed successfully in ${(duration / 1000).toFixed(1)}s`));

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(chalk.red('❌ Pipeline execution failed:'));
    console.error(chalk.red(`   ${error instanceof Error ? error.message : 'Unknown error'}`));
    console.error(chalk.gray(`   Duration: ${(duration / 1000).toFixed(1)}s`));
    
    if (process.env.VERBOSE) {
      console.error(chalk.gray('Stack trace:'));
      console.error(error instanceof Error ? error.stack : error);
    }
    
    process.exit(1);
  }
}