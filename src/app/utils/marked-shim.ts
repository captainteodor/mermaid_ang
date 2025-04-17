// This is a workaround for mermaid's usage of marked
import * as markedOriginal from 'marked';
export const marked = markedOriginal.marked || markedOriginal;
export default marked;
