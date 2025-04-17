const fs = require('fs-extra');
const path = require('path');

// Source path of the Monaco Editor fonts
const sourcePath = path.resolve(__dirname, 'node_modules/monaco-editor/esm/vs/base/browser/ui/codicons/codicon');
// Destination path in your build output
const destPath = path.resolve(__dirname, 'dist/browser/assets/vs/base/browser/ui/codicons/codicon');

// Create the destination directory if it doesn't exist
fs.ensureDirSync(destPath);

// Copy the font files
fs.copySync(sourcePath, destPath);

console.log('Monaco Editor fonts copied successfully!');
