const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'node_modules/mermaid/dist/chunks/mermaid.core/chunk-C3MQ5ANM.mjs');

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/import {.*marked.*} from 'marked'/g, 
    "import markedPkg from 'marked'; const marked = markedPkg.marked || markedPkg;");
  fs.writeFileSync(filePath, content);
  console.log('Patched mermaid to work with modern marked');
}

