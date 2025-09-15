# Automated Testing Suite

This directory contains the automated testing suite for the homepage project. The testing suite provides comprehensive quality assurance through multiple testing modules.

## Directory Structure

```
tests/
├── config/                   # Test configuration and setup
│   ├── test-config.js        # Centralized configuration loader
│   ├── lighthouse-config.js  # Lighthouse audit configuration
│   └── visual-config.js      # Visual regression test configuration
├── accessibility/            # Accessibility testing (WCAG compliance)
├── performance/              # Performance testing (Lighthouse audits)
├── build/                    # Build script unit tests
├── visual/                   # Visual regression testing
└── utils/                    # Shared utilities
    ├── test-server.js        # Local HTTP server for testing
    └── report-generator.js   # Test report generation
```

## Configuration

The testing suite uses a centralized configuration system that merges settings from multiple sources. For customization, create a `test-config.json` file in the project root to provide high-level overrides. These values will be merged with more detailed, tool-specific defaults defined in files like `visual-config.js` and `lighthouse-config.js`.

See `test-config.json.example` for all available override options.

### Configuration Options

- **Global Settings**: Test timeouts, directories, and server configuration.
- **Accessibility**: WCAG compliance levels, theme testing, rule exclusions.
- **Performance**: Lighthouse budgets, mobile/desktop testing.
- **Build**: Build script testing configuration.
- **Visual**: Screenshot comparison thresholds, viewports, baseline management.

## Available Test Commands

```bash
# Run all tests
npm test

# Run all tests (passes even if no tests are found)
npm run test:all

# Run specific test modules
npm run test:accessibility
npm run test:performance
npm run test:build
npm run test:visual

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Modules

### 1. Configuration System

- Centralized test configuration with validation
- Module-specific configuration loading
- Environment-specific overrides

### 2. Accessibility Testing (Coming Soon)

- WCAG 2.0 AA compliance verification
- Light and dark theme testing
- Detailed violation reporting with remediation suggestions

### 3. Performance Testing (Coming Soon)

- Lighthouse audits for performance, accessibility, best practices, and SEO
- Configurable performance budgets
- Mobile and desktop testing

### 4. Build Script Testing (Coming Soon)

- Unit tests for the custom build script
- Asset minification verification
- File generation and processing validation

### 5. Visual Regression Testing (Coming Soon)

- Screenshot-based visual change detection
- Multi-theme and responsive testing
- Baseline image management

## CI Integration

The testing suite is designed to integrate with GitHub Actions. Test results are automatically generated in JUnit XML format for CI reporting, and HTML reports are created for detailed analysis.

## Development

When adding new test modules:

1. Create the module directory under `tests/`
2. Add module-specific configuration to `test-config.js`
3. Create test files with `.test.js` extension
4. Update this README with module documentation

## Troubleshooting

- **Port conflicts**: The test server automatically finds available ports starting from 3000
- **Configuration errors**: Run the configuration tests to verify your setup
- **Missing dependencies**: Ensure all npm dependencies are installed with `npm install`

For detailed error information, check the test reports in the `test-reports/` directory after running tests.
