/**
 * Simple test script for dependency checker
 */

console.log('🔧 Testing dependency checker...\n');

try {
  const {
    checkDependencies,
  } = require('./tests/accessibility/helpers/dependency-check');

  const status = checkDependencies();

  console.log('📦 Dependency Status:');
  console.log(
    `  Puppeteer: ${status.puppeteer ? '✅ Available' : '❌ Missing'}`,
  );
  console.log(`  Axe-core: ${status.axeCore ? '✅ Available' : '❌ Missing'}`);
  console.log(`  All Available: ${status.allAvailable ? '✅ Yes' : '❌ No'}`);

  if (!status.allAvailable) {
    console.log('\n🔧 To fix this issue:');
    console.log('1. Run: npm install puppeteer axe-core');
    console.log('2. Or run: npm run install:accessibility-deps');
  } else {
    console.log('\n🎉 All dependencies are available!');
  }

  console.log('\n✅ Dependency checker is working correctly');
} catch (error) {
  console.error('❌ Error testing dependency checker:', error.message);
  process.exit(1);
}
