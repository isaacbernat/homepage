/**
 * Dependency checker for Puppeteer and axe-core
 * Provides graceful handling when dependencies are not installed
 */

let puppeteer = null;
let axeCore = null;

// Try to load puppeteer
try {
  puppeteer = require('puppeteer');
} catch {
  console.warn(
    '⚠️  Puppeteer not found. Please install it with: npm install puppeteer',
  );
  puppeteer = null;
}

// Try to load axe-core
try {
  axeCore = require('axe-core');
} catch {
  console.warn(
    '⚠️  Axe-core not found. Please install it with: npm install axe-core',
  );
  axeCore = null;
}

/**
 * Checks if all required dependencies are available
 * @returns {Object} Status of dependencies
 */
function checkDependencies() {
  const status = {
    puppeteer: !!puppeteer,
    axeCore: !!axeCore,
    allAvailable: !!puppeteer && !!axeCore,
  };

  return status;
}

/**
 * Throws an error if dependencies are missing
 * @param {string} context - Context where dependencies are needed
 */
function requireDependencies(context = 'accessibility testing') {
  const status = checkDependencies();

  if (!status.allAvailable) {
    const missing = [];
    if (!status.puppeteer) missing.push('puppeteer');
    if (!status.axeCore) missing.push('axe-core');

    throw new Error(
      `Missing required dependencies for ${context}: ${missing.join(', ')}\n` +
        'Please install them with: npm install puppeteer axe-core',
    );
  }
}

/**
 * Gets puppeteer module if available
 * @returns {Object|null} Puppeteer module or null
 */
function getPuppeteer() {
  if (!puppeteer) {
    throw new Error('Puppeteer is not installed. Run: npm install puppeteer');
  }
  return puppeteer;
}

/**
 * Gets axe-core module if available
 * @returns {Object|null} Axe-core module or null
 */
function getAxeCore() {
  if (!axeCore) {
    throw new Error('Axe-core is not installed. Run: npm install axe-core');
  }
  return axeCore;
}

module.exports = {
  checkDependencies,
  requireDependencies,
  getPuppeteer,
  getAxeCore,
  isAvailable: checkDependencies().allAvailable,
};
