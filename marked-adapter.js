// Import the actual marked package
const markedPkg = require('marked');

// Create a compatibility layer to handle the different export structure
module.exports = markedPkg;
module.exports.marked = markedPkg.marked || markedPkg.default || markedPkg;
module.exports.default = markedPkg;

// ES Module compatibility
Object.defineProperty(module.exports, '__esModule', { value: true });
