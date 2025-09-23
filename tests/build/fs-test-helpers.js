const fs = require('fs-extra');
const path = require('path');

/**
 * File system operation validators
 */
class FileSystemValidators {
  /**
   * Validate that directory was properly cleaned and recreated
   * @param {string} dirPath - Path to directory
   * @returns {Promise<Object>} Validation result
   */
  static async validateDirectoryCleaning(dirPath) {
    const exists = await fs.pathExists(dirPath);
    const isEmpty = exists ? (await fs.readdir(dirPath)).length === 0 : false;

    return {
      exists,
      isEmpty,
      isValid: exists && isEmpty,
    };
  }

  /**
   * Validate that files were copied correctly
   * @param {Array<Object>} expectedFiles - Array of objects with a 'dest' property for the destination file path
   * @param {string} baseDir - Base directory for relative paths
   * @returns {Promise<Object>} Validation result
   */
  static async validateFileCopying(expectedFiles, baseDir) {
    const results = [];

    for (const file of expectedFiles) {
      const destPath = path.join(baseDir, file.dest);
      const exists = await fs.pathExists(destPath);
      const isFile = exists ? (await fs.stat(destPath)).isFile() : false;

      results.push({
        file: file.dest,
        exists,
        isFile,
        isValid: exists && isFile,
      });
    }

    const allValid = results.every((r) => r.isValid);

    return {
      results,
      allValid,
      validCount: results.filter((r) => r.isValid).length,
      totalCount: results.length,
    };
  }

  /**
   * Validate directory structure creation
   * @param {string} baseDir - Base directory
   * @param {Array<string>} expectedDirs - Array of expected directory paths
   * @returns {Promise<Object>} Validation result
   */
  static async validateDirectoryStructure(baseDir, expectedDirs) {
    const results = [];

    for (const dir of expectedDirs) {
      const dirPath = path.join(baseDir, dir);
      const exists = await fs.pathExists(dirPath);
      const isDirectory = exists
        ? (await fs.stat(dirPath)).isDirectory()
        : false;

      results.push({
        directory: dir,
        exists,
        isDirectory,
        isValid: exists && isDirectory,
      });
    }

    const allValid = results.every((r) => r.isValid);

    return {
      results,
      allValid,
      validCount: results.filter((r) => r.isValid).length,
      totalCount: results.length,
    };
  }
}

/**
 * Test data generators
 */
class TestDataGenerators {
  /**
   * Generate test file structure
   * @param {string} baseDir - Base directory
   * @returns {Promise<Object>} Created file structure info
   */
  static async generateTestFileStructure(baseDir) {
    const structure = {
      directories: ['images', 'assets', 'case-study', 'content', 'pages'],
      files: [
        { path: 'robots.txt', content: 'User-agent: *\nAllow: /' },
        {
          path: 'sitemap.xml',
          content: '<?xml version="1.0"?><urlset></urlset>',
        },
        { path: 'images/test.jpg', content: 'fake-image-data' },
        { path: 'assets/test.pdf', content: 'fake-pdf-data' },
      ],
    };

    // Create directories
    for (const dir of structure.directories) {
      await fs.ensureDir(path.join(baseDir, dir));
    }

    // Create files
    for (const file of structure.files) {
      const filePath = path.join(baseDir, file.path);
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, file.content);
    }

    return structure;
  }

  /**
   * Generate test content for markdown processing
   * @returns {Object} Test content data
   */
  static generateTestContent() {
    return {
      test_content: '# Test Content\n\nThis is **test** content.',
      another_content: '## Another Section\n\nWith some *italic* text.',
    };
  }
}

module.exports = {
  FileSystemValidators,
  TestDataGenerators,
};
