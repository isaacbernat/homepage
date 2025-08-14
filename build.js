const fs = require('fs-extra');
const path = require('path');
const Terser = require('terser');
const CleanCSS = require('clean-css');
const { minify } = require('html-minifier');
const svgo = require('svgo');
const sharp = require('sharp');
const toIco = require('to-ico');
const nunjucks = require('nunjucks');

// --- Configuration ---
const SRC_DIR = 'src';
const DIST_DIR = 'dist';
const JS_FILE = 'script.js';
const CSS_FILE = 'style.css';
const CV_CSS_FILE = 'cv-style.css';
const CSS_FILES_TO_MINIFY = [CSS_FILE, CV_CSS_FILE];
const SVG_FAVICON = 'favicon.svg';
const SITEMAP_FILE = 'sitemap.xml';


async function minifyCss(filename) {
    const srcPath = path.join(SRC_DIR, filename);
    if (!await fs.pathExists(srcPath)) return;

    console.log(`Minifying ${filename}...`);
    const distPath = path.join(DIST_DIR, filename.replace('.css', '.min.css'));
    const mapPath = `${path.basename(distPath)}.map`;
    const code = await fs.readFile(srcPath, 'utf8');

    // Minify with source map generation
    const result = new CleanCSS({ sourceMap: true }).minify({
        [filename]: { styles: code }
    });

    await fs.writeFile(distPath, result.styles);
    await fs.writeFile(`${distPath}.map`, result.sourceMap.toString());
    console.log(`${filename} minified successfully.`);
}


async function generateIcoFromSvg(srcPath, distPath) {
    if (!await fs.pathExists(srcPath)) return;

    console.log('Generating favicon.ico from SVG...');
    const svgBuffer = await fs.readFile(srcPath);

    // Create PNG buffers of standard ICO sizes
    const sizes = [16, 32, 48];
    const pngBuffers = await Promise.all(
        sizes.map(size =>
            sharp(svgBuffer)
                .resize(size)
                .png()
                .toBuffer()
        )
    );

    // Bundle the PNGs into a single .ico file
    const icoBuffer = await toIco(pngBuffers);
    await fs.writeFile(distPath, icoBuffer);
    console.log('favicon.ico generated successfully.');
}


console.log('--- Starting Build Process ---');

async function build() {
    // The 'marked' library's package configuration (in this version and newer)
    // resolves `require('marked')` to an ES Module (ESM) file, which is not
    // supported in a CommonJS file like `build.js`. To resolve this, we must use
    // a dynamic `await import()`, which correctly handles ESM packages.
    const { marked } = await import('marked');  // 'marked' is a pure ES Module (ESM) and cannot be imported with require()

    try {
        // --- Clean and Create Destination Directory ---
        console.log(`Cleaning old '${DIST_DIR}' directory...`);
        await fs.emptyDir(DIST_DIR);
        console.log(`Created new '${DIST_DIR}' directory.`);

        // --- Minify JavaScript with Terser ---
        const jsSrcPath = path.join(SRC_DIR, JS_FILE);
        const jsDistPath = path.join(DIST_DIR, JS_FILE.replace('.js', '.min.js'));
        const jsMapPath = `${path.basename(jsDistPath)}.map`;
        console.log('Minifying JavaScript...');
        const jsCode = await fs.readFile(jsSrcPath, 'utf8');
        const terserResult = await Terser.minify(jsCode, {
            sourceMap: {
                filename: path.basename(jsDistPath),
                url: jsMapPath
            }
        });
        await fs.writeFile(jsDistPath, terserResult.code);
        await fs.writeFile(`${jsDistPath}.map`, terserResult.map);
        console.log('JavaScript minified successfully.');

        await Promise.all(CSS_FILES_TO_MINIFY.map(minifyCss));

        // --- Optimize SVG Favicon with SVGO ---
        const svgSrcPath = path.join(SRC_DIR, SVG_FAVICON);
        const svgDistPath = path.join(DIST_DIR, SVG_FAVICON);
        if (await fs.pathExists(svgSrcPath)) {
            console.log('Optimizing SVG favicon...');
            const svgCode = await fs.readFile(svgSrcPath, 'utf8');
            const result = svgo.optimize(svgCode, {
                path: svgSrcPath,
            });
            await fs.writeFile(svgDistPath, result.data);
            console.log('SVG favicon optimized successfully.');
        }
        // --- Generate Fallback Favicon ---
        const icoDistPath = path.join(DIST_DIR, 'favicon.ico');
        await generateIcoFromSvg(svgSrcPath, icoDistPath);

        // --- Copy from Images Directory ---
        const srcImages = path.join(SRC_DIR, 'images');
        const distImages = path.join(DIST_DIR, 'images');
        if (await fs.pathExists(srcImages)) {
            console.log("Copying optimized '.webp' images...");
            const filterWebP = (src, dest) => {
                if (fs.statSync(src).isDirectory()) return true;
                return path.extname(src).toLowerCase() === '.webp';
            };
            await fs.copy(srcImages, distImages, { filter: filterWebP });
        }

        // --- Process Sitemap and update lastmod date
        console.log('Processing sitemap...');
        const sitemapSrcPath = path.join(SRC_DIR, SITEMAP_FILE);
        const sitemapDistPath = path.join(DIST_DIR, SITEMAP_FILE);

        if (await fs.pathExists(sitemapSrcPath)) {
            const formattedDate = new Date().toISOString().slice(0, 10);
            let sitemapContent = await fs.readFile(sitemapSrcPath, 'utf8');
            
            // Use a regular expression to replace the content of all <lastmod> tags
            // The 'g' flag ensures all occurrences are replaced if you have multiple URLs
            sitemapContent = sitemapContent.replace(/<lastmod>.*<\/lastmod>/g, `<lastmod>${formattedDate}</lastmod>`);
            
            await fs.writeFile(sitemapDistPath, sitemapContent, 'utf8');
            console.log(`Sitemap processed with lastmod date: ${formattedDate}`);
        } else {
            console.log('Sitemap not found in src directory, skipping.');
        }

        // --- Copy Static Files ---
        console.log('Copying root static files...');
        const rootFilesToCopy = ['robots.txt'];
        await Promise.all(
            rootFilesToCopy.map(async (file) => {
                const srcFile = path.join(SRC_DIR, file);
                const distFile = path.join(DIST_DIR, file);
                if (await fs.pathExists(srcFile)) {
                    await fs.copy(srcFile, distFile);
                    console.log(`Copied ${file} to ${DIST_DIR}.`);
                }
            })
        );
        const srcAssets = path.join(SRC_DIR, 'assets');
        const distAssets = path.join(DIST_DIR, 'assets');
        if (await fs.pathExists(srcAssets)) {
            console.log("Copying 'assets' directory...");
            await fs.copy(srcAssets, distAssets);
        }

        // --- Compile, Process, Minify HTML and update links from Nunjucks Templates ---
        console.log('Compiling Nunjucks templates to HTML...');

        const contentDir = path.join(SRC_DIR, 'content');
        const contentFiles = await fs.readdir(contentDir);
        const markdownContent = {};

        for (const file of contentFiles) {
            if (path.extname(file) === '.md') {
                const filePath = path.join(contentDir, file);
                const contentKey = path.basename(file, '.md');
                const markdown = await fs.readFile(filePath, 'utf-8');
                markdownContent[contentKey] = marked.parse(markdown);
            }
        }
        console.log(`Processed ${Object.keys(markdownContent).length} Markdown files.`);

        nunjucks.configure(path.join(SRC_DIR), { autoescape: true });
        const siteData = {
            siteDescription: 'Isaac Bernat, Senior Software Engineer. Find my CV, projects and presentations here.',
            siteUrl: 'https://www.isaacbernat.com/',
            content: markdownContent
        };

        const pageData = {
            'index.njk': { title: 'Isaac Bernat | Senior Software Engineer' },
            '404.njk': { title: '404: Page Not Found @ IsaacBernat.com' },
            'cv.njk': { title: 'CV | Isaac Bernat', page_class: 'page-cv' }
        };
        const pagesDir = path.join(SRC_DIR, 'pages');
        const pageFiles = await fs.readdir(pagesDir);

        for (const pageFile of pageFiles) {
            if (path.extname(pageFile) !== '.njk') continue;

            const pageTemplatePath = path.join('pages', pageFile);
            const dataForPage = {
                ...siteData,
                ...(pageData[pageFile] || {}) // Page-specific data comes second and can override globals if needed
            };

            let renderedHtml = nunjucks.render(pageTemplatePath, dataForPage);
            renderedHtml = renderedHtml.replace(new RegExp(CSS_FILE, 'g'), CSS_FILE.replace('.css', '.min.css'));
            renderedHtml = renderedHtml.replace(new RegExp(CV_CSS_FILE, 'g'), CV_CSS_FILE.replace('.css', '.min.css'));
            renderedHtml = renderedHtml.replace(new RegExp(JS_FILE, 'g'), JS_FILE.replace('.js', '.min.js'));

            const minifiedHtml = minify(renderedHtml, {
                removeAttributeQuotes: true,
                collapseWhitespace: true,
                removeComments: true,
                minifyCSS: true,
                minifyJS: true,
            });

            const outputFileName = pageFile.replace('.njk', '.html');
            const outputPath = path.join(DIST_DIR, outputFileName);
            await fs.writeFile(outputPath, minifiedHtml, 'utf-8');
            console.log(`Successfully compiled and minified ${pageFile} to ${outputFileName}`);
        }

        console.log('\n--- Build Complete! ---');
        console.log(`Production-ready files are in the '${DIST_DIR}' directory.`);

    } catch (error) {
        console.error('ERROR: Build process failed.');
        console.error(error);
        process.exit(1);
    }
}

build();
