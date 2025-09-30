# Accessibility Testing with Puppeteer and axe-core

This directory contains the accessibility testing infrastructure using Puppeteer for browser automation and axe-core for WCAG compliance testing.

## Overview

The accessibility testing module provides automated WCAG compliance verification for both light and dark themes of the homepage. It uses industry-standard tools to ensure consistent accessibility standards.

## Components

### Core Files

- **`helpers/axe-setup.js`** - Axe-core configuration and utilities for WCAG testing
- **`helpers/browser-manager.js`** - Puppeteer browser instance management and cleanup
- **`helpers/index.js`** - Main accessibility testing helper that combines both modules
- **`integration.test.js`** - Integration tests to verify the setup is working correctly

### Key Features

1. **WCAG Compliance Testing**
   - Configurable WCAG levels (A, AA, AAA)
   - Custom rule exclusions
   - Detailed violation reporting with remediation suggestions

2. **Theme Testing**
   - Automatic light/dark theme switching
   - Theme-specific accessibility validation
   - Screenshot capture for debugging

3. **Browser Management**
   - Optimized Puppeteer configuration for CI/CD
   - Automatic cleanup and resource management
   - Error handling and retry logic

## Usage

### Basic Usage

```javascript
const { AccessibilityTestHelper } = require('./helpers');

// Initialize the helper
const helper = new AccessibilityTestHelper({
  axeOptions: {
    wcagLevel: ['wcag2a', 'wcag2aa'],
    excludeRules: ['color-contrast'], // Optional rules to skip
  },
  testConfig: {
    testBothThemes: true,
    takeScreenshots: false,
  },
});

// Test a single page
await helper.initialize();
const results = await helper.testPage('http://localhost:3000');
console.log('Violations found:', results.results.light.violations.length);

// Cleanup
await helper.cleanup();
```

### Testing Multiple Pages

```javascript
const urls = [
  'http://localhost:3000',
  'http://localhost:3000/cv',
  'http://localhost:3000/case-study/subscription-model',
];

const results = await helper.testMultiplePages(urls);
const summary = helper.generateSummaryReport(results);
console.log(
  `Tested ${summary.totalPages} pages, found ${summary.totalViolations} violations`,
);
```

### Custom Configuration

```javascript
const helper = new AccessibilityTestHelper({
  browserOptions: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
  axeOptions: {
    wcagLevel: ['wcag2a', 'wcag2aa', 'wcag2aaa'],
    excludeRules: ['color-contrast', 'focus-order-semantics'],
    includeBestPractices: true,
    timeout: 30000,
  },
  testConfig: {
    testBothThemes: true,
    takeScreenshots: true,
    screenshotDir: './test-reports/screenshots',
  },
});
```

## Configuration Options

### Axe Options

- **`wcagLevel`** - Array of WCAG levels to test (e.g., `['wcag2a', 'wcag2aa']`)
- **`excludeRules`** - Array of axe rule IDs to exclude from testing
- **`includeBestPractices`** - Include axe best practice rules (default: true)
- **`timeout`** - Timeout for axe analysis in milliseconds (default: 30000)

### Browser Options

- **`headless`** - Run browser in headless mode (default: true in CI)
- **`args`** - Additional Chrome/Chromium arguments
- **`defaultViewport`** - Default viewport size for testing
- **`timeout`** - Browser operation timeout

### Test Config

- **`testBothThemes`** - Test both light and dark themes (default: true)
- **`takeScreenshots`** - Capture screenshots during testing (default: false)
- **`screenshotDir`** - Directory for screenshot storage

## Dependencies

The accessibility testing module requires the following npm packages:

```json
{
  "puppeteer": "^23.10.4",
  "axe-core": "^4.10.2"
}
```

### Installation

**Option 1: Automatic Installation**

```bash
npm run install:accessibility-deps
```

**Option 2: Manual Installation**

```bash
npm install puppeteer axe-core
```

**Option 3: Check Current Status**

```bash
node test-dependency-check.js
```

The testing infrastructure includes graceful dependency handling - tests will skip with helpful messages if dependencies are missing.

## CI/CD Integration

The accessibility tests are designed to run in CI environments:

```yaml
- name: Run Accessibility Tests
  run: npm run test:accessibility
  env:
    CI: true
```

The tests automatically configure themselves for headless operation in CI environments.

## Troubleshooting

### Common Issues

1. **Browser Launch Failures**
   - Ensure required system dependencies are installed
   - Add `--no-sandbox` and `--disable-setuid-sandbox` args for Docker/CI
   - Check available memory and disk space

2. **Axe Injection Failures**
   - Verify the page has loaded completely before injecting axe
   - Check for Content Security Policy restrictions
   - Ensure the page is accessible via HTTP/HTTPS

3. **Theme Switching Issues**
   - Verify theme switching JavaScript is available
   - Check CSS custom properties are properly configured
   - Ensure theme transitions have completed before testing

### Debug Mode

Enable debug mode for detailed logging:

```javascript
const helper = new AccessibilityTestHelper({
  browserOptions: {
    headless: false, // Show browser window
    slowMo: 100, // Slow down operations
  },
  testConfig: {
    takeScreenshots: true, // Capture screenshots
  },
});
```

## Validation

Run the validation script to verify the setup:

```bash
node validate-setup.js
```

This will test module imports and basic functionality without running the full test suite.
