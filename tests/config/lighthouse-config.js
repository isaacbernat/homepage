/**
 * Lighthouse audit configuration
 * Defines custom Lighthouse configuration for performance testing
 */

/**
 * Default Lighthouse configuration for CI/automated testing
 */
const lighthouseConfig = {
  extends: 'lighthouse:default',
  settings: {
    // Run in headless mode for CI
    chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'],
    
    // Optimize for CI environment
    maxWaitForFcp: 15 * 1000,
    maxWaitForLoad: 35 * 1000,
    
    // Skip certain audits that may be flaky in CI
    skipAudits: [
      'uses-http2',
      'uses-long-cache-ttl',
      'uses-text-compression'
    ],
    
    // Throttling settings for consistent results
    throttlingMethod: 'simulate',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    },
    
    // Screen emulation
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false
    }
  },
  
  // Categories to audit
  categories: {
    performance: {
      title: 'Performance',
      weight: 1
    },
    accessibility: {
      title: 'Accessibility',
      weight: 1
    },
    'best-practices': {
      title: 'Best Practices',
      weight: 1
    },
    seo: {
      title: 'SEO',
      weight: 1
    }
  }
};

/**
 * Mobile-specific Lighthouse configuration
 */
const mobileLighthouseConfig = {
  ...lighthouseConfig,
  settings: {
    ...lighthouseConfig.settings,
    formFactor: 'mobile',
    screenEmulation: {
      mobile: true,
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      disabled: false
    },
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    }
  }
};

/**
 * Desktop-specific Lighthouse configuration
 */
const desktopLighthouseConfig = {
  ...lighthouseConfig,
  settings: {
    ...lighthouseConfig.settings,
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false
    }
  }
};

/**
 * Gets Lighthouse configuration based on device type
 * @param {string} deviceType - 'mobile' or 'desktop'
 * @returns {Object} Lighthouse configuration
 */
function getLighthouseConfig(deviceType = 'desktop') {
  switch (deviceType.toLowerCase()) {
    case 'mobile':
      return mobileLighthouseConfig;
    case 'desktop':
      return desktopLighthouseConfig;
    default:
      return lighthouseConfig;
  }
}

module.exports = {
  lighthouseConfig,
  mobileLighthouseConfig,
  desktopLighthouseConfig,
  getLighthouseConfig
};