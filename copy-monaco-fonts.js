const fs = require('fs-extra');
const path = require('path');

// Source directory (Monaco fonts in node_modules)
const fontsSource = path.join(__dirname, 'node_modules', 'monaco-editor', 'esm', 'vs', 'base', 'browser', 'ui', 'codicons', 'codicon');

// Target directory in the build output
const targetDir = path.join(__dirname, 'dist', 'browser', 'assets', 'vs', 'base', 'browser', 'ui', 'codicons', 'codicon');

// Ensure the target directory exists
fs.ensureDirSync(targetDir);

// Copy the font files (*.ttf)
try {
  fs.copySync(`${fontsSource}`, targetDir, {
    filter: (src) => {
      return src.endsWith('.ttf') || fs.lstatSync(src).isDirectory();
    },
    overwrite: true
  });
  console.log('Monaco Editor fonts copied successfully to', targetDir);
} catch (err) {
  console.error('Error copying Monaco fonts:', err);
}
