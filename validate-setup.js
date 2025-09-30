/**
 * Simple validation script to test Puppeteer and axe-core setup
 */

async function validateSetup() {
  try {
    console.log('🔧 Validating Puppeteer and axe-core setup...');

    // Test require statements
    console.log('📦 Testing module imports...');

    try {
      const puppeteer = require('puppeteer');
      console.log('✓ Puppeteer imported successfully');
    } catch (error) {
      console.log('❌ Puppeteer import failed:', error.message);
      return false;
    }

    try {
      const axeCore = require('axe-core');
      console.log('✓ Axe-core imported successfully');
    } catch (error) {
      console.log('❌ Axe-core import failed:', error.message);
      return false;
    }

    // Test our helper modules
    try {
      const {
        AccessibilityTestHelper,
      } = require('./tests/accessibility/helpers');
      console.log('✓ AccessibilityTestHelper imported successfully');
    } catch (error) {
      console.log('❌ AccessibilityTestHelper import failed:', error.message);
      return false;
    }

    try {
      const {
        getBrowserManager,
      } = require('./tests/accessibility/helpers/browser-manager');
      console.log('✓ BrowserManager imported successfully');
    } catch (error) {
      console.log('❌ BrowserManager import failed:', error.message);
      return false;
    }

    try {
      const {
        createAxeConfig,
      } = require('./tests/accessibility/helpers/axe-setup');
      console.log('✓ Axe setup helpers imported successfully');
    } catch (error) {
      console.log('❌ Axe setup helpers import failed:', error.message);
      return false;
    }

    console.log('✅ All modules imported successfully!');

    // Test basic functionality
    console.log('🧪 Testing basic functionality...');

    const {
      createAxeConfig,
    } = require('./tests/accessibility/helpers/axe-setup');
    const config = createAxeConfig({
      wcagLevel: ['wcag2a', 'wcag2aa'],
      excludeRules: ['color-contrast'],
    });

    if (config && config.tags && config.tags.includes('wcag2a')) {
      console.log('✓ Axe configuration creation works');
    } else {
      console.log('❌ Axe configuration creation failed');
      return false;
    }

    console.log('✅ Basic functionality test passed!');
    console.log(
      '🎉 Puppeteer and axe-core setup validation completed successfully!',
    );

    return true;
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return false;
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateSetup().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { validateSetup };
