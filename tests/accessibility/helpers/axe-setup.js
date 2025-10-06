/**
 * Axe-core setup and configuration for accessibility testing
 * Provides utilities for WCAG compliance testing with customizable rules
 */

/**
 * Default axe-core configuration for WCAG compliance testing
 */
const DEFAULT_AXE_CONFIG = {
  // WCAG 2.0 Level A and AA rules
  tags: ['wcag2a', 'wcag2aa'],

  // Rules to exclude (can be overridden in test config)
  disableRules: [],

  // Include additional best practice rules
  includeBestPractices: true,

  // Timeout for axe analysis
  timeout: 30000,

  // Options for axe.run()
  runOptions: {
    // Include iframes in analysis
    iframes: true,

    // Performance optimization
    performanceTimer: false,

    // Return detailed results
    resultTypes: ['violations', 'incomplete', 'passes'],

    // Selector engine options
    selectors: true,

    // Include ancestry information for violations
    ancestry: true,

    // Include XPath selectors
    xpath: true,
  },
};

/**
 * Theme-specific configurations for testing both light and dark modes
 */
const THEME_CONFIGS = {
  light: {
    name: 'Light Theme',
    selector: 'html:not([data-theme="dark"])',
    setup: async (page) => {
      // Ensure light theme is active
      await page.evaluate(() => {
        document.documentElement.removeAttribute('data-theme');
        // Trigger any theme-related JavaScript
        if (window.setTheme) {
          window.setTheme('light');
        }
      });
      // Wait for theme transition to complete
      await page.waitForFunction(() => {
        // Check a CSS variable or a computed style that changes with the theme
        const bodyColor = getComputedStyle(document.body).getPropertyValue(
          '--color-text',
        );
        return bodyColor.trim() === '#333'; // Matches light theme --color-text
      });
    },
  },

  dark: {
    name: 'Dark Theme',
    selector: 'html[data-theme="dark"]',
    setup: async (page) => {
      // Set dark theme
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        // Trigger any theme-related JavaScript
        if (window.setTheme) {
          window.setTheme('dark');
        }
      });
      // Wait for theme transition to complete
      await page.waitForFunction(() => {
        const bodyColor = getComputedStyle(document.body).getPropertyValue(
          '--color-text',
        );
        return bodyColor.trim() === '#e4e6eb'; // Matches dark theme --color-text
      });
    },
  },
};

/**
 * Creates axe-core configuration based on test requirements
 * @param {Object} options - Configuration options
 * @param {string[]} options.wcagLevel - WCAG levels to test (e.g., ['wcag2a', 'wcag2aa'])
 * @param {string[]} options.excludeRules - Rules to exclude from testing
 * @param {boolean} options.includeBestPractices - Include best practice rules
 * @param {number} options.timeout - Timeout for axe analysis
 * @returns {Object} Axe configuration object
 */
function createAxeConfig(options = {}) {
  const config = {
    ...DEFAULT_AXE_CONFIG,
    ...options,
  };

  // Set tags based on WCAG level
  if (options.wcagLevel && Array.isArray(options.wcagLevel)) {
    config.tags = [...options.wcagLevel];

    // Add best practices if requested
    if (config.includeBestPractices) {
      config.tags.push('best-practice');
    }
  }

  // Configure rules to disable
  if (options.excludeRules && Array.isArray(options.excludeRules)) {
    config.disableRules = [...options.excludeRules];
  }

  return config;
}

/**
 * Injects axe-core into a Puppeteer page
 * @param {Object} page - Puppeteer page instance
 * @returns {Promise<void>}
 */
async function injectAxe(page) {
  try {
    // Inject axe-core source code into the page
    await page.addScriptTag({
      path: require.resolve('axe-core/axe.min.js'),
    });

    // Verify axe is available
    const axeExists = await page.evaluate(
      () => typeof window.axe !== 'undefined',
    );
    if (!axeExists) {
      throw new Error('Failed to inject axe-core into page');
    }

    console.log('✓ Axe-core successfully injected into page');
  } catch (error) {
    throw new Error(`Failed to inject axe-core: ${error.message}`);
  }
}

/**
 * Configures axe-core with custom rules and settings
 * @param {Object} page - Puppeteer page instance
 * @param {Object} config - Axe configuration object
 * @returns {Promise<void>}
 */
async function configureAxe(page, config) {
  try {
    await page.evaluate((axeConfig) => {
      // Configure rules to disable - use a simpler approach
      if (axeConfig.disableRules && Array.isArray(axeConfig.disableRules) && axeConfig.disableRules.length > 0) {
        // Configure each rule individually to avoid array format issues
        axeConfig.disableRules.forEach((ruleId) => {
          try {
            window.axe.configure({
              rules: {
                [ruleId]: { enabled: false }
              }
            });
            console.log(`✓ Disabled axe rule: ${ruleId}`);
          } catch (ruleError) {
            console.warn(`Failed to disable rule ${ruleId}:`, ruleError.message);
          }
        });
      }

      // Set global timeout separately
      if (axeConfig.timeout) {
        try {
          window.axe.configure({
            timeout: axeConfig.timeout
          });
        } catch (timeoutError) {
          console.warn('Failed to set timeout:', timeoutError.message);
        }
      }
    }, config);

    console.log('✓ Axe-core configured with custom settings');
  } catch (error) {
    throw new Error(`Failed to configure axe-core: ${error.message}`);
  }
}

/**
 * Runs axe-core analysis on a page
 * @param {Object} page - Puppeteer page instance
 * @param {Object} config - Axe configuration object
 * @param {string} context - CSS selector or context for analysis (optional)
 * @returns {Promise<Object>} Axe results object
 */
async function runAxeAnalysis(page, config, context = null) {
  try {
    const results = await page.evaluate(
      async (axeConfig, analysisContext) => {
        const options = {
          tags: axeConfig.tags,
          ...axeConfig.runOptions,
        };

        // Run axe analysis
        const axeResults = await window.axe.run(
          analysisContext || document,
          options,
        );

        return axeResults;
      },
      config,
      context,
    );

    return results;
  } catch (error) {
    throw new Error(`Axe analysis failed: ${error.message}`);
  }
}

/**
 * Formats axe violations for readable reporting
 * @param {Array} violations - Array of axe violation objects
 * @returns {Array} Formatted violation reports
 */
function formatViolations(violations) {
  return violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    description: violation.description,
    help: violation.help,
    helpUrl: violation.helpUrl,
    tags: violation.tags,
    nodes: violation.nodes.map((node) => ({
      target: node.target,
      html: node.html,
      failureSummary: node.failureSummary,
      xpath: node.xpath,
    })),
  }));
}

/**
 * Generates remediation suggestions based on violation types
 * @param {Array} violations - Array of axe violation objects
 * @returns {Array} Array of remediation suggestions
 */
function generateRemediationSuggestions(violations) {
  const suggestions = [];
  const violationTypes = new Set(violations.map((v) => v.id));

  // Common remediation patterns
  const remediationMap = {
    'color-contrast':
      'Increase color contrast ratio to meet WCAG standards. Consider using darker text or lighter backgrounds.',
    'image-alt':
      'Add descriptive alt text to images. Use empty alt="" for decorative images.',
    'heading-order':
      'Ensure headings follow a logical hierarchy (h1 → h2 → h3, etc.).',
    'landmark-one-main':
      'Add a main landmark to identify the primary content area.',
    'page-has-heading-one': 'Add an h1 heading to provide a clear page title.',
    region: 'Wrap content in semantic landmarks (main, nav, aside, etc.).',
    'skip-link':
      'Add a skip link to allow keyboard users to bypass navigation.',
    'focus-order-semantics':
      'Ensure interactive elements have proper focus management.',
    'aria-allowed-attr': 'Remove or correct invalid ARIA attributes.',
    'aria-required-attr': 'Add required ARIA attributes for accessibility.',
    'button-name':
      'Ensure buttons have accessible names via text content or aria-label.',
    'link-name': 'Ensure links have descriptive text or aria-label attributes.',
  };

  violationTypes.forEach((violationType) => {
    if (remediationMap[violationType]) {
      suggestions.push({
        rule: violationType,
        suggestion: remediationMap[violationType],
      });
    }
  });

  return suggestions;
}

module.exports = {
  DEFAULT_AXE_CONFIG,
  THEME_CONFIGS,
  createAxeConfig,
  injectAxe,
  configureAxe,
  runAxeAnalysis,
  formatViolations,
  generateRemediationSuggestions,
};
