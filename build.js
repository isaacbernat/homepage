const fs = require('fs-extra');
const path = require('path');
const Terser = require('terser');
const CleanCSS = require('clean-css');
const { minify } = require('html-minifier');
const svgo = require('svgo');

// --- Configuration ---
const SRC_DIR = 'src';
const DIST_DIR = 'dist';
const JS_FILE = 'script.js';
const CSS_FILE = 'style.css';
const HTML_FILE = 'index.html';
const SVG_FAVICON = 'favicon.svg';

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

        // --- Copy Static Root Files ---
        console.log('Copying root static files...');
        const rootFilesToCopy = ['robots.txt', 'sitemap.xml']; // Add any other root files e.g.  'site.webmanifest', 'favicon.ico', 'apple-touch-icon.png', 
        for (const file of rootFilesToCopy) {
            const srcFile = path.join(SRC_DIR, file);
            const distFile = path.join(DIST_DIR, file);
            if (await fs.pathExists(srcFile)) {
                await fs.copy(srcFile, distFile);
                console.log(`Copied ${file} to ${DIST_DIR}.`);
            }
        }

        // --- Minify HTML and Update Links ---
        console.log('Processing HTML...');
        const htmlSrcPath = path.join(SRC_DIR, HTML_FILE);
        let htmlContent = await fs.readFile(htmlSrcPath, 'utf-8');
        
        // Replace links
        htmlContent = htmlContent.replace(new RegExp(JS_FILE, 'g'), JS_FILE.replace('.js', '.min.js'));
        htmlContent = htmlContent.replace(new RegExp(CSS_FILE, 'g'), CSS_FILE.replace('.css', '.min.css'));
        
        const minifiedHtml = minify(htmlContent, {
            removeAttributeQuotes: true,
            collapseWhitespace: true,
            removeComments: true,
            minifyCSS: true,
            minifyJS: true,
        });
        const htmlDistPath = path.join(DIST_DIR, HTML_FILE);
        await fs.writeFile(htmlDistPath, minifiedHtml, 'utf-8');

        console.log('\n--- Build Complete! ---');
        console.log(`Production-ready files are in the '${DIST_DIR}' directory.`);

    } catch (error) {
        console.error('ERROR: Build process failed.');
        console.error(error);
        process.exit(1);
    }
}

build();
