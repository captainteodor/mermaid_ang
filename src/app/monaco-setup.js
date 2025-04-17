/**
 * This file initializes Monaco Editor
 * It's separated to avoid webpack conflicts
 */

// Import Monaco editor
import * as monaco from 'monaco-editor';

// Make Monaco globally available
// This is important for plugins and advanced features
window.monaco = monaco;

// Configure Monaco as needed
monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: false
});

// Optional: Set up themes, languages, etc.
monaco.editor.defineTheme('myCustomTheme', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#1e1e1e'
  }
});

// Export monaco for use in your components
export { monaco };
