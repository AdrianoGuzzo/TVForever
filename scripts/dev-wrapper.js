#!/usr/bin/env node

/**
 * Dev wrapper that passes through arguments to dev-server.js
 * Allows running: npm run dev -- -Device MyTV -Inspect
 */

const child_process = require('child_process');
const path = require('path');

const devServerPath = path.join(__dirname, 'dev-server.js');
const args = process.argv.slice(2);

const child = child_process.spawn('node', [devServerPath, ...args], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..')
});

process.on('SIGINT', () => {
  child.kill();
  process.exit(0);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
