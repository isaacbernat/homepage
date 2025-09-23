const fs = require('fs-extra');

const TestUtils = require('./test-utils');
const {
  FileSystemValidators,
  TestDataGenerators,
} = require('./fs-test-helpers');

// Import the actual build script functions
const {
  cleanDist,
  minifyJs,
  minifyCss,
  processFavicons,
  copyStaticAssets,
  processSitemap,
} = require('../../build.js');

describe('Build Script Core Functionality', () => {
  let testUtils;
  let tempDir;
  let originalCwd;

  beforeEach(async () => {
    testUtils = new TestUtils();
    tempDir = await testUtils.createTempDir('build-core-test-');

    // Store original working directory
    originalCwd = process.cwd();

    // Change to temp directory for testing
    process.chdir(tempDir);

    // Create src and dist directories in temp location
    await fs.ensureDir('src');
    await fs.ensureDir('dist');
  });

  afterEach(async () => {
    // Restore original working directory
    process.chdir(originalCwd);
    await testUtils.cleanupTempDirs();
  });

  describe('Directory Cleaning and Creation', () => {
    test('should clean and recreate dist directory', async () => {
      // Setup: Create some files in dist directory
      await fs.writeFile('dist/old-file.txt', 'old content');
      await fs.ensureDir('dist/old-dir');

      // Verify files exist before cleaning
      expect(await fs.pathExists('dist/old-file.txt')).toBe(true);
      expect(await fs.pathExists('dist/old-dir')).toBe(true);

      // Execute actual cleanDist function
      await cleanDist();

      // Validate directory was cleaned
      const validation =
        await FileSystemValidators.validateDirectoryCleaning('dist');
      expect(validation.exists).toBe(true);
      expect(validation.isEmpty).toBe(true);
      expect(validation.isValid).toBe(true);
    });

    test('should handle non-existent dist directory', async () => {
      // Remove dist directory
      await fs.remove('dist');
      expect(await fs.pathExists('dist')).toBe(false);

      // Execute actual cleanDist function
      await cleanDist();

      // Validate directory was created
      const validation =
        await FileSystemValidators.validateDirectoryCleaning('dist');
      expect(validation.exists).toBe(true);
      expect(validation.isEmpty).toBe(true);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('JavaScript Minification', () => {
    test('should minify JavaScript and create source map', async () => {
      // Setup test JavaScript file
      const jsContent = `
        // This is a comment that should be removed
        function testFunction(param) {
          console.log('Testing minification');
          const variable = param || 'default';
          return variable.toUpperCase();
        }
        
        // Another comment
        const arrowFunc = (x, y) => {
          return x + y;
        };
      `;

      await fs.writeFile('src/script.js', jsContent);

      // Execute actual minifyJs function
      await minifyJs();

      // Validate minification results
      expect(await testUtils.fileExistsWithContent('dist/script.min.js')).toBe(
        true,
      );
      expect(
        await testUtils.fileExistsWithContent('dist/script.min.js.map'),
      ).toBe(true);
      expect(
        await testUtils.isMinified('src/script.js', 'dist/script.min.js'),
      ).toBe(true);

      // Validate minified content doesn't contain comments
      const minifiedContent = await fs.readFile('dist/script.min.js', 'utf8');
      expect(minifiedContent).not.toContain('// This is a comment');
      expect(minifiedContent).not.toContain('// Another comment');

      // Validate source map is valid JSON
      const sourceMap = await testUtils.readJsonFile('dist/script.min.js.map');
      expect(sourceMap).toHaveProperty('version');
      expect(sourceMap).toHaveProperty('sources');
      expect(sourceMap).toHaveProperty('mappings');
    });

    test('should handle missing JavaScript file gracefully', async () => {
      // Don't create the script.js file
      expect(await fs.pathExists('src/script.js')).toBe(false);

      // This should throw an error since the build script expects the file
      await expect(minifyJs()).rejects.toThrow();
    });
  });

  describe('CSS Minification', () => {
    test('should minify CSS and create source map', async () => {
      // Setup test CSS file
      const cssContent = `
        /* This comment should be removed */
        body {
          margin: 0;
          padding: 20px;
          font-family: Arial, sans-serif;
          background-color: #ffffff;
        }
        
        .test-class {
          display: block;
          width: 100%;
          /* Another comment */
          height: auto;
        }
      `;

      await fs.writeFile('src/style.css', cssContent);

      // Execute actual minifyCss function
      await minifyCss('style.css');

      // Validate minification results
      expect(await testUtils.fileExistsWithContent('dist/style.min.css')).toBe(
        true,
      );
      expect(
        await testUtils.fileExistsWithContent('dist/style.min.css.map'),
      ).toBe(true);
      expect(
        await testUtils.isMinified('src/style.css', 'dist/style.min.css'),
      ).toBe(true);

      // Validate minified content doesn't contain comments
      const minifiedContent = await fs.readFile('dist/style.min.css', 'utf8');
      expect(minifiedContent).not.toContain(
        '/* This comment should be removed */',
      );
      expect(minifiedContent).not.toContain('/* Another comment */');

      // Validate CSS properties are preserved
      expect(minifiedContent).toContain('margin:0');
      expect(minifiedContent).toContain('padding:20px');
    });

    test('should handle non-existent CSS file gracefully', async () => {
      // Don't create the CSS file
      expect(await fs.pathExists('src/non-existent.css')).toBe(false);

      // This should not throw an error - the function should return early
      await expect(minifyCss('non-existent.css')).resolves.not.toThrow();

      // No minified file should be created
      expect(await fs.pathExists('dist/non-existent.min.css')).toBe(false);
    });
  });

  describe('Static Asset Copying', () => {
    test('should copy static assets correctly', async () => {
      // Setup test file structure
      await TestDataGenerators.generateTestFileStructure('src');

      // Execute actual copyStaticAssets function
      await copyStaticAssets();

      // Validate file copying (based on build script's ROOT_FILES_TO_COPY and asset directories)
      const expectedFiles = [
        { dest: 'robots.txt' },
        { dest: 'images/test.jpg' },
        { dest: 'assets/test.pdf' },
      ];

      const validation = await FileSystemValidators.validateFileCopying(
        expectedFiles,
        'dist',
      );
      expect(validation.allValid).toBe(true);
      expect(validation.validCount).toBe(expectedFiles.length);

      // Validate directory structure
      const expectedDirs = ['images', 'assets', 'case-study'];
      const dirValidation =
        await FileSystemValidators.validateDirectoryStructure(
          'dist',
          expectedDirs,
        );
      expect(dirValidation.allValid).toBe(true);
    });

    test('should handle missing source directories gracefully', async () => {
      // Don't create any source directories
      expect(await fs.pathExists('src/images')).toBe(false);
      expect(await fs.pathExists('src/assets')).toBe(false);

      // Execute actual copyStaticAssets function
      await expect(copyStaticAssets()).resolves.not.toThrow();

      // Dist directory should remain empty (no assets copied)
      const files = await testUtils.getFilesInDirectory('dist');
      expect(files).toHaveLength(0);
    });
  });

  describe('Favicon Processing', () => {
    test('should optimize SVG favicon and generate ICO', async () => {
      // Setup test SVG
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <!-- This comment should be removed -->
        <circle cx="50" cy="50" r="40" fill="#007acc" />
        <text x="50" y="60" text-anchor="middle" fill="white">T</text>
      </svg>`;

      await fs.writeFile('src/favicon.svg', svgContent);

      // Execute actual processFavicons function
      await processFavicons();

      // Validate SVG optimization
      expect(await testUtils.fileExistsWithContent('dist/favicon.svg')).toBe(
        true,
      );
      expect(
        await testUtils.isMinified('src/favicon.svg', 'dist/favicon.svg'),
      ).toBe(true);

      const optimizedContent = await fs.readFile('dist/favicon.svg', 'utf8');
      expect(optimizedContent).not.toContain(
        '<!-- This comment should be removed -->',
      );

      // Validate ICO generation
      expect(await testUtils.fileExistsWithContent('dist/favicon.ico')).toBe(
        true,
      );

      const icoSize = await testUtils.getFileSize('dist/favicon.ico');
      expect(icoSize).toBeGreaterThan(0);
      // ICO files should be reasonably sized for multi-size ICO
      expect(icoSize).toBeGreaterThan(1000);
    });

    test('should handle missing SVG favicon gracefully', async () => {
      // Don't create the favicon.svg file
      expect(await fs.pathExists('src/favicon.svg')).toBe(false);

      // Execute actual processFavicons function
      await expect(processFavicons()).resolves.not.toThrow();

      // No favicon files should be created
      expect(await fs.pathExists('dist/favicon.svg')).toBe(false);
      expect(await fs.pathExists('dist/favicon.ico')).toBe(false);
    });
  });

  describe('Sitemap Processing', () => {
    test('should update sitemap.xml with current date', async () => {
      // Setup test sitemap
      const originalSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.example.com/</loc>
    <lastmod>2023-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.example.com/cv</loc>
    <lastmod>2023-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

      await fs.writeFile('src/sitemap.xml', originalSitemap);

      // Execute actual processSitemap function
      await processSitemap();

      // Validate sitemap was processed
      expect(await testUtils.fileExistsWithContent('dist/sitemap.xml')).toBe(
        true,
      );

      // Read and validate updated content
      const updatedSitemap = await fs.readFile('dist/sitemap.xml', 'utf8');
      const dates = testUtils.extractSitemapDates(updatedSitemap);

      // All dates should be updated to today
      expect(dates).toHaveLength(2);
      dates.forEach((date) => {
        expect(testUtils.isToday(date)).toBe(true);
      });

      // Validate structure is preserved
      expect(updatedSitemap).toContain('<loc>https://www.example.com/</loc>');
      expect(updatedSitemap).toContain('<loc>https://www.example.com/cv</loc>');
      expect(updatedSitemap).toContain('<changefreq>monthly</changefreq>');
      expect(updatedSitemap).toContain('<priority>1.0</priority>');
    });

    test('should handle missing sitemap file gracefully', async () => {
      // Don't create the sitemap.xml file
      expect(await fs.pathExists('src/sitemap.xml')).toBe(false);

      // Execute actual processSitemap function
      await expect(processSitemap()).resolves.not.toThrow();

      // No sitemap should be created in dist
      expect(await fs.pathExists('dist/sitemap.xml')).toBe(false);
    });

    test('should handle sitemap with multiple lastmod entries', async () => {
      const sitemapWithMultipleDates = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.example.com/page1</loc>
    <lastmod>2022-12-01</lastmod>
  </url>
  <url>
    <loc>https://www.example.com/page2</loc>
    <lastmod>2023-06-15</lastmod>
  </url>
  <url>
    <loc>https://www.example.com/page3</loc>
    <lastmod>2023-11-30</lastmod>
  </url>
</urlset>`;

      await fs.writeFile('src/sitemap.xml', sitemapWithMultipleDates);

      // Execute actual processSitemap function
      await processSitemap();

      const updatedSitemap = await fs.readFile('dist/sitemap.xml', 'utf8');
      const dates = testUtils.extractSitemapDates(updatedSitemap);

      // All three dates should be updated to today
      expect(dates).toHaveLength(3);
      dates.forEach((date) => {
        expect(testUtils.isToday(date)).toBe(true);
      });
    });
  });
});
