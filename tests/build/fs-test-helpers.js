const fs = require('fs-extra');
const path = require('path');

/**
 * File system testing helper functions
 */

/**
 * Mock build script functions for isolated testing
 */
class BuildScriptMock {
  constructor(srcDir, distDir) {
    this.srcDir = srcDir;
    this.distDir = distDir;
  }

  /**
   * Mock version of cleanDist function
   */
  async cleanDist() {
    await fs.emptyDir(this.distDir);
  }

  /**
   * Mock version of copyStaticAssets function
   */
  async copyStaticAssets(assets = []) {
    for (const asset of assets) {
      const srcPath = path.join(this.srcDir, asset.src);
      const destPath = path.join(this.distDir, asset.dest);

      if (await fs.pathExists(srcPath)) {
        await fs.ensureDir(path.dirname(destPath));
        await fs.copy(srcPath, destPath);
      }
    }
  }

  /**
   * Mock version of processSitemap function
   */
  async processSitemap(sitemapFile = 'sitemap.xml') {
    const srcPath = path.join(this.srcDir, sitemapFile);
    const distPath = path.join(this.distDir, sitemapFile);

    if (!(await fs.pathExists(srcPath))) return;

    const formattedDate = new Date().toISOString().slice(0, 10);
    let sitemapContent = await fs.readFile(srcPath, 'utf8');
    sitemapContent = sitemapContent.replace(
      /<lastmod>.*<\/lastmod>/g,
      `<lastmod>${formattedDate}</lastmod>`,
    );

    await fs.writeFile(distPath, sitemapContent, 'utf8');
  }
}

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
   * @param {Array<Object>} expectedFiles - Array of {src, dest} file mappings
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

  /**
   * Validate file permissions and accessibility
   * @param {string} filePath - Path to file
   * @returns {Promise<Object>} Validation result
   */
  static async validateFilePermissions(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const isReadable = await fs
        .access(filePath, fs.constants.R_OK)
        .then(() => true)
        .catch(() => false);
      const isWritable = await fs
        .access(filePath, fs.constants.W_OK)
        .then(() => true)
        .catch(() => false);

      return {
        exists: true,
        isReadable,
        isWritable,
        size: stats.size,
        isValid: isReadable && stats.size > 0,
      };
    } catch (error) {
      return {
        exists: false,
        isReadable: false,
        isWritable: false,
        size: 0,
        isValid: false,
        error: error.message,
      };
    }
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
  BuildScriptMock,
  FileSystemValidators,
  TestDataGenerators,
};
