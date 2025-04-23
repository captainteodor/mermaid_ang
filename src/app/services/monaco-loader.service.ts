import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class MonacoLoaderService {
  private monacoPromise: Promise<any> | null = null;
  private isBrowser: boolean;

  // Monaco CDN URLs
  private readonly MONACO_CDN = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min';

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * Loads the Monaco editor from CDN
   * @returns A promise that resolves with the Monaco namespace
   */
  loadMonaco(): Promise<any> {
    if (!this.isBrowser) {
      return Promise.reject('Cannot load Monaco in server environment');
    }

    if (!this.monacoPromise) {
      this.monacoPromise = new Promise<any>((resolve, reject) => {
        const script: HTMLScriptElement = document.createElement('script');
        script.type = 'text/javascript';
        script.src = `${this.MONACO_CDN}/vs/loader.js`;
        script.onload = () => {
          const require = (window as any).require;

          require.config({
            paths: {
              vs: `${this.MONACO_CDN}/vs`
            }
          });

          require(['vs/editor/editor.main'], () => {
            resolve((window as any).monaco);
          });
        };
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
      });
    }

    return this.monacoPromise;
  }

  private registerMermaidLanguage(monaco: any): void {
    monaco.languages.register({ id: 'mermaid' });

    monaco.languages.setMonarchTokensProvider('mermaid', {
      defaultToken: '',
      tokenPostfix: '.mmd',

      keywords: [
        'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
        'erDiagram', 'gantt', 'pie', 'journey', 'gitGraph', 'C4Context'
      ],

      typeKeywords: [
        'participant', 'actor', 'class', 'interface', 'state', 'note', 'title'
      ],

      brackets: [
        { open: '{', close: '}', token: 'delimiter.curly' },
        { open: '[', close: ']', token: 'delimiter.square' },
        { open: '(', close: ')', token: 'delimiter.parenthesis' }
      ],

      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, {
            cases: {
              '@keywords': 'keyword',
              '@typeKeywords': 'type',
              '@default': 'identifier'
            }
          }],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/[{}()\[\]]/, '@brackets'],
          [/[<>](?!@brackets)/, 'operator'],
          [/[;,.]/, 'delimiter'],
          [/^---$/, 'separator'],
          [/[0-9]+/, 'number'],
          [/%%.*$/, 'comment'],
          [/\/\/.*$/, 'comment'],
          [/\s+/, 'white']
        ]
      }
    });
  }
}
