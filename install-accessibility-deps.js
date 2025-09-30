#!/usr/bin/env node

/**
 * Installation script for accessibility testing dependencies
 * Installs Puppeteer and axe-core if they're not already available
 */

const { execSync } = require('child_process');
const {
  checkDependencies,
} = require('./tests/accessibility/helpers/dependency-check');

async function installDependencies() {
  console.log('🔧 Checking accessibility testing dependencies...\n');

  const status = checkDependencies();

  console.log('📦 Current Status:');
  console.log(
    `  Puppeteer: ${status.puppeteer ? '✅ Available' : '❌ Missing'}`,
  );
  console.log(`  Axe-core: ${status.axeCore ? '✅ Available' : '❌ Missing'}`);

  if (status.allAvailable) {
    console.log('\n🎉 All dependencies are already installed!');
    return true;
  }

  const missing = [];
  if (!status.puppeteer) missing.push('puppeteer');
  if (!status.axeCore) missing.push('axe-core');

  console.log(`\n📥 Installing missing dependencies: ${missing.join(', ')}`);

  try {
    const command = `npm install --save-dev ${missing.join(' ')}`;
    console.log(`Running: ${command}`);

    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    console.log('\n✅ Dependencies installed successfully!');

    // Verify installation
    console.log('\n🔍 Verifying installation...');

    // Clear require cache to get fresh status
    delete require.cache[
      require.resolve('./tests/accessibility/helpers/dependency-check')
    ];
    const {
      checkDependencies: recheckDependencies,
    } = require('./tests/accessibility/helpers/dependency-check');

    const newStatus = recheckDependencies();

    if (newStatus.allAvailable) {
      console.log(
        '✅ Verification successful - all dependencies are now available!',
      );
      console.log('\n🧪 You can now run accessibility tests with:');
      console.log('  npm run test:accessibility');
      return true;
    } else {
      console.log(
        '❌ Verification failed - some dependencies may not have installed correctly',
      );
      return false;
    }
  } catch (error) {
    console.error('\n❌ Installation failed:', error.message);
    console.log('\n🔧 Manual installation:');
    console.log(`  npm install --save-dev ${missing.join(' ')}`);
    return false;
  }
}

// Run installation if this script is executed directly
if (require.main === module) {
  installDependencies()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Installation script failed:', error);
      process.exit(1);
    });
}

module.exports = { installDependencies };
