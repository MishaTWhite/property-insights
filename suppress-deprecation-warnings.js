// This file is a custom wrapper to run the app with deprecation warnings suppressed
process.env.NODE_NO_WARNINGS = '1';

// Get the path to concurrently binary
const concurrentlyPath = require.resolve('concurrently/bin/concurrently.js');

// Extract and forward all command-line arguments
const args = process.argv.slice(2);

// Spawn concurrently with the proper arguments and --no-deprecation flag
const { spawn } = require('child_process');
const concurrentlyProcess = spawn('node', ['--no-deprecation', concurrentlyPath, ...args], {
  stdio: 'inherit',
  env: { ...process.env, NODE_NO_WARNINGS: '1' }
});

// Handle exit events properly
concurrentlyProcess.on('exit', (code) => {
  process.exit(code);
});

concurrentlyProcess.on('error', (err) => {
  console.error('Failed to start concurrently:', err);
  process.exit(1);
});