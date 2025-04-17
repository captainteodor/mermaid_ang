// A more direct approach to fix Mermaid's marked dependency

// Import the official marked package
const markedPkg = require('marked');

// Handle different export structures in different versions of marked
const markedFn = markedPkg.marked || markedPkg.default || markedPkg;

// Create a proper module.exports with the 'marked' named export that Mermaid expects
module.exports = markedFn;
module.exports.marked = markedFn; // This is what Mermaid is looking for
module.exports.default = markedFn;

// Additional compatibility for ESM imports
Object.defineProperty(module.exports, '__esModule', { value: true });
