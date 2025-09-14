/**
 * Local test server utilities
 * Provides HTTP server for serving built files during tests
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

/**
 * Simple HTTP server for serving static files during tests
 */
class TestServer {
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.distDirectory = options.distDirectory || './dist';
    this.server = null;
    this.isRunning = false;
  }

  /**
   * Starts the test server
   * @returns {Promise<number>} Port number the server is running on
   */
  async start() {
    if (this.isRunning) {
      return this.port;
    }

    // Find an available port
    const availablePort = await this.findAvailablePort(this.port);
    this.port = availablePort;

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.listen(this.port, (err) => {
        if (err) {
          reject(err);
          return;
        }

        this.isRunning = true;
        console.log(`Test server started on http://localhost:${this.port}`);
        resolve(this.port);
      });

      this.server.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Stops the test server
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.isRunning || !this.server) {
      return;
    }

    return new Promise((resolve) => {
      this.server.close(() => {
        this.isRunning = false;
        console.log('Test server stopped');
        resolve();
      });
    });
  }

  /**
   * Handles HTTP requests
   * @param {http.IncomingMessage} req - Request object
   * @param {http.ServerResponse} res - Response object
   */
  handleRequest(req, res) {
    // Decode URL, remove query params, and normalize.
    const unsafePath = decodeURIComponent(req.url.split('?')[0]);
    let relativePath = path.normalize(unsafePath);

    // If it's the root, serve index.html. Otherwise, make path relative.
    if (relativePath === '/') {
      relativePath = 'index.html';
    } else if (relativePath.startsWith('/')) {
      relativePath = relativePath.substring(1);
    }

    const fullPath = path.join(this.distDirectory, relativePath);

    // Security: Resolve the absolute path and verify it's within the dist directory.
    const resolvedPath = path.resolve(fullPath);
    const resolvedDistDir = path.resolve(this.distDirectory);

    if (!resolvedPath.startsWith(resolvedDistDir)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }

    // Check if it's a directory
    const stats = fs.statSync(resolvedPath);
    if (stats.isDirectory()) {
      // Try to serve index.html from the directory
      const indexPath = path.join(resolvedPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        this.serveFile(indexPath, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Directory listing not allowed');
      }
      return;
    }

    this.serveFile(resolvedPath, res);
  }

  /**
   * Serves a file with appropriate content type
   * @param {string} filePath - Path to the file
   * @param {http.ServerResponse} res - Response object
   */
  serveFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = this.getContentType(ext);

    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal server error');
    }
  }

  /**
   * Gets content type based on file extension
   * @param {string} ext - File extension
   * @returns {string} Content type
   */
  getContentType(ext) {
    const contentTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.xml': 'application/xml',
    };

    return contentTypes[ext] || 'application/octet-stream';
  }

  /**
   * Finds an available port starting from the given port
   * @param {number} startPort - Starting port number
   * @returns {Promise<number>} Available port number
   */
  async findAvailablePort(startPort) {
    const isPortAvailable = (port) => {
      return new Promise((resolve) => {
        const server = http.createServer();
        server.listen(port, () => {
          server.close(() => resolve(true));
        });
        server.on('error', () => resolve(false));
      });
    };

    let port = startPort;
    while (port < startPort + 100) {
      if (await isPortAvailable(port)) {
        return port;
      }
      port++;
    }

    throw new Error(`No available port found starting from ${startPort}`);
  }

  /**
   * Gets the base URL for the test server
   * @returns {string} Base URL
   */
  getBaseUrl() {
    return `http://localhost:${this.port}`;
  }
}

module.exports = TestServer;
