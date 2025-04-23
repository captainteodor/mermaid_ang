import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { deflate, inflate } from 'pako';
import { toUint8Array, fromUint8Array, toBase64, fromBase64 } from 'js-base64';
import { DiagramState } from './diagram-state.service';

export type SerdeType = 'base64' | 'pako';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // Error handling methods
  findMostRelevantLineNumber(errorLineText: string, code: string): number {
    const codeLines = code.split('\n');
    let mostRelevantLineNumber = -1;
    let maxCommonLength = 0;

    for (const [i, line] of codeLines.entries()) {
      let commonLength = 0;
      for (let j = 0; j <= errorLineText.length; j++) {
        for (let k = j + 1; k <= errorLineText.length; k++) {
          const sub = errorLineText.slice(j, k);
          if (line.includes(sub)) {
            commonLength = Math.max(commonLength, sub.length);
          }
        }
      }
      if (commonLength > maxCommonLength) {
        maxCommonLength = commonLength;
        mostRelevantLineNumber = i + 1; // Line numbers start from 1
      }
    }
    return mostRelevantLineNumber;
  }

  replaceLineNumberInErrorMessage(errorMessage: string, realLineNumber: number): string {
    const regexParseError = /Parse error on line (\d+):/;
    const regexLexError = /Lexical error on line (\d+)/;
    return errorMessage
      .replace(regexParseError, `Parse error on line ${realLineNumber}:`)
      .replace(regexLexError, `Lexical error on line ${realLineNumber}:`);
  }

  extractErrorLineText(errorMessage: string): string {
    const regex = /Error: Parse error on line \d+:\n(.+)\n+/;
    const match = errorMessage.match(regex);
    if (match) {
      return match[1].slice(3);
    }

    const regexLex = /Error: Lexical error on line \d+. Unrecognized text.\n(.+)\n-+/;
    const matchLex = errorMessage.match(regexLex);
    return matchLex ? matchLex[1].slice(3) : '';
  }

  // State serialization methods
  private base64Serialize(state: string): string {
    return toBase64(state, true);
  }

  private base64Deserialize(state: string): string {
    return fromBase64(state);
  }

  private pakoSerialize(state: string): string {
    const data = new TextEncoder().encode(state);
    const compressed = deflate(data, { level: 9 });
    return fromUint8Array(compressed, true);
  }

  private pakoDeserialize(state: string): string {
    const data = toUint8Array(state);
    return inflate(data, { to: 'string' });
  }

  serializeState(state: DiagramState, serde: SerdeType = 'pako'): string {
    const json = JSON.stringify(state);
    let serialized: string;

    if (serde === 'base64') {
      serialized = this.base64Serialize(json);
    } else if (serde === 'pako') {
      serialized = this.pakoSerialize(json);
    } else {
      throw new Error(`Unknown serde type: ${serde}`);
    }

    return `${serde}:${serialized}`;
  }

  deserializeState(state: string): DiagramState {
    let type: SerdeType, serialized: string;

    if (state.includes(':')) {
      const parts = state.split(':');
      type = parts[0] as SerdeType;
      serialized = parts.slice(1).join(':');

      if (type !== 'base64' && type !== 'pako') {
        throw new Error(`Unknown serde type: ${type}`);
      }
    } else {
      type = 'base64';
      serialized = state;
    }

    let json: string;
    if (type === 'base64') {
      json = this.base64Deserialize(serialized);
    } else {
      json = this.pakoDeserialize(serialized);
    }

    return JSON.parse(json) as DiagramState;
  }

  // Clipboard utilities
  async copyToClipboard(text: string): Promise<void> {
    if (!this.isBrowser) {
      console.warn('Clipboard API is not available in server environment');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      this.fallbackCopyToClipboard(text);
    }
  }

  private fallbackCopyToClipboard(text: string): void {
    if (!this.isBrowser) {
      console.warn('DOM API is not available in server environment');
      return;
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Make the textarea out of viewport
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.append(textArea);

    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
    } catch (error) {
      console.error('Failed to copy:', error);
    } finally {
      textArea.remove();
    }
  }
}
