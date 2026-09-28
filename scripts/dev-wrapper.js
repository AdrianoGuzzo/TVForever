#!/usr/bin/env node

/**
 * Wrapper script to call dev-exec.ps1 with environment variables
 * Avoids PowerShell parameter parsing issues by using env vars
 */

const { spawn } = require('child_process');
const path = require('path');

// Get arguments from command line
const args = process.argv.slice(2);

// Parse arguments
let device = null;
let inspect = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-Device' || args[i] === '--Device') {
    device = args[i + 1];
    i++;
  } else if (args[i] === '-Inspect' || args[i] === '--Inspect') {
    inspect = true;
  }
}

if (!device) {
  console.error('Error: -Device parameter is required');
  console.error('Usage: npm run dev -- -Device MyTV [-Inspect]');
  process.exit(1);
}

// Build PowerShell arguments
const devExecPath = path.join(__dirname, 'dev-exec.ps1');
const psArgs = [
  '-ExecutionPolicy', 'Bypass',
  '-File', devExecPath
];

console.log(`[Dev] Running: powershell -ExecutionPolicy Bypass -File ${devExecPath}`);
console.log('');

// Create environment with device and inspect flags
const env = Object.assign({}, process.env);
env.DEV_DEVICE = device;
env.DEV_INSPECT = inspect ? '1' : '0';

// Spawn PowerShell process
const ps = spawn('powershell.exe', psArgs, {
  stdio: 'inherit',
  env: env
});

ps.on('exit', (code) => {
  process.exit(code);
});

ps.on('error', (err) => {
  console.error('Error running PowerShell:', err);
  process.exit(1);
});
