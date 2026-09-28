#!/usr/bin/env node

/**
 * Simple static HTTP server for desktop development
 * Serves src/ directory on http://localhost:8080
 * No dependencies - uses Node.js built-in http module
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Allow PORT override from environment or find first numeric argument
let PORT = parseInt(process.env.PORT || '8080');
if (isNaN(PORT)) {
  for (let i = 2; i < process.argv.length; i++) {
    const num = parseInt(process.argv[i]);
    if (!isNaN(num) && num > 0 && num < 65536) {
      PORT = num;
      break;
    }
  }
}
const SRC_DIR = path.resolve(__dirname, '../src');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.m3u': 'application/vnd.apple.mpegurl',
  '.m3u8': 'application/vnd.apple.mpegurl'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  // Remove leading slash
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // Resolve file path
  let filePath = path.join(SRC_DIR, pathname);

  // Prevent directory traversal
  if (!filePath.startsWith(SRC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error');
      }
      return;
    }

    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] });
        res.end(data);
      });
    } else {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Server Error');
          return;
        }
        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Dev server started`);
  console.log(`📺 Open: http://localhost:${PORT}`);
  console.log(`📁 Serving: ${SRC_DIR}`);
  console.log(`\n🎮 Controls: ↑↓←→ = navigate, Enter = select, Backspace = back\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`✗ Port ${PORT} already in use`);
    if (PORT < 8090) {
      PORT++;
      console.log(`🔄 Trying port ${PORT}...`);
      server.listen(PORT);
    } else {
      console.error('✗ No available ports in range 8080-8090');
      process.exit(1);
    }
  } else {
    console.error('✗ Server error:', err);
    process.exit(1);
  }
});
