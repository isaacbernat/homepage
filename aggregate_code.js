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
  'wip',
]);
const IGNORE_FILES = new Set([OUTPUT_FILE, 'package-lock.json', '.DS_Store']);
const INCLUDE_EXTENSIONS = new Set([
  '.md',
  '.js',
  '.json',
  '.html',
  '.css',
  '.xml',
  '.txt',
  '.njk',
  '.yml',
]);
// --- End of Configuration ---

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();

    if (IGNORE_DIRS.has(path.basename(dirPath))) {
      return; // Skip ignored directories
    }

    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function aggregateProjectFiles() {
  console.log(`Starting to aggregate files into '${OUTPUT_FILE}'...`);
  let aggregatedContent = [];

  const processFile = (filePath) => {
    const baseName = path.basename(filePath);
    if (IGNORE_FILES.has(baseName)) {
      return;
    }

    const extension = path.extname(baseName);
    if (!INCLUDE_EXTENSIONS.has(extension)) {
      return;
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
  };

  // Start the process by calling the generic walker with our specific file processor.
  walkDir(ROOT_DIR, processFile);

  fs.writeFileSync(OUTPUT_FILE, aggregatedContent.join('\n'));
  console.log(
    `\n✅ Aggregation complete. File '${OUTPUT_FILE}' has been created.`,
  );
}

aggregateProjectFiles();
