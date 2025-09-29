/**
 * Local test server utilities
 * Provides HTTP server for serving built files during tests
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

/**
 * Utility function to check if a port is available
 * @param {number} port - Port number to check
 * @returns {Promise<boolean>} True if port is available
 */
async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = http.createServer();

    const timeout = setTimeout(() => {
      server.close();
      resolve(false);
    }, 1000);

    server.listen(port, () => {
      clearTimeout(timeout);
      server.close(() => resolve(true));
    });

    server.on('error', () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

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

    // Verify dist directory exists
    if (!fs.existsSync(this.distDirectory)) {
      throw new Error(
        `Distribution directory does not exist: ${this.distDirectory}`,
      );
    }

    // Find an available port
    const availablePort = await this.findAvailablePort(this.port);
    this.port = availablePort;

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      // Set server timeout to prevent hanging connections
      this.server.timeout = 30000;

      this.server.listen(this.port, (err) => {
        if (err) {
          reject(
            new Error(
              `Failed to start test server on port ${this.port}: ${err.message}`,
            ),
          );
          return;
        }

        this.isRunning = true;
        if (process.env.NODE_ENV !== 'test') {
          console.log(`Test server started on http://localhost:${this.port}`);
        }
        resolve(this.port);
      });

      this.server.on('error', (err) => {
        this.isRunning = false;
        reject(new Error(`Test server error: ${err.message}`));
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

    return new Promise((resolve, reject) => {
      // Force close any remaining connections
      this.server.closeAllConnections?.();

      const timeout = setTimeout(() => {
        reject(new Error('Test server failed to stop within timeout'));
      }, 5000);

      this.server.close((err) => {
        clearTimeout(timeout);
        this.isRunning = false;
        this.server = null;

        if (err) {
          reject(new Error(`Failed to stop test server: ${err.message}`));
          return;
        }

        if (process.env.NODE_ENV !== 'test') {
          console.log('Test server stopped');
        }
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

    // Check if the resolved path is outside the dist directory
    if (
      !resolvedPath.startsWith(resolvedDistDir + path.sep) &&
      resolvedPath !== resolvedDistDir
    ) {
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
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': content.length,
      });
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
    let port = startPort;
    const maxPort = startPort + 100;

    while (port < maxPort) {
      if (await isPortAvailable(port)) {
        return port;
      }
      port++;
    }

    throw new Error(
      `No available port found in range ${startPort}-${maxPort - 1}`,
    );
  }

  /**
   * Gets the base URL for the test server
   * @returns {string} Base URL
   */
  getBaseUrl() {
    if (!this.isRunning) {
      throw new Error('Test server is not running');
    }
    return `http://localhost:${this.port}`;
  }

  /**
   * Checks if the server is currently running
   * @returns {boolean} True if server is running
   */
  isServerRunning() {
    return this.isRunning;
  }

  /**
   * Gets the current port number
   * @returns {number} Port number
   */
  getPort() {
    return this.port;
  }

  /**
   * Waits for the server to be ready to accept connections
   * @param {number} timeout - Timeout in milliseconds (default: 5000)
   * @returns {Promise<void>}
   */
  async waitForReady(timeout = 5000) {
    if (!this.isRunning) {
      throw new Error('Server is not running');
    }

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const available = await this.checkServerHealth();
        if (available) {
          return;
        }
      } catch {
        // Continue waiting
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error(`Server did not become ready within ${timeout}ms`);
  }

  /**
   * Performs a health check on the server
   * @returns {Promise<boolean>} True if server is healthy
   */
  async checkServerHealth() {
    if (!this.isRunning) {
      return false;
    }

    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${this.port}/`, (res) => {
        resolve(res.statusCode < 500);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.setTimeout(1000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Cleanup method to ensure proper resource disposal
   * @returns {Promise<void>}
   */
  async cleanup() {
    try {
      await this.stop();
    } catch (error) {
      // Force cleanup even if stop fails
      this.isRunning = false;
      this.server = null;
      throw error;
    }
  }
}

/**
 * Creates and manages a test server instance with automatic cleanup
 * @param {Object} options - Server options
 * @returns {Promise<TestServer>} Started test server instance
 */
async function createTestServer(options = {}) {
  const server = new TestServer(options);
  await server.start();
  return server;
}

module.exports = TestServer;
module.exports.createTestServer = createTestServer;
module.exports.isPortAvailable = isPortAvailable;
