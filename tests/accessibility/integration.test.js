/**
 * Integration tests for Puppeteer and axe-core setup
 * Verifies that the accessibility testing infrastructure is working correctly
 */

const { AccessibilityTestHelper } = require('./helpers');
const { getBrowserManager } = require('./helpers/browser-manager');
const { injectAxe, createAxeConfig } = require('./helpers/axe-setup');

describe('Puppeteer and axe-core Integration', () => {
  let browserManager;
  let accessibilityHelper;

  beforeAll(async () => {
    // Initialize browser manager for integration tests
    browserManager = getBrowserManager({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  });

  afterAll(async () => {
    // Clean up browser resources
    if (browserManager) {
      await browserManager.close();
    }
    if (accessibilityHelper) {
      await accessibilityHelper.cleanup();
    }
  });

  describe('Browser Manager', () => {
    test('should launch browser successfully', async () => {
      const browser = await browserManager.launch();
      expect(browser).toBeDefined();
      expect(browser.isConnected()).toBe(true);
    });

    test('should create page with proper configuration', async () => {
      const page = await browserManager.createPage({
        viewport: { width: 1280, height: 720 },
      });

      expect(page).toBeDefined();

      const viewport = page.viewport();
      expect(viewport.width).toBe(1280);
      expect(viewport.height).toBe(720);

      await browserManager.closePage(page);
    });

    test('should navigate to simple HTML page', async () => {
      const page = await browserManager.createPage();

      // Create a simple HTML page for testing
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Page</title>
        </head>
        <body>
          <h1>Test Page</h1>
          <p>This is a test page for accessibility testing.</p>
        </body>
        </html>
      `;

      await page.setContent(htmlContent);

      const title = await page.title();
      expect(title).toBe('Test Page');

      const h1Text = await page.$eval('h1', (el) => el.textContent);
      expect(h1Text).toBe('Test Page');

      await browserManager.closePage(page);
    });

    test('should get browser information', async () => {
      const info = await browserManager.getBrowserInfo();
      expect(info.status).toBe('running');
      expect(info.version).toBeDefined();
      expect(info.isConnected).toBe(true);
    });
  });

  describe('Axe-core Integration', () => {
    let page;

    beforeEach(async () => {
      page = await browserManager.createPage();
    });

    afterEach(async () => {
      if (page) {
        await browserManager.closePage(page);
      }
    });

    test('should inject axe-core successfully', async () => {
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Axe Test</title>
        </head>
        <body>
          <h1>Axe Integration Test</h1>
        </body>
        </html>
      `;

      await page.setContent(htmlContent);
      await injectAxe(page);

      const axeExists = await page.evaluate(
        () => typeof window.axe !== 'undefined',
      );
      expect(axeExists).toBe(true);
    });

    test('should create axe configuration', () => {
      const config = createAxeConfig({
        wcagLevel: ['wcag2a', 'wcag2aa'],
        excludeRules: ['color-contrast'],
        includeBestPractices: true,
      });

      expect(config.tags).toContain('wcag2a');
      expect(config.tags).toContain('wcag2aa');
      expect(config.tags).toContain('best-practice');
      expect(config.disableRules).toContain('color-contrast');
    });

    test('should run axe analysis on simple page', async () => {
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Axe Analysis Test</title>
        </head>
        <body>
          <h1>Test Page</h1>
          <p>This page should pass basic accessibility tests.</p>
          <button>Click me</button>
        </body>
        </html>
      `;

      await page.setContent(htmlContent);
      await injectAxe(page);

      const results = await page.evaluate(async () => {
        return await window.axe.run();
      });

      expect(results).toBeDefined();
      expect(results.violations).toBeDefined();
      expect(results.passes).toBeDefined();
      expect(Array.isArray(results.violations)).toBe(true);
      expect(Array.isArray(results.passes)).toBe(true);
    });
  });

  describe('Accessibility Test Helper', () => {
    beforeEach(() => {
      accessibilityHelper = new AccessibilityTestHelper({
        browserOptions: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
        axeOptions: {
          wcagLevel: ['wcag2a', 'wcag2aa'],
          includeBestPractices: false,
        },
        testConfig: {
          testBothThemes: false,
          takeScreenshots: false,
        },
      });
    });

    afterEach(async () => {
      if (accessibilityHelper) {
        await accessibilityHelper.cleanup();
      }
    });

    test('should initialize successfully', async () => {
      await accessibilityHelper.initialize();

      const browserInfo =
        await accessibilityHelper.browserManager.getBrowserInfo();
      expect(browserInfo.status).toBe('running');
    });

    test('should test simple HTML content', async () => {
      await accessibilityHelper.initialize();

      // Create a page with the helper's browser manager
      const page = await accessibilityHelper.browserManager.createPage();

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Helper Test</title>
        </head>
        <body>
          <h1>Accessibility Helper Test</h1>
          <p>Testing the accessibility helper functionality.</p>
        </body>
        </html>
      `;

      await page.setContent(htmlContent);

      // Test using the helper's single test method
      await injectAxe(page);
      const results = await accessibilityHelper.runSingleTest(page);

      expect(results).toBeDefined();
      expect(results.violations).toBeDefined();
      expect(results.passes).toBeDefined();
      expect(typeof results.passes).toBe('number');

      await accessibilityHelper.browserManager.closePage(page);
    });

    test('should determine test success correctly', () => {
      const successfulResults = {
        current: { violations: [] },
      };

      const failedResults = {
        current: { violations: [{ id: 'test-violation' }] },
      };

      expect(accessibilityHelper.isTestSuccessful(successfulResults)).toBe(
        true,
      );
      expect(accessibilityHelper.isTestSuccessful(failedResults)).toBe(false);
    });

    test('should generate summary report', () => {
      const testResults = [
        {
          url: 'http://example.com/page1',
          success: true,
          results: { current: { violations: [] } },
        },
        {
          url: 'http://example.com/page2',
          success: false,
          results: { current: { violations: [{ id: 'color-contrast' }] } },
        },
      ];

      const summary = accessibilityHelper.generateSummaryReport(testResults);

      expect(summary.totalPages).toBe(2);
      expect(summary.successfulPages).toBe(1);
      expect(summary.failedPages).toBe(1);
      expect(summary.totalViolations).toBe(1);
      expect(summary.violationsByType['color-contrast']).toBe(1);
    });
  });
});
