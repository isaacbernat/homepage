/**
 * Centralized test configuration loader with validation
 * Provides configuration for all test modules with defaults and validation
 */

const path = require('path');
const fs = require('fs');

/**
 * Default test configuration
 */
const defaultConfig = {
  // Global settings
  global: {
    testTimeout: 30000,
    distDirectory: './dist',
    baseUrl: 'http://localhost:3000',
    reportDirectory: './test-reports',
  },

  // Accessibility testing configuration
  accessibility: {
    enabled: true,
    wcagLevel: ['wcag2a', 'wcag2aa'],
    testBothThemes: true,
    excludeRules: [],
    timeout: 30000,
  },

  // Performance testing configuration
  performance: {
    enabled: true,
    budgets: {
      performance: 95,
      accessibility: 100,
      bestPractices: 95,
      seo: 95,
    },
    testMobile: true,
    testDesktop: true,
    timeout: 60000,
  },

  // Build script testing configuration
  build: {
    enabled: true,
    timeout: 15000,
  },

  // Visual regression testing configuration
  visual: {
    enabled: true,
    threshold: 0.2, // Pixel difference threshold (0-1)
    updateBaseline: false,
    viewports: [
      { width: 1920, height: 1080 },
      { width: 768, height: 1024 },
    ],
    timeout: 45000,
  },
};

/**
 * Configuration validation schema
 */
const validationSchema = {
  global: {
    testTimeout: 'number',
    distDirectory: 'string',
    baseUrl: 'string',
    reportDirectory: 'string',
  },
  accessibility: {
    enabled: 'boolean',
    wcagLevel: 'array',
    testBothThemes: 'boolean',
    excludeRules: 'array',
    timeout: 'number',
  },
  performance: {
    enabled: 'boolean',
    budgets: 'object',
    testMobile: 'boolean',
    testDesktop: 'boolean',
    timeout: 'number',
  },
  build: {
    enabled: 'boolean',
    timeout: 'number',
  },
  visual: {
    enabled: 'boolean',
    threshold: 'number',
    updateBaseline: 'boolean',
    viewports: 'array',
    timeout: 'number',
  },
};

/**
 * Validates configuration object against schema
 * @param {Object} config - Configuration to validate
 * @param {Object} schema - Validation schema
 * @param {string} path - Current path for error reporting
 * @returns {Array} Array of validation errors
 */
function validateConfig(config, schema, path = '') {
  const errors = [];

  for (const [key, expectedType] of Object.entries(schema)) {
    const currentPath = path ? `${path}.${key}` : key;
    const value = config[key];

    if (value === undefined) {
      errors.push(`Missing required configuration: ${currentPath}`);
      continue;
    }

    if (
      expectedType === 'object' &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      // For nested objects, we'll do basic type checking
      continue;
    } else if (expectedType === 'array' && !Array.isArray(value)) {
      errors.push(
        `Configuration ${currentPath} must be an array, got ${typeof value}`,
      );
    } else if (
      expectedType !== 'array' &&
      expectedType !== 'object' &&
      typeof value !== expectedType
    ) {
      errors.push(
        `Configuration ${currentPath} must be ${expectedType}, got ${typeof value}`,
      );
    }

    // Additional validation for specific fields
    if (key === 'threshold' && (value < 0 || value > 1)) {
      errors.push(
        `Configuration ${currentPath} must be between 0 and 1, got ${value}`,
      );
    }

    if (key === 'wcagLevel' && Array.isArray(value)) {
      const validLevels = ['wcag2a', 'wcag2aa', 'wcag2aaa'];
      const invalidLevels = value.filter(
        (level) => !validLevels.includes(level),
      );
      if (invalidLevels.length > 0) {
        errors.push(
          `Configuration ${currentPath} contains invalid WCAG levels: ${invalidLevels.join(', ')}`,
        );
      }
    }
  }

  return errors;
}

/**
 * Loads and validates test configuration
 * @param {string} configPath - Optional path to custom configuration file
 * @returns {Object} Validated configuration object
 */
function loadConfig(configPath = null) {
  let config = { ...defaultConfig };

  // Try to load custom configuration if provided or if default config file exists
  const customConfigPath =
    configPath || path.join(process.cwd(), 'test-config.json');

  if (fs.existsSync(customConfigPath)) {
    try {
      const customConfig = JSON.parse(
        fs.readFileSync(customConfigPath, 'utf8'),
      );
      config = mergeConfig(config, customConfig);
    } catch (error) {
      throw new Error(
        `Failed to load configuration from ${customConfigPath}: ${error.message}`,
      );
    }
  }

  // Validate the final configuration
  const errors = [];
  for (const [section, sectionSchema] of Object.entries(validationSchema)) {
    const sectionErrors = validateConfig(
      config[section],
      sectionSchema,
      section,
    );
    errors.push(...sectionErrors);
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }

  return config;
}

/**
 * Deep merges two configuration objects
 * @param {Object} target - Target configuration
 * @param {Object} source - Source configuration to merge
 * @returns {Object} Merged configuration
 */
function mergeConfig(target, source) {
  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      result[key] = mergeConfig(result[key] || {}, value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Gets configuration for a specific test module
 * @param {string} module - Module name (accessibility, performance, build, visual)
 * @param {string} configPath - Optional path to custom configuration file
 * @returns {Object} Module-specific configuration
 */
function getModuleConfig(module, configPath = null) {
  const config = loadConfig(configPath);

  if (!config[module]) {
    throw new Error(`Configuration for module '${module}' not found`);
  }

  return {
    ...config.global,
    ...config[module],
  };
}

/**
 * Checks if a test module is enabled
 * @param {string} module - Module name
 * @param {string} configPath - Optional path to custom configuration file
 * @returns {boolean} True if module is enabled
 */
function isModuleEnabled(module, configPath = null) {
  try {
    const moduleConfig = getModuleConfig(module, configPath);
    return moduleConfig.enabled === true;
  } catch {
    return false;
  }
}

module.exports = {
  loadConfig,
  getModuleConfig,
  isModuleEnabled,
  defaultConfig,
  validateConfig,
};
