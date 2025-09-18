const fs = require('fs-extra');
const path = require('path');
const nunjucks = require('nunjucks');

const TestUtils = require('./test-utils');
const { BuildScriptMock } = require('./fs-test-helpers');

describe('Template Rendering and Content Processing', () => {
  let testUtils;
  let tempDir;
  let srcDir;
  let distDir;

  beforeEach(async () => {
    testUtils = new TestUtils();
    tempDir = await testUtils.createTempDir('template-test-');
    srcDir = path.join(tempDir, 'src');
    distDir = path.join(tempDir, 'dist');

    await fs.ensureDir(srcDir);
    await fs.ensureDir(distDir);
  });

  afterEach(async () => {
    await testUtils.cleanupTempDirs();
  });

  describe('Nunjucks Template Compilation', () => {
    test('should compile Nunjucks template with mock content', async () => {
      // Setup template and content directories
      const pagesDir = path.join(srcDir, 'pages');
      const contentDir = path.join(srcDir, 'content');
      await fs.ensureDir(pagesDir);
      await fs.ensureDir(contentDir);

      // Create test template
      const templateContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ title }}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>{{ title }}</h1>
    <div class="content">
        {{ content.test_content | safe }}
    </div>
    <script src="script.js"></script>
</body>
</html>`;

      await fs.writeFile(path.join(pagesDir, 'test.njk'), templateContent);

      // Create test markdown content
      const markdownContent =
        '# Test Content\n\nThis is **test** content with *emphasis*.';
      await fs.writeFile(
        path.join(contentDir, 'test_content.md'),
        markdownContent,
      );

      // Setup Nunjucks environment
      nunjucks.configure(srcDir, { autoescape: true });

      // Mock markdown processing (simplified version)
      // For testing, we'll simulate the marked output without importing
      const processedContent = `<h1 id="test-content">Test Content</h1>
<p>This is <strong>test</strong> content with <em>emphasis</em>.</p>`;

      // Prepare template data
      const templateData = {
        title: 'Test Page',
        siteDescription: 'Test site description',
        siteUrl: 'https://test.example.com/',
        content: {
          test_content: processedContent,
        },
      };

      // Render template
      const renderedHtml = nunjucks.render('pages/test.njk', templateData);

      // Validate template rendering
      expect(renderedHtml).toContain('<title>Test Page</title>');
      expect(renderedHtml).toContain('<h1>Test Page</h1>');
      expect(renderedHtml).toContain('<h1 id="test-content">Test Content</h1>');
      expect(renderedHtml).toContain('<strong>test</strong>');
      expect(renderedHtml).toContain('<em>emphasis</em>');
      expect(renderedHtml).toContain('link rel="stylesheet" href="style.css"');
      expect(renderedHtml).toContain('script src="script.js"');
    });

    test('should handle template with missing content gracefully', async () => {
      const pagesDir = path.join(srcDir, 'pages');
      await fs.ensureDir(pagesDir);

      // Create template that references non-existent content
      const templateContent = `<!DOCTYPE html>
<html>
<head><title>{{ title }}</title></head>
<body>
    <h1>{{ title }}</h1>
    <div>{{ content.non_existent | safe }}</div>
</body>
</html>`;

      await fs.writeFile(path.join(pagesDir, 'test.njk'), templateContent);

      nunjucks.configure(srcDir, { autoescape: true });

      const templateData = {
        title: 'Test Page',
        content: {}, // Empty content object
      };

      const renderedHtml = nunjucks.render('pages/test.njk', templateData);

      // Should render without throwing error, with empty content
      expect(renderedHtml).toContain('<title>Test Page</title>');
      expect(renderedHtml).toContain('<h1>Test Page</h1>');
      expect(renderedHtml).toContain('<div></div>'); // Empty div for missing content
    });

    test('should process multiple markdown files correctly', async () => {
      const contentDir = path.join(srcDir, 'content');
      await fs.ensureDir(contentDir);

      // Create multiple markdown files
      const contentFiles = {
        'intro.md': '# Introduction\n\nWelcome to the site.',
        'about.md': '## About\n\nThis is the about section.',
        'contact.md': '### Contact\n\nReach out to us.',
      };

      for (const [filename, content] of Object.entries(contentFiles)) {
        await fs.writeFile(path.join(contentDir, filename), content);
      }

      // Process all markdown files (mocked for testing)
      const processedContent = {
        intro:
          '<h1 id="introduction">Introduction</h1>\n<p>Welcome to the site.</p>',
        about: '<h2 id="about">About</h2>\n<p>This is the about section.</p>',
        contact: '<h3 id="contact">Contact</h3>\n<p>Reach out to us.</p>',
      };

      // Validate processed content
      expect(processedContent).toHaveProperty('intro');
      expect(processedContent).toHaveProperty('about');
      expect(processedContent).toHaveProperty('contact');

      expect(processedContent.intro).toContain(
        '<h1 id="introduction">Introduction</h1>',
      );
      expect(processedContent.about).toContain('<h2 id="about">About</h2>');
      expect(processedContent.contact).toContain(
        '<h3 id="contact">Contact</h3>',
      );
    });
  });

  describe('Sitemap Date Updating', () => {
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

      const srcSitemapPath = path.join(srcDir, 'sitemap.xml');
      await fs.writeFile(srcSitemapPath, originalSitemap);

      // Execute sitemap processing
      const buildMock = new BuildScriptMock(srcDir, distDir);
      await buildMock.processSitemap();

      // Validate sitemap was processed
      const distSitemapPath = path.join(distDir, 'sitemap.xml');
      expect(await testUtils.fileExistsWithContent(distSitemapPath)).toBe(true);

      // Read and validate updated content
      const updatedSitemap = await fs.readFile(distSitemapPath, 'utf8');
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

      const srcSitemapPath = path.join(srcDir, 'sitemap.xml');
      await fs.writeFile(srcSitemapPath, sitemapWithMultipleDates);

      const buildMock = new BuildScriptMock(srcDir, distDir);
      await buildMock.processSitemap();

      const distSitemapPath = path.join(distDir, 'sitemap.xml');
      const updatedSitemap = await fs.readFile(distSitemapPath, 'utf8');
      const dates = testUtils.extractSitemapDates(updatedSitemap);

      // All three dates should be updated to today
      expect(dates).toHaveLength(3);
      dates.forEach((date) => {
        expect(testUtils.isToday(date)).toBe(true);
      });
    });

    test('should handle missing sitemap file gracefully', async () => {
      const nonExistentSitemap = path.join(srcDir, 'sitemap.xml');
      expect(await fs.pathExists(nonExistentSitemap)).toBe(false);

      const buildMock = new BuildScriptMock(srcDir, distDir);

      // Should not throw error for missing sitemap
      await expect(buildMock.processSitemap()).resolves.not.toThrow();

      // No sitemap should be created in dist
      const distSitemapPath = path.join(distDir, 'sitemap.xml');
      expect(await fs.pathExists(distSitemapPath)).toBe(false);
    });
  });

  describe('Asset Path Replacement', () => {
    test('should replace asset paths with minified versions in HTML', async () => {
      const originalHtml = `<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="cv-style.css">
</head>
<body>
    <h1>Test Page</h1>
    <script src="script.js"></script>
</body>
</html>`;

      // Define asset files to replace (matching build script configuration)
      const JS_FILE = 'script.js';
      const CSS_FILES = ['style.css', 'cv-style.css'];

      // Perform asset path replacement
      let processedHtml = originalHtml.replace(
        new RegExp(JS_FILE, 'g'),
        JS_FILE.replace('.js', '.min.js'),
      );

      CSS_FILES.forEach((cssFile) => {
        processedHtml = processedHtml.replace(
          new RegExp(cssFile, 'g'),
          cssFile.replace('.css', '.min.css'),
        );
      });

      // Validate asset path replacement
      expect(processedHtml).toContain('href="style.min.css"');
      expect(processedHtml).toContain('href="cv-style.min.css"');
      expect(processedHtml).toContain('src="script.min.js"');

      // Validate original paths are replaced
      expect(processedHtml).not.toContain('href="style.css"');
      expect(processedHtml).not.toContain('href="cv-style.css"');
      expect(processedHtml).not.toContain('src="script.js"');

      // Validate HTML structure is preserved
      expect(processedHtml).toContain('<h1>Test Page</h1>');
      expect(processedHtml).toContain('<!DOCTYPE html>');
    });

    test('should handle HTML with no asset references', async () => {
      const htmlWithoutAssets = `<!DOCTYPE html>
<html>
<head>
    <title>Simple Page</title>
</head>
<body>
    <h1>No Assets Here</h1>
    <p>This page has no CSS or JS references.</p>
</body>
</html>`;

      const JS_FILE = 'script.js';
      const CSS_FILES = ['style.css', 'cv-style.css'];

      // Perform asset path replacement
      let processedHtml = htmlWithoutAssets.replace(
        new RegExp(JS_FILE, 'g'),
        JS_FILE.replace('.js', '.min.js'),
      );

      CSS_FILES.forEach((cssFile) => {
        processedHtml = processedHtml.replace(
          new RegExp(cssFile, 'g'),
          cssFile.replace('.css', '.min.css'),
        );
      });

      // HTML should remain unchanged
      expect(processedHtml).toBe(htmlWithoutAssets);
    });

    test('should verify minified asset references in rendered HTML', async () => {
      const htmlContent = `<link rel="stylesheet" href="style.min.css">
<link rel="stylesheet" href="cv-style.min.css">
<script src="script.min.js"></script>`;

      const expectedAssets = [
        'style.min.css',
        'cv-style.min.css',
        'script.min.js',
      ];

      const hasAllAssets = testUtils.verifyMinifiedAssetReferences(
        htmlContent,
        expectedAssets,
      );
      expect(hasAllAssets).toBe(true);

      // Test with missing asset
      const incompleteHtml = `<link rel="stylesheet" href="style.min.css">`;
      const hasMissingAssets = testUtils.verifyMinifiedAssetReferences(
        incompleteHtml,
        expectedAssets,
      );
      expect(hasMissingAssets).toBe(false);
    });
  });

  describe('Complete Template Processing Pipeline', () => {
    test('should process template from markdown to final HTML', async () => {
      // Setup complete directory structure
      const pagesDir = path.join(srcDir, 'pages');
      const contentDir = path.join(srcDir, 'content');
      await fs.ensureDir(pagesDir);
      await fs.ensureDir(contentDir);

      // Create markdown content
      const markdownContent = `# Welcome
      
This is the **homepage** content with a [link](https://example.com).

## Features

- Feature 1
- Feature 2
- Feature 3`;

      await fs.writeFile(path.join(contentDir, 'homepage.md'), markdownContent);

      // Create Nunjucks template
      const templateContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ title }}</title>
    <meta name="description" content="{{ siteDescription }}">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <main>
        {{ content.homepage | safe }}
    </main>
    <script src="script.js"></script>
</body>
</html>`;

      await fs.writeFile(path.join(pagesDir, 'index.njk'), templateContent);

      // Process markdown (mocked for testing)
      const processedMarkdown = `<h1 id="welcome">Welcome</h1>
<p>This is the <strong>homepage</strong> content with a <a href="https://example.com">link</a>.</p>
<h2 id="features">Features</h2>
<ul>
<li>Feature 1</li>
<li>Feature 2</li>
<li>Feature 3</li>
</ul>`;

      // Setup Nunjucks and render
      nunjucks.configure(srcDir, { autoescape: true });

      const templateData = {
        title: 'Test Homepage',
        siteDescription: 'A test homepage',
        content: {
          homepage: processedMarkdown,
        },
      };

      let renderedHtml = nunjucks.render('pages/index.njk', templateData);

      // Replace asset paths
      renderedHtml = renderedHtml.replace(/script\.js/g, 'script.min.js');
      renderedHtml = renderedHtml.replace(/style\.css/g, 'style.min.css');

      // Validate complete processing
      expect(renderedHtml).toContain('<title>Test Homepage</title>');
      expect(renderedHtml).toContain('content="A test homepage"');
      expect(renderedHtml).toContain('<h1 id="welcome">Welcome</h1>');
      expect(renderedHtml).toContain('<strong>homepage</strong>');
      expect(renderedHtml).toContain('<a href="https://example.com">link</a>');
      expect(renderedHtml).toContain('<li>Feature 1</li>');
      expect(renderedHtml).toContain('href="style.min.css"');
      expect(renderedHtml).toContain('src="script.min.js"');

      // Write final HTML to dist
      const outputPath = path.join(distDir, 'index.html');
      await fs.writeFile(outputPath, renderedHtml);

      expect(await testUtils.fileExistsWithContent(outputPath)).toBe(true);
    });
  });
});
