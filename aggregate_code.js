const fs = require('fs');
const path = require('path');

// --- Configuration ---
const ROOT_DIR = '.';
const OUTPUT_FILE = 'aggregated_code.txt';
const IGNORE_DIRS = new Set([
    '.git',
    'node_modules',
    'dist',
    '__pycache__',
    '.vscode',
    'venv',
    'wip'
]);
const IGNORE_FILES = new Set([
    OUTPUT_FILE, // Ignore the script's own output
    'package-lock.json',
    '.DS_Store'
]);
const INCLUDE_EXTENSIONS = new Set([
    '.md', '.js', '.json', '.html', '.css', '.xml', '.txt', '.njk',
]);
// --- End of Configuration ---

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ?
            walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function aggregateProjectFiles() {
    console.log(`Starting to aggregate files into '${OUTPUT_FILE}'...`);
    let aggregatedContent = [];

    const processPath = (currentPath) => {  // Walk the directory recursively
        const baseName = path.basename(currentPath);
        if (IGNORE_DIRS.has(baseName)) {
            return;
        }

        const files = fs.readdirSync(currentPath);
        for (const file of files) {
            const filePath = path.join(currentPath, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                processPath(filePath);
            } else {
                if (IGNORE_FILES.has(file)) {
                    continue;
                }

                const extension = path.extname(file);
                if (!INCLUDE_EXTENSIONS.has(extension)) {
                    continue;
                }

                const relativePath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
                console.log(`  -> Processing: ${relativePath}`);
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const formattedBlock = `${relativePath.toUpperCase()}:\n"""\n${content}\n"""\n`;
                    aggregatedContent.push(formattedBlock);
                } catch (e) {
                    console.log(`    [!] Error reading ${filePath}: ${e.message}`);
                }
            }
        }
    };

    processPath(ROOT_DIR);
    fs.writeFileSync(OUTPUT_FILE, aggregatedContent.join('\n'));
    console.log(`\n✅ Aggregation complete. File '${OUTPUT_FILE}' has been created.`);
}

aggregateProjectFiles();
