// src/app/services/monaco-loader.service.ts
import { Injectable, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class MonacoLoaderService {
  private _monaco: any;
  private _initialized = false;

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Load Monaco editor instance
   */
  public async loadMonaco(): Promise<any> {
    if (!isPlatformBrowser(this.platformId)) {
      // Return a mock monaco object when in SSR
      return {
        editor: {
          create: () => {},
          defineTheme: () => {},
          setTheme: () => {},
          setModelLanguage: () => {}
        },
        languages: {
          register: () => {},
          setMonarchTokensProvider: () => {},
          registerCompletionItemProvider: () => {},
          setLanguageConfiguration: () => {},
          getLanguages: () => []
        }
      };
    }

    if (this._monaco) {
      return this._monaco;
    }

    try {
      // Load monaco editor outside Angular zone for better performance
      return await this.ngZone.runOutsideAngular(async () => {
        if (!this._initialized) {
          // Configure monaco environment
          this.configureMonacoEnvironment(); // Call it here

          // Import Monaco editor dynamically
          const monaco = await import('monaco-editor');
          this._monaco = monaco;
          this._initialized = true;

          // Register mermaid language (simplified version)
          this.registerMermaidLanguage(monaco);
        }

        return this._monaco;
      });
    } catch (error) {
      console.error('Error loading Monaco Editor:', error);
      throw error;
    }
  }

  /**
   * Register mermaid language for Monaco
   */
  private registerMermaidLanguage(monaco: any): void {
    if (!monaco.languages.getLanguages().some((lang: any) => lang.id === 'mermaid')) {
      monaco.languages.register({ id: 'mermaid' });

      monaco.languages.setMonarchTokensProvider('mermaid', {
        tokenizer: {
          root: [
            [/^\s*sequenceDiagram/, 'keyword'],
            [/^\s*classDiagram/, 'keyword'],
            [/^\s*classDiagram-v2/, 'keyword'],
            [/^\s*flowchart/, 'keyword'],
            [/^\s*graph/, 'keyword'],
            [/^\s*stateDiagram/, 'keyword'],
            [/^\s*stateDiagram-v2/, 'keyword'],
            [/^\s*erDiagram/, 'keyword'],
            [/^\s*gantt/, 'keyword'],
            [/^\s*pie/, 'keyword'],
            [/^\s*journey/, 'keyword'],
            [/^\s*gitGraph/, 'keyword'],
            [/-{2,}>/, 'string'],
            [/==>/, 'string'],
            [/[{}[\]()]/, 'delimiter.bracket'],
            [/[A-Za-z][\w$]*/, 'identifier'],
            [/".*?"/, 'string'],
            [/%%.*$/, 'comment']
          ]
        }
      });

      monaco.editor.defineTheme('mermaid-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
          { token: 'string', foreground: 'ce9178' },
          { token: 'identifier', foreground: '9cdcfe' },
          { token: 'comment', foreground: '6a9955' }
        ],
        colors: {}
      });

      monaco.editor.setTheme('mermaid-dark');
    }
  }

  private configureMonacoEnvironment() {
    window.MonacoEnvironment = {
      getWorkerUrl: function() {
        return './assets/monaco-editor-worker-loader.js';
      },
      globalAPI: true
    };
  }
}
