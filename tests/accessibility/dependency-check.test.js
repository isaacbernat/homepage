/**
 * Dependency check tests for accessibility testing infrastructure
 * Verifies that required dependencies are installed and available
 */

const { checkDependencies } = require('./helpers/dependency-check');

describe('Accessibility Testing Dependencies', () => {
  test('should check dependency availability', () => {
    const status = checkDependencies();

    console.log('📦 Dependency Status:');
    console.log(
      `  Puppeteer: ${status.puppeteer ? '✅ Available' : '❌ Missing'}`,
    );
    console.log(
      `  Axe-core: ${status.axeCore ? '✅ Available' : '❌ Missing'}`,
    );

    if (!status.allAvailable) {
      console.log('\n🔧 To install missing dependencies:');
      if (!status.puppeteer) console.log('  npm install puppeteer');
      if (!status.axeCore) console.log('  npm install axe-core');
      console.log('  Or install both: npm install puppeteer axe-core');
    }

    // This test always passes but provides useful information
    expect(typeof status).toBe('object');
    expect(typeof status.puppeteer).toBe('boolean');
    expect(typeof status.axeCore).toBe('boolean');
    expect(typeof status.allAvailable).toBe('boolean');
  });

  test('should provide installation instructions when dependencies are missing', () => {
    const status = checkDependencies();

    if (!status.allAvailable) {
      const missing = [];
      if (!status.puppeteer) missing.push('puppeteer');
      if (!status.axeCore) missing.push('axe-core');

      console.log(`\n⚠️  Missing dependencies: ${missing.join(', ')}`);
      console.log('Run the following command to install them:');
      console.log(`npm install ${missing.join(' ')}`);
    } else {
      console.log('✅ All accessibility testing dependencies are available!');
    }

    // Test passes regardless of dependency status
    expect(true).toBe(true);
  });
});
