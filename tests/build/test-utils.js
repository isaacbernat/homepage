const fs = require('fs-extra');
const path = require('path');
const os = require('os');

/**
 * Utility functions for build script testing
 */

class TestUtils {
  constructor() {
    this.tempDirs = [];
  }

  /**
   * Create a temporary directory for testing
   * @param {string} prefix - Prefix for the temp directory name
   * @returns {Promise<string>} Path to the created temporary directory
   */
  async createTempDir(prefix = 'build-test-') {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
    this.tempDirs.push(tempDir);
    return tempDir;
  }

  /**
   * Clean up all temporary directories created during testing
   */
  async cleanupTempDirs() {
    await Promise.all(
      this.tempDirs.map(async (dir) => {
        try {
          await fs.remove(dir);
        } catch (error) {
          // Ignore cleanup errors
          console.warn(`Failed to cleanup temp dir ${dir}:`, error.message);
        }
      }),
    );
    this.tempDirs = [];
  }

  /**
   * Copy fixture files to a temporary source directory
   * @param {string} tempDir - Target temporary directory
   * @param {Array<string>} fixtures - Array of fixture filenames to copy
   * @returns {Promise<string>} Path to the created source directory
   */
  async setupFixtures(tempDir, fixtures = []) {
    const srcDir = path.join(tempDir, 'src');
    await fs.ensureDir(srcDir);

    const fixturesDir = path.join(__dirname, 'fixtures');

    for (const fixture of fixtures) {
      const srcPath = path.join(fixturesDir, fixture);
      const destPath = path.join(srcDir, fixture);

      // Ensure destination directory exists
      await fs.ensureDir(path.dirname(destPath));
      await fs.copy(srcPath, destPath);
    }

    return srcDir;
  }

  /**
   * Compare file contents between two files
   * @param {string} file1Path - Path to first file
   * @param {string} file2Path - Path to second file
   * @returns {Promise<boolean>} True if files are identical
   */
  async compareFiles(file1Path, file2Path) {
    try {
      const [content1, content2] = await Promise.all([
        fs.readFile(file1Path, 'utf8'),
        fs.readFile(file2Path, 'utf8'),
      ]);
      return content1 === content2;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a file exists and has content
   * @param {string} filePath - Path to the file
   * @returns {Promise<boolean>} True if file exists and has content
   */
  async fileExistsWithContent(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.isFile() && stats.size > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file size in bytes
   * @param {string} filePath - Path to the file
   * @returns {Promise<number>} File size in bytes, or 0 if file doesn't exist
   */
  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check if a file is minified by comparing sizes
   * @param {string} originalPath - Path to original file
   * @param {string} minifiedPath - Path to minified file
   * @returns {Promise<boolean>} True if minified file is smaller than original
   */
  async isMinified(originalPath, minifiedPath) {
    const [originalSize, minifiedSize] = await Promise.all([
      this.getFileSize(originalPath),
      this.getFileSize(minifiedPath),
    ]);

    return minifiedSize > 0 && minifiedSize < originalSize;
  }

  /**
   * Read and parse JSON file
   * @param {string} filePath - Path to JSON file
   * @returns {Promise<Object>} Parsed JSON object
   */
  async readJsonFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Check if directory exists and contains files
   * @param {string} dirPath - Path to directory
   * @returns {Promise<boolean>} True if directory exists and contains files
   */
  async directoryHasFiles(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      return files.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get list of files in directory recursively
   * @param {string} dirPath - Path to directory
   * @returns {Promise<Array<string>>} Array of file paths relative to the directory
   */
  async getFilesInDirectory(dirPath) {
    const files = [];

    async function traverse(currentPath, relativePath = '') {
      const items = await fs.readdir(currentPath);

      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const relativeItemPath = path.join(relativePath, item);
        const stats = await fs.stat(fullPath);

        if (stats.isFile()) {
          files.push(relativeItemPath);
        } else if (stats.isDirectory()) {
          await traverse(fullPath, relativeItemPath);
        }
      }
    }

    try {
      await traverse(dirPath);
      return files.sort();
    } catch (error) {
      return [];
    }
  }

  /**
   * Verify that HTML contains expected minified asset references
   * @param {string} htmlContent - HTML content to check
   * @param {Array<string>} expectedAssets - Array of expected minified asset names
   * @returns {boolean} True if all expected assets are referenced
   */
  verifyMinifiedAssetReferences(htmlContent, expectedAssets) {
    return expectedAssets.every((asset) => htmlContent.includes(asset));
  }

  /**
   * Extract date from sitemap XML content
   * @param {string} sitemapContent - XML content of sitemap
   * @returns {Array<string>} Array of dates found in lastmod tags
   */
  extractSitemapDates(sitemapContent) {
    const dateRegex = /<lastmod>(.*?)<\/lastmod>/g;
    const dates = [];
    let match;

    while ((match = dateRegex.exec(sitemapContent)) !== null) {
      dates.push(match[1]);
    }

    return dates;
  }

  /**
   * Check if a date string is today's date in YYYY-MM-DD format
   * @param {string} dateString - Date string to check
   * @returns {boolean} True if date is today
   */
  isToday(dateString) {
    const today = new Date().toISOString().slice(0, 10);
    return dateString === today;
  }
}

module.exports = TestUtils;
