#!/usr/bin/env node

import { SimpleCLI } from './simple-cli';

/**
 * Main entry point for F1 Manager Setup Optimizer
 */
async function main(): Promise<void> {
  const cli = new SimpleCLI();
  
  // Handle process termination gracefully
  process.on('SIGINT', () => {
    console.log('\n\nThanks for using F1 Manager Setup Optimizer! 🏁');
    cli.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    cli.cleanup();
    process.exit(0);
  });

  try {
    await cli.start();
  } catch (error) {
    console.error('An error occurred:', error);
    cli.cleanup();
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});