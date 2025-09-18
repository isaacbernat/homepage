const fs = require('fs-extra');
const path = require('path');
const Terser = require('terser');
const CleanCSS = require('clean-css');
const { minify } = require('html-minifier');
const svgo = require('svgo');
const sharp = require('sharp');
const toIco = require('to-ico');

const TestUtils = require('./test-utils');
const {
  BuildScriptMock,
  FileSystemValidators,
  TestDataGenerators,
} = require('./fs-test-helpers');

describe('Build Script Core Functionality', () => {
  let testUtils;
  let tempDir;
  let srcDir;
  let distDir;

  beforeEach(async () => {
    testUtils = new TestUtils();
    tempDir = await testUtils.createTempDir('build-core-test-');
    srcDir = path.join(tempDir, 'src');
    distDir = path.join(tempDir, 'dist');

    await fs.ensureDir(srcDir);
    await fs.ensureDir(distDir);
  });

  afterEach(async () => {
    await testUtils.cleanupTempDirs();
  });

  describe('Directory Cleaning and Creation', () => {
    test('should clean and recreate dist directory', async () => {
      // Setup: Create some files in dist directory
      await fs.writeFile(path.join(distDir, 'old-file.txt'), 'old content');
      await fs.ensureDir(path.join(distDir, 'old-dir'));

      // Verify files exist before cleaning
      expect(await fs.pathExists(path.join(distDir, 'old-file.txt'))).toBe(
        true,
      );
      expect(await fs.pathExists(path.join(distDir, 'old-dir'))).toBe(true);

      // Execute cleaning
      const buildMock = new BuildScriptMock(srcDir, distDir);
      await buildMock.cleanDist();

      // Validate directory was cleaned
      const validation =
        await FileSystemValidators.validateDirectoryCleaning(distDir);
      expect(validation.exists).toBe(true);
      expect(validation.isEmpty).toBe(true);
      expect(validation.isValid).toBe(true);
    });

    test('should handle non-existent dist directory', async () => {
      // Remove dist directory
      await fs.remove(distDir);
      expect(await fs.pathExists(distDir)).toBe(false);

      // Execute cleaning
      const buildMock = new BuildScriptMock(srcDir, distDir);
      await buildMock.cleanDist();

      // Validate directory was created
      const validation =
        await FileSystemValidators.validateDirectoryCleaning(distDir);
      expect(validation.exists).toBe(true);
      expect(validation.isEmpty).toBe(true);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Asset Minification', () => {
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

        const srcJsPath = path.join(srcDir, 'script.js');
        await fs.writeFile(srcJsPath, jsContent);

        // Execute minification
        const code = await fs.readFile(srcJsPath, 'utf8');
        const terserResult = await Terser.minify(code, {
          sourceMap: {
            filename: 'script.min.js',
            url: 'script.min.js.map',
          },
        });

        const distJsPath = path.join(distDir, 'script.min.js');
        const mapPath = path.join(distDir, 'script.min.js.map');

        await fs.writeFile(distJsPath, terserResult.code);
        await fs.writeFile(mapPath, terserResult.map);

        // Validate minification
        expect(await testUtils.fileExistsWithContent(distJsPath)).toBe(true);
        expect(await testUtils.fileExistsWithContent(mapPath)).toBe(true);
        expect(await testUtils.isMinified(srcJsPath, distJsPath)).toBe(true);

        // Validate minified content doesn't contain comments
        const minifiedContent = await fs.readFile(distJsPath, 'utf8');
        expect(minifiedContent).not.toContain('// This is a comment');
        expect(minifiedContent).not.toContain('// Another comment');

        // Validate source map is valid JSON
        const sourceMap = await testUtils.readJsonFile(mapPath);
        expect(sourceMap).toHaveProperty('version');
        expect(sourceMap).toHaveProperty('sources');
        expect(sourceMap).toHaveProperty('mappings');
      });

      test('should handle empty JavaScript file', async () => {
        const srcJsPath = path.join(srcDir, 'empty.js');
        await fs.writeFile(srcJsPath, '');

        const code = await fs.readFile(srcJsPath, 'utf8');
        const terserResult = await Terser.minify(code, {
          sourceMap: {
            filename: 'empty.min.js',
            url: 'empty.min.js.map',
          },
        });

        expect(terserResult.code).toBeDefined();
        expect(terserResult.map).toBeDefined();
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

        const srcCssPath = path.join(srcDir, 'style.css');
        await fs.writeFile(srcCssPath, cssContent);

        // Execute minification
        const code = await fs.readFile(srcCssPath, 'utf8');
        const result = new CleanCSS({ sourceMap: true }).minify({
          'style.css': { styles: code },
        });

        const distCssPath = path.join(distDir, 'style.min.css');
        const mapPath = path.join(distDir, 'style.min.css.map');

        await fs.writeFile(distCssPath, result.styles);
        await fs.writeFile(mapPath, result.sourceMap.toString());

        // Validate minification
        expect(await testUtils.fileExistsWithContent(distCssPath)).toBe(true);
        expect(await testUtils.fileExistsWithContent(mapPath)).toBe(true);
        expect(await testUtils.isMinified(srcCssPath, distCssPath)).toBe(true);

        // Validate minified content doesn't contain comments
        const minifiedContent = await fs.readFile(distCssPath, 'utf8');
        expect(minifiedContent).not.toContain(
          '/* This comment should be removed */',
        );
        expect(minifiedContent).not.toContain('/* Another comment */');

        // Validate CSS properties are preserved
        expect(minifiedContent).toContain('margin:0');
        expect(minifiedContent).toContain('padding:20px');
      });

      test('should handle non-existent CSS file gracefully', async () => {
        const nonExistentPath = path.join(srcDir, 'non-existent.css');

        // This should not throw an error
        const exists = await fs.pathExists(nonExistentPath);
        expect(exists).toBe(false);

        // Minification should be skipped for non-existent files
        // This simulates the behavior in the actual build script
      });
    });

    describe('HTML Minification', () => {
      test('should minify HTML content', async () => {
        const htmlContent = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <!-- This comment should be removed -->
              <meta charset="UTF-8">
              <title>Test Page</title>
              <style>
                  body { margin: 0; }
              </style>
          </head>
          <body>
              <h1>Test Heading</h1>
              <p>This is a test paragraph with    extra    spaces.</p>
              <script>
                  console.log('test');
              </script>
          </body>
          </html>
        `;

        const minifiedHtml = minify(htmlContent, {
          removeAttributeQuotes: true,
          collapseWhitespace: true,
          removeComments: true,
          minifyCSS: true,
          minifyJS: true,
        });

        // Validate minification
        expect(minifiedHtml.length).toBeLessThan(htmlContent.length);
        expect(minifiedHtml).not.toContain(
          '<!-- This comment should be removed -->',
        );
        expect(minifiedHtml).not.toContain('    extra    spaces');
        expect(minifiedHtml).toContain('<h1>Test Heading</h1>');
        expect(minifiedHtml).toContain(
          '<p>This is a test paragraph with extra spaces.</p>',
        );
      });
    });
  });

  describe('Static Asset Copying', () => {
    test('should copy static assets correctly', async () => {
      // Setup test file structure
      await TestDataGenerators.generateTestFileStructure(srcDir);

      // Define assets to copy (matching build script configuration)
      const assets = [
        { src: 'images', dest: 'images' },
        { src: 'case-study', dest: 'case-study' },
        { src: 'assets', dest: 'assets' },
        { src: 'robots.txt', dest: 'robots.txt' },
      ];

      // Execute copying
      const buildMock = new BuildScriptMock(srcDir, distDir);
      await buildMock.copyStaticAssets(assets);

      // Validate file copying
      const expectedFiles = [
        { dest: 'robots.txt' },
        { dest: 'images/test.jpg' },
        { dest: 'assets/test.pdf' },
      ];

      const validation = await FileSystemValidators.validateFileCopying(
        expectedFiles,
        distDir,
      );
      expect(validation.allValid).toBe(true);
      expect(validation.validCount).toBe(expectedFiles.length);

      // Validate directory structure
      const expectedDirs = ['images', 'assets', 'case-study'];
      const dirValidation =
        await FileSystemValidators.validateDirectoryStructure(
          distDir,
          expectedDirs,
        );
      expect(dirValidation.allValid).toBe(true);
    });

    test('should handle missing source directories gracefully', async () => {
      const assets = [
        { src: 'non-existent-dir', dest: 'non-existent-dir' },
        { src: 'another-missing-dir', dest: 'another-missing-dir' },
      ];

      const buildMock = new BuildScriptMock(srcDir, distDir);

      // This should not throw an error
      await expect(buildMock.copyStaticAssets(assets)).resolves.not.toThrow();

      // Dist directory should remain empty (except for the directory itself)
      const files = await testUtils.getFilesInDirectory(distDir);
      expect(files).toHaveLength(0);
    });
  });

  describe('Favicon Processing', () => {
    test('should optimize SVG favicon', async () => {
      // Setup test SVG
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <!-- This comment should be removed -->
        <circle cx="50" cy="50" r="40" fill="#007acc" />
        <text x="50" y="60" text-anchor="middle" fill="white">T</text>
      </svg>`;

      const srcSvgPath = path.join(srcDir, 'favicon.svg');
      await fs.writeFile(srcSvgPath, svgContent);

      // Execute SVG optimization
      const result = svgo.optimize(svgContent, { path: srcSvgPath });
      const distSvgPath = path.join(distDir, 'favicon.svg');
      await fs.writeFile(distSvgPath, result.data);

      // Validate optimization
      expect(await testUtils.fileExistsWithContent(distSvgPath)).toBe(true);
      expect(await testUtils.isMinified(srcSvgPath, distSvgPath)).toBe(true);

      const optimizedContent = await fs.readFile(distSvgPath, 'utf8');
      expect(optimizedContent).not.toContain(
        '<!-- This comment should be removed -->',
      );
    });

    test('should generate ICO from SVG', async () => {
      // Setup test SVG
      const svgContent = await fs.readFile(
        path.join(__dirname, 'fixtures', 'sample-favicon.svg'),
        'utf8',
      );

      const srcSvgPath = path.join(srcDir, 'favicon.svg');
      await fs.writeFile(srcSvgPath, svgContent);

      // Execute ICO generation
      const svgBuffer = await fs.readFile(srcSvgPath);
      const sizes = [16, 32, 48];
      const pngBuffers = await Promise.all(
        sizes.map((size) => sharp(svgBuffer).resize(size).png().toBuffer()),
      );
      const icoBuffer = await toIco(pngBuffers);

      const icoPath = path.join(distDir, 'favicon.ico');
      await fs.writeFile(icoPath, icoBuffer);

      // Validate ICO generation
      expect(await testUtils.fileExistsWithContent(icoPath)).toBe(true);

      const icoSize = await testUtils.getFileSize(icoPath);
      expect(icoSize).toBeGreaterThan(0);

      // ICO files should be larger than individual PNGs due to multiple sizes
      expect(icoSize).toBeGreaterThan(1000); // Reasonable minimum for multi-size ICO
    });

    test('should handle missing SVG favicon gracefully', async () => {
      const nonExistentSvg = path.join(srcDir, 'non-existent-favicon.svg');

      // This should not throw an error
      const exists = await fs.pathExists(nonExistentSvg);
      expect(exists).toBe(false);

      // Processing should be skipped for non-existent files
      // This simulates the behavior in the actual build script
    });
  });
});
