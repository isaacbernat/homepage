/**
 * Browser instance management and cleanup utilities for Puppeteer
 * Provides centralized browser lifecycle management for accessibility testing
 */

const { getPuppeteer, requireDependencies } = require('./dependency-check');

/**
 * Default Puppeteer launch options optimized for testing
 */
const DEFAULT_LAUNCH_OPTIONS = {
  // Headless mode for CI environments
  headless: process.env.CI ? 'new' : false,

  // Browser arguments for better testing compatibility
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
  ],

  // Default viewport for consistent testing
  defaultViewport: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    isLandscape: true,
  },

  // Timeout settings
  timeout: 30000,

  // Ignore HTTPS errors for local testing
  ignoreHTTPSErrors: true,

  // Slow down operations for more reliable testing
  slowMo: process.env.CI ? 0 : 50,
};

/**
 * Browser manager class for handling Puppeteer instances
 */
class BrowserManager {
  constructor(options = {}) {
    this.browser = null;
    this.pages = new Set();
    this.launchOptions = {
      ...DEFAULT_LAUNCH_OPTIONS,
      ...options,
    };
    this.isInitialized = false;
  }

  /**
   * Launches a new browser instance
   * @returns {Promise<Object>} Puppeteer browser instance
   */
  async launch() {
    try {
      // Check dependencies before launching
      requireDependencies('browser management');
      const puppeteer = getPuppeteer();

      if (this.browser) {
        console.log('⚠️  Browser already launched, reusing existing instance');
        return this.browser;
      }

      console.log('🚀 Launching Puppeteer browser...');
      this.browser = await puppeteer.launch(this.launchOptions);
      this.isInitialized = true;

      // Set up error handling
      this.browser.on('disconnected', () => {
        console.log('🔌 Browser disconnected');
        this.cleanup();
      });

      console.log('✓ Browser launched successfully');
      return this.browser;
    } catch (error) {
      throw new Error(`Failed to launch browser: ${error.message}`);
    }
  }

  /**
   * Creates a new page with accessibility-optimized settings
   * @param {Object} options - Page configuration options
   * @returns {Promise<Object>} Puppeteer page instance
   */
  async createPage(options = {}) {
    try {
      if (!this.browser) {
        await this.launch();
      }

      const page = await this.browser.newPage();
      this.pages.add(page);

      // Configure page for accessibility testing
      await this.configurePage(page, options);

      console.log(`✓ New page created (${this.pages.size} total pages)`);
      return page;
    } catch (error) {
      throw new Error(`Failed to create page: ${error.message}`);
    }
  }

  /**
   * Configures a page with accessibility-friendly settings
   * @param {Object} page - Puppeteer page instance
   * @param {Object} options - Configuration options
   */
  async configurePage(page, options = {}) {
    try {
      // Set viewport if specified
      if (options.viewport) {
        await page.setViewport(options.viewport);
      }

      // Set user agent for consistent testing
      if (options.userAgent) {
        await page.setUserAgent(options.userAgent);
      }

      // Configure timeouts
      page.setDefaultTimeout(options.timeout || 30000);
      page.setDefaultNavigationTimeout(options.navigationTimeout || 30000);

      // Enable request interception if needed
      if (options.interceptRequests) {
        await page.setRequestInterception(true);

        page.on('request', (request) => {
          // Block unnecessary resources for faster testing
          const resourceType = request.resourceType();
          if (
            ['image', 'stylesheet', 'font'].includes(resourceType) &&
            options.blockResources
          ) {
            request.abort();
          } else {
            request.continue();
          }
        });
      }

      // Set up console logging for debugging
      if (options.logConsole) {
        page.on('console', (msg) => {
          console.log(`🖥️  Page console: ${msg.text()}`);
        });
      }

      // Set up error handling
      page.on('error', (error) => {
        console.error(`❌ Page error: ${error.message}`);
      });

      page.on('pageerror', (error) => {
        console.error(`❌ Page script error: ${error.message}`);
      });
    } catch (error) {
      throw new Error(`Failed to configure page: ${error.message}`);
    }
  }

  /**
   * Navigates to a URL and waits for the page to be ready for testing
   * @param {Object} page - Puppeteer page instance
   * @param {string} url - URL to navigate to
   * @param {Object} options - Navigation options
   * @returns {Promise<void>}
   */
  async navigateAndWait(page, url, options = {}) {
    try {
      console.log(`🔗 Navigating to: ${url}`);

      // Navigate to the URL
      await page.goto(url, {
        waitUntil: options.waitUntil || 'networkidle0',
        timeout: options.timeout || 30000,
      });

      // Wait for additional conditions if specified
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, {
          timeout: options.selectorTimeout || 10000,
        });
      }

      if (options.waitForFunction) {
        await page.waitForFunction(options.waitForFunction, {
          timeout: options.functionTimeout || 10000,
        });
      }

      // Additional wait time for dynamic content
      if (options.additionalWait) {
        await page.waitForTimeout(options.additionalWait);
      }

      console.log('✓ Page loaded and ready for testing');
    } catch (error) {
      throw new Error(`Failed to navigate to ${url}: ${error.message}`);
    }
  }

  /**
   * Closes a specific page
   * @param {Object} page - Puppeteer page instance to close
   */
  async closePage(page) {
    try {
      if (this.pages.has(page)) {
        await page.close();
        this.pages.delete(page);
        console.log(`✓ Page closed (${this.pages.size} remaining)`);
      }
    } catch (error) {
      console.error(`Failed to close page: ${error.message}`);
    }
  }

  /**
   * Closes all open pages
   */
  async closeAllPages() {
    try {
      const closePromises = Array.from(this.pages).map((page) =>
        this.closePage(page),
      );
      await Promise.all(closePromises);
      console.log('✓ All pages closed');
    } catch (error) {
      console.error(`Failed to close all pages: ${error.message}`);
    }
  }

  /**
   * Closes the browser and cleans up resources
   */
  async close() {
    try {
      if (this.browser) {
        await this.closeAllPages();
        await this.browser.close();
        console.log('✓ Browser closed successfully');
      }
    } catch (error) {
      console.error(`Failed to close browser: ${error.message}`);
    } finally {
      this.cleanup();
    }
  }

  /**
   * Internal cleanup method
   */
  cleanup() {
    this.browser = null;
    this.pages.clear();
    this.isInitialized = false;
  }

  /**
   * Gets browser information for debugging
   * @returns {Object} Browser information
   */
  async getBrowserInfo() {
    if (!this.browser) {
      return { status: 'not_launched' };
    }

    try {
      const version = await this.browser.version();
      const userAgent = await this.browser.userAgent();

      return {
        status: 'running',
        version,
        userAgent,
        pagesCount: this.pages.size,
        isConnected: this.browser.isConnected(),
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Creates a screenshot for debugging purposes
   * @param {Object} page - Puppeteer page instance
   * @param {string} filename - Screenshot filename
   * @param {Object} options - Screenshot options
   */
  async takeScreenshot(page, filename, options = {}) {
    try {
      const screenshotOptions = {
        path: filename,
        fullPage: options.fullPage || true,
        type: options.type || 'png',
        ...options,
      };

      await page.screenshot(screenshotOptions);
      console.log(`📸 Screenshot saved: ${filename}`);
    } catch (error) {
      console.error(`Failed to take screenshot: ${error.message}`);
    }
  }
}

/**
 * Global browser manager instance for shared use
 */
let globalBrowserManager = null;

/**
 * Gets or creates a global browser manager instance
 * @param {Object} options - Browser launch options
 * @returns {BrowserManager} Browser manager instance
 */
function getBrowserManager(options = {}) {
  if (!globalBrowserManager) {
    globalBrowserManager = new BrowserManager(options);
  }
  return globalBrowserManager;
}

/**
 * Cleanup function for graceful shutdown
 */
async function cleanup() {
  if (globalBrowserManager) {
    await globalBrowserManager.close();
    globalBrowserManager = null;
  }
}

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

module.exports = {
  BrowserManager,
  getBrowserManager,
  cleanup,
  DEFAULT_LAUNCH_OPTIONS,
};
