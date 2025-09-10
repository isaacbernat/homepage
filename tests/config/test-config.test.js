/**
 * Tests for the test configuration system
 */

const { loadConfig, getModuleConfig, isModuleEnabled, validateConfig } = require('./test-config');
const fs = require('fs');
const path = require('path');

describe('Test Configuration System', () => {
  describe('loadConfig', () => {
    test('should load default configuration when no custom config exists', () => {
      const config = loadConfig();
      
      expect(config).toBeDefined();
      expect(config.global).toBeDefined();
      expect(config.accessibility).toBeDefined();
      expect(config.performance).toBeDefined();
      expect(config.build).toBeDefined();
      expect(config.visual).toBeDefined();
    });

    test('should have correct default values', () => {
      const config = loadConfig();
      
      expect(config.global.testTimeout).toBe(30000);
      expect(config.global.distDirectory).toBe('./dist');
      expect(config.global.baseUrl).toBe('http://localhost:3000');
      expect(config.accessibility.enabled).toBe(true);
      expect(config.performance.enabled).toBe(true);
      expect(config.build.enabled).toBe(true);
      expect(config.visual.enabled).toBe(true);
    });

    test('should throw error for invalid configuration file', () => {
      const invalidConfigPath = path.join(__dirname, 'invalid-config.json');
      
      // Create invalid JSON file
      fs.writeFileSync(invalidConfigPath, '{ invalid json }');
      
      expect(() => {
        loadConfig(invalidConfigPath);
      }).toThrow();
      
      // Clean up
      fs.unlinkSync(invalidConfigPath);
    });
  });

  describe('getModuleConfig', () => {
    test('should return module-specific configuration', () => {
      const accessibilityConfig = getModuleConfig('accessibility');
      
      expect(accessibilityConfig).toBeDefined();
      expect(accessibilityConfig.enabled).toBe(true);
      expect(accessibilityConfig.wcagLevel).toEqual(['wcag2a', 'wcag2aa']);
      expect(accessibilityConfig.testBothThemes).toBe(true);
      
      // Should include global settings
      expect(accessibilityConfig.testTimeout).toBe(30000);
      expect(accessibilityConfig.distDirectory).toBe('./dist');
    });

    test('should throw error for non-existent module', () => {
      expect(() => {
        getModuleConfig('nonexistent');
      }).toThrow('Configuration for module \'nonexistent\' not found');
    });
  });

  describe('isModuleEnabled', () => {
    test('should return true for enabled modules', () => {
      expect(isModuleEnabled('accessibility')).toBe(true);
      expect(isModuleEnabled('performance')).toBe(true);
      expect(isModuleEnabled('build')).toBe(true);
      expect(isModuleEnabled('visual')).toBe(true);
    });

    test('should return false for non-existent modules', () => {
      expect(isModuleEnabled('nonexistent')).toBe(false);
    });
  });

  describe('validateConfig', () => {
    test('should return no errors for valid configuration', () => {
      const validConfig = {
        testTimeout: 30000,
        distDirectory: './dist',
        baseUrl: 'http://localhost:3000',
        reportDirectory: './test-reports'
      };
      
      const schema = {
        testTimeout: 'number',
        distDirectory: 'string',
        baseUrl: 'string',
        reportDirectory: 'string'
      };
      
      const errors = validateConfig(validConfig, schema);
      expect(errors).toEqual([]);
    });

    test('should return errors for invalid configuration', () => {
      const invalidConfig = {
        testTimeout: 'not a number',
        distDirectory: 123,
        // missing baseUrl and reportDirectory
      };
      
      const schema = {
        testTimeout: 'number',
        distDirectory: 'string',
        baseUrl: 'string',
        reportDirectory: 'string'
      };
      
      const errors = validateConfig(invalidConfig, schema);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.includes('testTimeout'))).toBe(true);
      expect(errors.some(error => error.includes('distDirectory'))).toBe(true);
      expect(errors.some(error => error.includes('baseUrl'))).toBe(true);
      expect(errors.some(error => error.includes('reportDirectory'))).toBe(true);
    });

    test('should validate WCAG levels', () => {
      const invalidConfig = {
        wcagLevel: ['invalid-level', 'wcag2a']
      };
      
      const schema = {
        wcagLevel: 'array'
      };
      
      const errors = validateConfig(invalidConfig, schema);
      expect(errors.some(error => error.includes('invalid WCAG levels'))).toBe(true);
    });

    test('should validate threshold range', () => {
      const invalidConfig = {
        threshold: 1.5 // Should be between 0 and 1
      };
      
      const schema = {
        threshold: 'number'
      };
      
      const errors = validateConfig(invalidConfig, schema);
      expect(errors.some(error => error.includes('must be between 0 and 1'))).toBe(true);
    });
  });
});