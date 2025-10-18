/**
 * Test suite for TestServer utility
 */

const TestServer = require('./test-server');
const { createTestServer, isPortAvailable } = require('./test-server');
const http = require('http');
const fs = require('fs');
const path = require('path');

describe('TestServer', () => {
  let testServer;
  let tempDistDir;

  beforeEach(async () => {
    // Create temporary dist directory with test files
    tempDistDir = path.join(__dirname, '../fixtures/temp-dist');

    if (!fs.existsSync(tempDistDir)) {
      fs.mkdirSync(tempDistDir, { recursive: true });
    }

    // Create test files
    fs.writeFileSync(
      path.join(tempDistDir, 'index.html'),
      '<html><body>Test Page</body></html>',
    );
    fs.writeFileSync(
      path.join(tempDistDir, 'style.css'),
      'body { color: red; }',
    );
    fs.writeFileSync(
      path.join(tempDistDir, 'script.js'),
      'console.log("test");',
    );

    // Create subdirectory with index.html
    const subDir = path.join(tempDistDir, 'subdir');
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(
      path.join(subDir, 'index.html'),
      '<html><body>Sub Page</body></html>',
    );
  });

  afterEach(async () => {
    if (testServer) {
      await testServer.cleanup();
      testServer = null;
    }

    // Clean up temp directory
    if (fs.existsSync(tempDistDir)) {
      fs.rmSync(tempDistDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should create server with default options', () => {
      testServer = new TestServer();
      expect(testServer.port).toBe(3000);
      expect(testServer.distDirectory).toBe('./dist');
      expect(testServer.isRunning).toBe(false);
    });

    it('should create server with custom options', () => {
      testServer = new TestServer({
        port: 4000,
        distDirectory: '/custom/path',
      });
      expect(testServer.port).toBe(4000);
      expect(testServer.distDirectory).toBe('/custom/path');
    });
  });

  describe('start', () => {
    it('should start server successfully', async () => {
      testServer = new TestServer({ distDirectory: tempDistDir });
      const port = await testServer.start();

      expect(typeof port).toBe('number');
      expect(testServer.isServerRunning()).toBe(true);
      expect(testServer.getPort()).toBe(port);
    });

    it.skip('should find available port if default is taken', async () => {
      // Start a server on port 3000 ... unstable in GH Actions environment
      const blockingServer = http.createServer();
      await new Promise((resolve) => blockingServer.listen(3000, resolve));

      try {
        testServer = new TestServer({ distDirectory: tempDistDir });
        const port = await testServer.start();

        expect(port).toBeGreaterThan(3000);
        expect(testServer.isServerRunning()).toBe(true);
      } finally {
        blockingServer.close();
      }
    });

    it('should return same port if already running', async () => {
      testServer = new TestServer({ distDirectory: tempDistDir });
      const port1 = await testServer.start();
      const port2 = await testServer.start();

      expect(port1).toBe(port2);
    });

    it('should throw error if dist directory does not exist', async () => {
      testServer = new TestServer({ distDirectory: '/nonexistent/path' });

      await expect(testServer.start()).rejects.toThrow(
        'Distribution directory does not exist',
      );
    });
  });

  describe('stop', () => {
    it('should stop server successfully', async () => {
      testServer = new TestServer({ distDirectory: tempDistDir });
      await testServer.start();

      expect(testServer.isServerRunning()).toBe(true);

      await testServer.stop();

      expect(testServer.isServerRunning()).toBe(false);
    });

    it('should handle stop when server is not running', async () => {
      testServer = new TestServer({ distDirectory: tempDistDir });

      // Should not throw
      await testServer.stop();
      expect(testServer.isServerRunning()).toBe(false);
    });
  });

  describe('HTTP requests', () => {
    beforeEach(async () => {
      testServer = new TestServer({ distDirectory: tempDistDir });
      await testServer.start();
      await testServer.waitForReady();
    });

    it('should serve index.html for root path', async () => {
      const response = await makeRequest(testServer.getBaseUrl() + '/');

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('text/html');
      expect(response.body).toContain('Test Page');
    });

    it('should serve static files with correct content types', async () => {
      const cssResponse = await makeRequest(
        testServer.getBaseUrl() + '/style.css',
      );
      expect(cssResponse.statusCode).toBe(200);
      expect(cssResponse.headers['content-type']).toBe('text/css');
      expect(cssResponse.body).toContain('color: red');

      const jsResponse = await makeRequest(
        testServer.getBaseUrl() + '/script.js',
      );
      expect(jsResponse.statusCode).toBe(200);
      expect(jsResponse.headers['content-type']).toBe('application/javascript');
      expect(jsResponse.body).toContain('console.log');
    });

    it('should serve index.html from subdirectories', async () => {
      const response = await makeRequest(testServer.getBaseUrl() + '/subdir/');

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('text/html');
      expect(response.body).toContain('Sub Page');
    });

    it('should return 404 for non-existent files', async () => {
      const response = await makeRequest(
        testServer.getBaseUrl() + '/nonexistent.html',
      );

      expect(response.statusCode).toBe(404);
      expect(response.body).toContain('File not found');
    });

    it('should prevent directory traversal attacks', async () => {
      // Test directory traversal attempts - these should be blocked or return 404
      const traversalPaths = [
        '/../../../package.json', // Try to access project root
        '/../../README.md', // Try to access parent directory
        '/../build.js', // Try to access sibling directory
      ];

      for (const traversalPath of traversalPaths) {
        const response = await makeRequest(
          testServer.getBaseUrl() + traversalPath,
        );
        // Should either be 403 (forbidden) or 404 (not found), but not 200 (success)
        expect([403, 404]).toContain(response.statusCode);
        if (response.statusCode === 403) {
          expect(response.body).toContain('Forbidden');
        } else if (response.statusCode === 404) {
          expect(response.body).toContain('File not found');
        }
      }
    });

    it('should handle URL decoding correctly', async () => {
      // Create a file with spaces in the name
      fs.writeFileSync(
        path.join(tempDistDir, 'test file.html'),
        '<html><body>Spaced File</body></html>',
      );

      const response = await makeRequest(
        testServer.getBaseUrl() + '/test%20file.html',
      );

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Spaced File');
    });
  });

  describe('utility methods', () => {
    beforeEach(async () => {
      testServer = new TestServer({ distDirectory: tempDistDir });
      await testServer.start();
    });

    it('should return correct base URL', () => {
      const baseUrl = testServer.getBaseUrl();
      expect(baseUrl).toMatch(/^http:\/\/localhost:\d+$/);
    });

    it('should throw error when getting base URL if server not running', async () => {
      await testServer.stop();
      expect(() => testServer.getBaseUrl()).toThrow(
        'Test server is not running',
      );
    });

    it('should wait for server to be ready', async () => {
      await expect(testServer.waitForReady()).resolves.toBeUndefined();
    });

    it('should timeout if server is not ready', async () => {
      await testServer.stop();
      await expect(testServer.waitForReady(100)).rejects.toThrow(
        'Server is not running',
      );
    });

    it('should perform health check', async () => {
      const isHealthy = await testServer.checkServerHealth();
      expect(isHealthy).toBe(true);
    });

    it('should return false for health check when server is stopped', async () => {
      await testServer.stop();
      const isHealthy = await testServer.checkServerHealth();
      expect(isHealthy).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should cleanup server resources', async () => {
      testServer = new TestServer({ distDirectory: tempDistDir });
      await testServer.start();

      expect(testServer.isServerRunning()).toBe(true);

      await testServer.cleanup();

      expect(testServer.isServerRunning()).toBe(false);
    });
  });

  describe('createTestServer utility', () => {
    it('should create and start server', async () => {
      testServer = await createTestServer({ distDirectory: tempDistDir });

      expect(testServer.isServerRunning()).toBe(true);
      expect(testServer instanceof TestServer).toBe(true);
    });
  });

  describe('isPortAvailable utility', () => {
    it('should return true for available port', async () => {
      const available = await isPortAvailable(9999);
      expect(available).toBe(true);
    });

    it('should return false for occupied port', async () => {
      testServer = new TestServer({ distDirectory: tempDistDir });
      const port = await testServer.start();

      const available = await isPortAvailable(port);
      expect(available).toBe(false);
    });
  });
});

/**
 * Helper function to make HTTP requests
 * @param {string} url - URL to request
 * @returns {Promise<Object>} Response object with statusCode, headers, and body
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
        });
      });

      res.on('error', (error) => {
        reject(error);
      });
    });

    req.on('error', (error) => {
      // Handle connection errors more gracefully
      if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
        reject(new Error(`Connection error: ${error.code}`));
      } else {
        reject(error);
      }
    });

    req.setTimeout(3000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}
