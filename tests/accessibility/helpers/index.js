/**
 * Main accessibility testing helpers
 * Combines axe-core setup and browser management for comprehensive accessibility testing
 */

const { getBrowserManager, BrowserManager } = require('./browser-manager');
const {
  createAxeConfig,
  injectAxe,
  configureAxe,
  runAxeAnalysis,
  formatViolations,
  generateRemediationSuggestions,
  THEME_CONFIGS,
} = require('./axe-setup');

/**
 * Accessibility test helper class that combines browser management and axe-core functionality
 */
class AccessibilityTestHelper {
  constructor(options = {}) {
    this.browserManager = getBrowserManager(options.browserOptions);
    this.axeConfig = createAxeConfig(options.axeOptions);
    this.testConfig = {
      testBothThemes: true,
      takeScreenshots: false,
      screenshotDir: './test-reports/screenshots',
      ...options.testConfig,
    };
  }

  /**
   * Initializes the accessibility testing environment
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      await this.browserManager.launch();
    } catch (error) {
      throw new Error(
        `Failed to initialize accessibility testing: ${error.message}`,
      );
    }
  }

  /**
   * Tests a single page for accessibility violations
   * @param {string} url - URL to test
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Test results
   */
  async testPage(url, options = {}) {
    let page = null;

    try {
      // Create and configure page
      page = await this.browserManager.createPage(options.pageOptions);

      // Navigate to the URL
      await this.browserManager.navigateAndWait(
        page,
        url,
        options.navigationOptions,
      );

      // Inject and configure axe-core
      await injectAxe(page);
      await configureAxe(page, this.axeConfig);

      const results = {};

      // Test themes if configured
      if (this.testConfig.testBothThemes) {
        results.light = await this.testTheme(page, 'light', options);
        results.dark = await this.testTheme(page, 'dark', options);
      } else {
        // Test current theme only
        results.current = await this.runSingleTest(page, options);
      }

      return {
        url,
        timestamp: new Date().toISOString(),
        success: this.isTestSuccessful(results),
        results,
      };
    } catch (error) {
      throw new Error(`Accessibility test failed for ${url}: ${error.message}`);
    } finally {
      if (page) {
        await this.browserManager.closePage(page);
      }
    }
  }

  /**
   * Tests a specific theme for accessibility violations
   * @param {Object} page - Puppeteer page instance
   * @param {string} themeName - Theme name ('light' or 'dark')
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Theme test results
   */
  async testTheme(page, themeName, options = {}) {
    try {
      const themeConfig = THEME_CONFIGS[themeName];
      if (!themeConfig) {
        throw new Error(`Unknown theme: ${themeName}`);
      }

      // Set up the theme
      await themeConfig.setup(page);

      // Take screenshot if configured
      if (this.testConfig.takeScreenshots) {
        const screenshotPath = `${this.testConfig.screenshotDir}/${themeName}-theme.png`;
        await this.browserManager.takeScreenshot(page, screenshotPath);
      }

      // Run accessibility analysis
      const axeResults = await runAxeAnalysis(
        page,
        this.axeConfig,
        options.context,
      );

      // Format results
      const formattedResults = {
        theme: themeName,
        violations: formatViolations(axeResults.violations),
        passes: axeResults.passes.length,
        incomplete: axeResults.incomplete.length,
        inapplicable: axeResults.inapplicable.length,
        timestamp: new Date().toISOString(),
      };

      // Add remediation suggestions if there are violations
      if (formattedResults.violations.length > 0) {
        formattedResults.remediationSuggestions =
          generateRemediationSuggestions(axeResults.violations);
      }

      return formattedResults;
    } catch (error) {
      throw new Error(`Theme test failed for ${themeName}: ${error.message}`);
    }
  }

  /**
   * Runs a single accessibility test without theme switching
   * @param {Object} page - Puppeteer page instance
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Test results
   */
  async runSingleTest(page, options = {}) {
    try {
      // Take screenshot if configured
      if (this.testConfig.takeScreenshots) {
        const screenshotPath = `${this.testConfig.screenshotDir}/current-theme.png`;
        await this.browserManager.takeScreenshot(page, screenshotPath);
      }

      // Run accessibility analysis
      const axeResults = await runAxeAnalysis(
        page,
        this.axeConfig,
        options.context,
      );

      // Format results
      const formattedResults = {
        violations: formatViolations(axeResults.violations),
        passes: axeResults.passes.length,
        incomplete: axeResults.incomplete.length,
        inapplicable: axeResults.inapplicable.length,
        timestamp: new Date().toISOString(),
      };

      // Add remediation suggestions if there are violations
      if (formattedResults.violations.length > 0) {
        formattedResults.remediationSuggestions =
          generateRemediationSuggestions(axeResults.violations);
      }

      return formattedResults;
    } catch (error) {
      throw new Error(`Accessibility test failed: ${error.message}`);
    }
  }

  /**
   * Tests multiple pages for accessibility violations
   * @param {Array<string>} urls - Array of URLs to test
   * @param {Object} options - Test options
   * @returns {Promise<Array>} Array of test results
   */
  async testMultiplePages(urls, options = {}) {
    const results = [];

    try {
      for (const url of urls) {
        try {
          const result = await this.testPage(url, options);
          results.push(result);
        } catch (error) {
          results.push({
            url,
            timestamp: new Date().toISOString(),
            success: false,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Multiple page testing failed: ${error.message}`);
    }
  }

  /**
   * Determines if test results indicate success (no violations)
   * @param {Object} results - Test results object
   * @returns {boolean} True if no violations found
   */
  isTestSuccessful(results) {
    if (results.light && results.dark) {
      return (
        results.light.violations.length === 0 &&
        results.dark.violations.length === 0
      );
    } else if (results.current) {
      return results.current.violations.length === 0;
    }
    return false;
  }

  /**
   * Generates a summary report of test results
   * @param {Array} testResults - Array of test results
   * @returns {Object} Summary report
   */
  generateSummaryReport(testResults) {
    const summary = {
      totalPages: testResults.length,
      successfulPages: 0,
      failedPages: 0,
      totalViolations: 0,
      violationsByType: {},
      timestamp: new Date().toISOString(),
    };

    testResults.forEach((result) => {
      if (result.success) {
        summary.successfulPages++;
      } else {
        summary.failedPages++;
      }

      // Count violations
      if (result.results) {
        Object.values(result.results).forEach((themeResult) => {
          if (themeResult.violations) {
            summary.totalViolations += themeResult.violations.length;

            themeResult.violations.forEach((violation) => {
              if (!summary.violationsByType[violation.id]) {
                summary.violationsByType[violation.id] = 0;
              }
              summary.violationsByType[violation.id]++;
            });
          }
        });
      }
    });

    return summary;
  }

  /**
   * Cleans up resources
   */
  async cleanup() {
    try {
      await this.browserManager.close();
    } catch {
      console.warn(
        `[Cleanup Warning] Accessibility test helper cleanup failed: ${error.message}`,
      );
    }
  }
}

module.exports = {
  AccessibilityTestHelper,
  getBrowserManager,
  BrowserManager,
  createAxeConfig,
  THEME_CONFIGS,
};
