/**
 * Visual regression testing configuration
 * Defines thresholds and settings for visual comparison tests
 */

/**
 * Default visual regression test configuration
 */
const visualConfig = {
  // Pixel difference threshold (0-1, where 0 = no differences allowed, 1 = all differences allowed)
  threshold: 0.2,

  // Whether to update baseline images (set to true when intentional changes are made)
  updateBaseline: false,

  // Viewports to test
  viewports: [
    {
      name: 'desktop',
      width: 1920,
      height: 1080,
    },
    {
      name: 'tablet',
      width: 768,
      height: 1024,
    },
    {
      name: 'mobile',
      width: 375,
      height: 667,
    },
  ],

  // Pages to test for visual regression
  pages: [
    {
      name: 'homepage',
      path: '/',
      waitForSelector: 'main',
      themes: ['light', 'dark'],
    },
    {
      name: 'cv',
      path: '/cv',
      waitForSelector: '.cv-container',
      themes: ['light', 'dark'],
    },
  ],

  // Screenshot options
  screenshot: {
    fullPage: true,
    animations: 'disabled',
    clip: null, // Can be set to { x, y, width, height } to capture specific area
  },

  // Comparison options
  comparison: {
    // Threshold for pixel differences (0-1)
    threshold: 0.2,

    // Include anti-aliasing differences
    includeAA: false,

    // Ignore regions (can be used to ignore dynamic content)
    ignoreRegions: [
      // Example: { x: 0, y: 0, width: 100, height: 50 }
    ],
  },

  // Directory structure
  directories: {
    baseline: 'tests/visual/screenshots/baseline',
    current: 'tests/visual/screenshots/current',
    diff: 'tests/visual/screenshots/diff',
  },
};

/**
 * Gets visual configuration with environment-specific overrides
 * @param {Object} overrides - Configuration overrides
 * @returns {Object} Visual configuration
 */
function getVisualConfig(overrides = {}) {
  const config = { ...visualConfig };

  // Apply overrides
  if (overrides.threshold !== undefined) {
    config.threshold = overrides.threshold;
    config.comparison.threshold = overrides.threshold;
  }

  if (overrides.updateBaseline !== undefined) {
    config.updateBaseline = overrides.updateBaseline;
  }

  if (overrides.viewports) {
    config.viewports = overrides.viewports;
  }

  if (overrides.pages) {
    config.pages = overrides.pages;
  }

  return config;
}

/**
 * Gets screenshot filename for a given test scenario
 * @param {string} pageName - Name of the page
 * @param {string} theme - Theme name (light/dark)
 * @param {string} viewport - Viewport name
 * @returns {string} Screenshot filename
 */
function getScreenshotFilename(pageName, theme, viewport) {
  return `${pageName}-${theme}-${viewport}.png`;
}

/**
 * Gets all screenshot scenarios based on configuration
 * @param {Object} config - Visual configuration
 * @returns {Array} Array of screenshot scenarios
 */
function getScreenshotScenarios(config = visualConfig) {
  const scenarios = [];

  for (const page of config.pages) {
    for (const theme of page.themes) {
      for (const viewport of config.viewports) {
        scenarios.push({
          pageName: page.name,
          path: page.path,
          theme,
          viewport: viewport.name,
          viewportSize: { width: viewport.width, height: viewport.height },
          waitForSelector: page.waitForSelector,
          filename: getScreenshotFilename(page.name, theme, viewport.name),
        });
      }
    }
  }

  return scenarios;
}

module.exports = {
  visualConfig,
  getVisualConfig,
  getScreenshotFilename,
  getScreenshotScenarios,
};
