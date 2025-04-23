/**
 * Monaco Editor initialization for standalone components
 */

// Import Monaco editor
import * as monaco from 'monaco-editor';

// Define Monaco on the window for global access if needed
declare global {
  interface Window {
    monaco: typeof monaco;
  }
}
window.monaco = monaco;

// Export monaco for importing in components
export { monaco };
