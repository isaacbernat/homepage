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
const CSS_FILES = ['style.css', 'cv-style.css'];
const SVG_FAVICON = 'favicon.svg';
const SITEMAP_FILE = 'sitemap.xml';
const ROOT_FILES_TO_COPY = ['robots.txt'];

// --- Helper Functions ---

async function cleanDist() {
    console.log(`Cleaning old '${DIST_DIR}' directory...`);
    await fs.emptyDir(DIST_DIR);
    console.log(`Created new '${DIST_DIR}' directory.`);
}

async function minifyJs() {
    console.log('Minifying JavaScript...');
    const srcPath = path.join(SRC_DIR, JS_FILE);
    const distPath = path.join(DIST_DIR, JS_FILE.replace('.js', '.min.js'));
    const mapPath = `${path.basename(distPath)}.map`;
    const code = await fs.readFile(srcPath, 'utf8');

    const terserResult = await Terser.minify(code, {
        sourceMap: {
            filename: path.basename(distPath),
            url: mapPath,
        },
    });

    await fs.writeFile(distPath, terserResult.code);
    await fs.writeFile(`${distPath}.map`, terserResult.map);
    console.log('JavaScript minified successfully.');
}

async function minifyCss(filename) {
    const srcPath = path.join(SRC_DIR, filename);
    if (!(await fs.pathExists(srcPath))) return;

    console.log(`Minifying ${filename}...`);
    const distPath = path.join(DIST_DIR, filename.replace('.css', '.min.css'));
    const code = await fs.readFile(srcPath, 'utf8');

    const result = new CleanCSS({ sourceMap: true }).minify({
        [filename]: { styles: code },
    });

    await fs.writeFile(distPath, result.styles);
    await fs.writeFile(`${distPath}.map`, result.sourceMap.toString());
    console.log(`${filename} minified successfully.`);
}

async function processFavicons() {
    console.log('Processing favicons...');
    const svgSrcPath = path.join(SRC_DIR, SVG_FAVICON);
    if (!(await fs.pathExists(svgSrcPath))) return;

    // Optimize SVG
    const svgCode = await fs.readFile(svgSrcPath, 'utf8');
    const result = svgo.optimize(svgCode, { path: svgSrcPath });
    await fs.writeFile(path.join(DIST_DIR, SVG_FAVICON), result.data);

    // Generate .ico from SVG
    const svgBuffer = await fs.readFile(svgSrcPath);
    const sizes = [16, 32, 48];
    const pngBuffers = await Promise.all(
        sizes.map((size) => sharp(svgBuffer).resize(size).png().toBuffer())
    );
    const icoBuffer = await toIco(pngBuffers);
    await fs.writeFile(path.join(DIST_DIR, 'favicon.ico'), icoBuffer);
    console.log('Favicons processed successfully.');
}

async function copyStaticAssets() {
    console.log('Copying static assets...');
    const assets = [
        { src: path.join(SRC_DIR, 'images'), dest: path.join(DIST_DIR, 'images') },
        { src: path.join(SRC_DIR, 'case-study'), dest: path.join(DIST_DIR, 'case-study') },
        { src: path.join(SRC_DIR, 'assets'), dest: path.join(DIST_DIR, 'assets') },
    ];

    for (const file of ROOT_FILES_TO_COPY) {
        assets.push({
            src: path.join(SRC_DIR, file),
            dest: path.join(DIST_DIR, file),
        });
    }

    await Promise.all(
        assets.map(async (asset) => {
            if (await fs.pathExists(asset.src)) {
                await fs.copy(asset.src, asset.dest);
            }
        })
    );
    console.log('Static assets copied.');
}

async function processSitemap() {
    console.log('Processing sitemap...');
    const srcPath = path.join(SRC_DIR, SITEMAP_FILE);
    const distPath = path.join(DIST_DIR, SITEMAP_FILE);
    if (!(await fs.pathExists(srcPath))) return;

    const formattedDate = new Date().toISOString().slice(0, 10);
    let sitemapContent = await fs.readFile(srcPath, 'utf8');
    sitemapContent = sitemapContent.replace(
        /<lastmod>.*<\/lastmod>/g,
        `<lastmod>${formattedDate}</lastmod>`
    );

    await fs.writeFile(distPath, sitemapContent, 'utf8');
    console.log(`Sitemap updated with date: ${formattedDate}`);
}

async function compileHtml() {
    const { marked } = await import('marked');
    console.log('Compiling HTML from Nunjucks templates...');

    const contentDir = path.join(SRC_DIR, 'content');
    const contentFiles = await fs.readdir(contentDir);
    const markdownContent = {};
    for (const file of contentFiles) {
        if (path.extname(file) === '.md') {
            const contentKey = path.basename(file, '.md');
            const markdown = await fs.readFile(path.join(contentDir, file), 'utf-8');
            markdownContent[contentKey] = marked.parse(markdown);
        }
    }

    nunjucks.configure(path.join(SRC_DIR), { autoescape: true });
    const siteData = {
        siteDescription: 'Portfolio of Isaac Bernat, Senior Software Engineer. Explore backend (Python, Go) case studies & system designs that drive measurable business impact.',
        siteUrl: 'https://www.isaacbernat.com/',
        content: markdownContent,
    };
    const pageData = {
        'index.njk': { title: 'Isaac Bernat | Senior Software Engineer' },
        '404.njk': { title: '404: Page Not Found @ IsaacBernat.com' },
        'cv.njk': { title: 'CV | Isaac Bernat', page_class: 'page-cv' },
    };

    const pagesDir = path.join(SRC_DIR, 'pages');
    const pageFiles = await fs.readdir(pagesDir);
    for (const pageFile of pageFiles) {
        if (path.extname(pageFile) !== '.njk') continue;

        const dataForPage = { ...siteData, ...(pageData[pageFile] || {}) };
        let renderedHtml = nunjucks.render(path.join('pages', pageFile), dataForPage);

        // Replace asset links with their specific minified versions.
        renderedHtml = renderedHtml.replace(new RegExp(JS_FILE, 'g'), JS_FILE.replace('.js', '.min.js'));
        CSS_FILES.forEach(cssFile => {
            renderedHtml = renderedHtml.replace(new RegExp(cssFile, 'g'), cssFile.replace('.css', '.min.css'));
        });

        const minifiedHtml = minify(renderedHtml, {
            removeAttributeQuotes: true,
            collapseWhitespace: true,
            removeComments: true,
            minifyCSS: true,
            minifyJS: true,
        });

        const outputFileName = pageFile.replace('.njk', '.html');
        await fs.writeFile(path.join(DIST_DIR, outputFileName), minifiedHtml, 'utf-8');
        console.log(`Successfully compiled and minified ${outputFileName}`);
    }
}

// --- Main Build Orchestrator ---

async function build() {
    console.log('--- Starting Build Process ---');
    try {
        await cleanDist();

        await Promise.all([
            minifyJs(),
            ...CSS_FILES.map(minifyCss),
            processFavicons(),
            copyStaticAssets(),
            processSitemap(),
        ]);

        await compileHtml();

        console.log('\n--- Build Complete! ---');
        console.log(`Production-ready files are in the '${DIST_DIR}' directory.`);
    } catch (error) {
        console.error('ERROR: Build process failed.');
        console.error(error);
        process.exit(1);
    }
}

build();
