# Accessibility Testing Setup Guide

This guide will help you set up the Puppeteer and axe-core integration for accessibility testing.

## Quick Setup

### 1. Install Dependencies

The accessibility testing requires two additional packages that are not installed by default:

```bash
# Option A: Use the automated installer
npm run install:accessibility-deps

# Option B: Install manually
npm install puppeteer axe-core
```

### 2. Verify Installation

```bash
# Check if dependencies are available
node test-dependency-check.js

# Run dependency check tests
npm test tests/accessibility/dependency-check.test.js
```

### 3. Run Accessibility Tests

```bash
# Run all accessibility tests
npm run test:accessibility

# Run specific integration tests
npm test tests/accessibility/integration.test.js
```

## What Gets Installed

### Puppeteer (~200MB)

- Headless Chrome browser for automated testing
- Used for navigating pages and injecting accessibility testing scripts
- Includes Chromium browser binaries

### Axe-core (~2MB)

- Industry-standard accessibility testing engine
- WCAG 2.0/2.1 compliance verification
- Detailed violation reporting and remediation suggestions

## Troubleshooting

### Issue: "Cannot find module 'puppeteer'"

**Solution:**

```bash
npm install puppeteer axe-core
```

### Issue: Puppeteer fails to launch browser

**Common causes and solutions:**

1. **Missing system dependencies (Linux)**

   ```bash
   # Ubuntu/Debian
   sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
   ```

2. **Docker/CI environments**
   - The tests automatically configure `--no-sandbox` and `--disable-setuid-sandbox` flags
   - Ensure sufficient memory allocation (>= 1GB recommended)

3. **macOS permission issues**
   ```bash
   # Allow Terminal/IDE to control system events if prompted
   # Or run with additional flags:
   export PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox"
   ```

### Issue: Tests are slow or timing out

**Solutions:**

1. Increase timeout in Jest configuration
2. Use headless mode (default in CI)
3. Disable unnecessary browser features:
   ```javascript
   const helper = new AccessibilityTestHelper({
     browserOptions: {
       args: [
         '--disable-gpu',
         '--disable-dev-shm-usage',
         '--disable-setuid-sandbox',
         '--no-sandbox',
       ],
     },
   });
   ```

### Issue: Axe-core injection fails

**Common causes:**

1. Content Security Policy blocking script injection
2. Page not fully loaded before injection
3. Network connectivity issues

**Solutions:**

1. Wait for page load: `waitUntil: 'networkidle0'`
2. Add CSP bypass for testing environments
3. Increase injection timeout

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Accessibility Tests
on: [push, pull_request]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run install:accessibility-deps
      - run: npm run test:accessibility
        env:
          CI: true
```

### Docker Example

```dockerfile
FROM node:18-slim

# Install Puppeteer dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci
RUN npm run install:accessibility-deps

COPY . .
CMD ["npm", "run", "test:accessibility"]
```

## Configuration Options

### Browser Configuration

```javascript
const helper = new AccessibilityTestHelper({
  browserOptions: {
    headless: true, // Run in headless mode
    args: ['--no-sandbox'], // Security flags for CI
    defaultViewport: {
      // Default screen size
      width: 1920,
      height: 1080,
    },
    timeout: 30000, // Browser launch timeout
  },
});
```

### Axe Configuration

```javascript
const helper = new AccessibilityTestHelper({
  axeOptions: {
    wcagLevel: ['wcag2a', 'wcag2aa'], // WCAG compliance levels
    excludeRules: ['color-contrast'], // Rules to skip
    includeBestPractices: true, // Include best practice rules
    timeout: 30000, // Analysis timeout
  },
});
```

### Test Configuration

```javascript
const helper = new AccessibilityTestHelper({
  testConfig: {
    testBothThemes: true, // Test light and dark themes
    takeScreenshots: false, // Capture screenshots
    screenshotDir: './screenshots', // Screenshot directory
  },
});
```

## Performance Optimization

### For Faster Tests

1. **Disable images and CSS** (testing structure only):

   ```javascript
   pageOptions: {
     interceptRequests: true,
     blockResources: true
   }
   ```

2. **Use smaller viewport**:

   ```javascript
   viewport: { width: 1280, height: 720 }
   ```

3. **Skip theme testing** for basic checks:
   ```javascript
   testConfig: {
     testBothThemes: false;
   }
   ```

### For Comprehensive Testing

1. **Enable screenshots** for debugging:

   ```javascript
   testConfig: {
     takeScreenshots: true;
   }
   ```

2. **Test multiple viewports**:

   ```javascript
   // Test mobile and desktop
   await helper.testPage(url, {
     viewport: { width: 375, height: 667 },
   });
   ```

3. **Include best practices**:
   ```javascript
   axeOptions: {
     includeBestPractices: true;
   }
   ```

## Next Steps

After successful setup:

1. **Run the integration tests** to verify everything works
2. **Create page-specific accessibility tests** using the helper classes
3. **Integrate with your CI/CD pipeline** for automated testing
4. **Configure custom rules** based on your accessibility requirements

For more detailed usage examples, see the [Accessibility Testing README](tests/accessibility/README.md).
