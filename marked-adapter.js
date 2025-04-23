// Import the actual marked package
const markedPkg = require('marked');

// Create a compatibility layer that provides the exports Mermaid expects
const markedFn = markedPkg.marked || markedPkg.default || markedPkg;

// Export both as default and as a named export to cover all bases
module.exports = markedFn;
module.exports.marked = markedFn;
module.exports.default = markedFn;

// Add __esModule flag for ES modules compatibility
Object.defineProperty(module.exports, '__esModule', { value: true });
