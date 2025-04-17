const fs = require('fs-extra');
const path = require('path');

// Source directory (Monaco in node_modules)
const monacoSource = path.join(__dirname, 'node_modules', 'monaco-editor', 'min');

// Target directory in assets
const targetDir = path.join(__dirname, 'src', 'assets', 'monaco-editor', 'min');

// Ensure the target directory exists
fs.ensureDirSync(targetDir);

// Copy the Monaco editor files
fs.copySync(monacoSource, targetDir, { overwrite: true });

console.log('Monaco Editor assets copied successfully to', targetDir);
