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
const SVG_FAVICON = 'favicon.svg';
const SITEMAP_FILE = 'sitemap.xml';


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

        // --- Minify CSS with clean-css-cli ---
        const cssSrcPath = path.join(SRC_DIR, CSS_FILE);
        const cssDistPath = path.join(DIST_DIR, CSS_FILE.replace('.css', '.min.css'));
        console.log('Minifying CSS...');
        const cssCode = await fs.readFile(cssSrcPath, 'utf8');
        const cleanCssResult = new CleanCSS({ sourceMap: true }).minify({ [CSS_FILE]: { styles: cssCode } });
        await fs.writeFile(cssDistPath, cleanCssResult.styles);
        await fs.writeFile(`${cssDistPath}.map`, cleanCssResult.sourceMap.toString());
        console.log('CSS minified successfully.');

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
            // Get today's date in YYYY-MM-DD format
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            
            let sitemapContent = await fs.readFile(sitemapSrcPath, 'utf8');
            
            // Use a regular expression to replace the content of all <lastmod> tags
            // The 'g' flag ensures all occurrences are replaced if you have multiple URLs
            sitemapContent = sitemapContent.replace(/<lastmod>.*<\/lastmod>/g, `<lastmod>${formattedDate}</lastmod>`);
            
            await fs.writeFile(sitemapDistPath, sitemapContent, 'utf8');
            console.log(`Sitemap processed with lastmod date: ${formattedDate}`);
        } else {
            console.log('Sitemap not found in src directory, skipping.');
        }

        // --- Copy Static Root Files ---
        console.log('Copying root static files...');
        const rootFilesToCopy = ['robots.txt']; // Add any other root files e.g.  'site.webmanifest', 'apple-touch-icon.png', 
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

        // --- Compile, Process, Minify HTML and update links from Nunjucks Templates ---
        console.log('Compiling Nunjucks templates to HTML...');

        nunjucks.configure(path.join(SRC_DIR), { autoescape: true });
        const pageData = {
            'index.njk': { title: 'Isaac Bernat | Senior Software Engineer' },
            '404.njk': { title: '404: Page Not Found @ IsaacBernat.com' }
        };
        const pagesDir = path.join(SRC_DIR, 'pages');
        const pageFiles = await fs.readdir(pagesDir);

        for (const pageFile of pageFiles) {
            if (path.extname(pageFile) !== '.njk') {
                continue;
            }
            const pageTemplatePath = path.join('pages', pageFile);
            let renderedHtml = nunjucks.render(pageTemplatePath, pageData[pageFile] || {});
            renderedHtml = renderedHtml.replace(new RegExp(CSS_FILE, 'g'), CSS_FILE.replace('.css', '.min.css'));
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
