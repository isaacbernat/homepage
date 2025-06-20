const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const { minify } = require('html-minifier');

// --- Configuration ---
const SRC_DIR = 'src';
const DIST_DIR = 'dist';
const JS_FILE = 'script.js';
const CSS_FILE = 'style.css';
const HTML_FILE = 'index.html';

console.log('--- Starting Build Process ---');

async function build() {
    try {
        // --- 1. Clean and Create Destination Directory ---
        console.log(`Cleaning old '${DIST_DIR}' directory...`);
        await fs.emptyDir(DIST_DIR);
        console.log(`Created new '${DIST_DIR}' directory.`);

        // --- 2. Minify JavaScript with Terser ---
        const jsSrcPath = path.join(SRC_DIR, JS_FILE);
        const jsDistPath = path.join(DIST_DIR, JS_FILE.replace('.js', '.min.js'));
        const jsMapPath = `${jsDistPath}.map`;
        const terserCommand = `npx terser ${jsSrcPath} --compress --mangle --output ${jsDistPath} --source-map "url='${path.basename(jsMapPath)}'"`;
        console.log('Minifying JavaScript...');
        execSync(terserCommand);

        // --- 3. Minify CSS with clean-css-cli ---
        const cssSrcPath = path.join(SRC_DIR, CSS_FILE);
        const cssDistPath = path.join(DIST_DIR, CSS_FILE.replace('.css', '.min.css'));
        const cleanCssCommand = `npx cleancss --format breaksWith=lf --output ${cssDistPath} --source-map ${cssSrcPath}`;
        console.log('Minifying CSS...');
        execSync(cleanCssCommand);
        
        // --- 4. Copy from Images Directory ---
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

        // --- 5. Minify HTML and Update Links ---
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
