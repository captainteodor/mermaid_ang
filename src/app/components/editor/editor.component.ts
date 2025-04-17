import { Component, ViewChild, ElementRef, OnInit, AfterViewInit, OnDestroy, inject, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { DiagramStateService, ValidatedState } from '../../services/diagram-state.service';
import { UtilsService } from '../../services/utils.service';
import { Subscription } from 'rxjs';

// Declare monaco as any to avoid type errors during SSR
declare const monaco: any;

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatButtonToggleModule, MatIconModule],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss'
})
export class EditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('editorContainer') editorContainer!: ElementRef;

  private diagramState = inject(DiagramStateService);
  private utils = inject(UtilsService);

  private editor?: any; // Change type to any
  private subscription = new Subscription();
  private currentText = '';
  editorMode: 'code' | 'config' = 'code';
  error: string | null = null;
  isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      // Configure Monaco worker
      (window as any).MonacoEnvironment = {
        getWorkerUrl: function(_moduleId: any, label: string) {
          if (label === 'json') {
            return './assets/monaco/json.worker.js';
          }
          if (label === 'css' || label === 'scss' || label === 'less') {
            return './assets/monaco/css.worker.js';
          }
          if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return './assets/monaco/html.worker.js';
          }
          if (label === 'typescript' || label === 'javascript') {
            return './assets/monaco/ts.worker.js';
          }
          return './assets/monaco/editor.worker.js';
        }
      };

      // Subscribe to state changes
      this.subscription.add(
        this.diagramState.state$.subscribe(state => {
          this.editorMode = state.editorMode || 'code';

          // Cast to ValidatedState to access the error property
          const validatedState = state as ValidatedState;
          if (validatedState.error) {
            this.error = validatedState.error.message;
          } else {
            this.error = null;
          }

          if (!this.editor) return;

          const newText = this.editorMode === 'code' ? state.code : state.mermaid;

          if (newText !== this.currentText) {
            this.editor.setValue(newText);
            this.currentText = newText;
          }

          // Handle language change
          const model = this.editor.getModel();
          if (model) {
            const currentLanguage = model.getLanguageId();
            const newLanguage = this.editorMode === 'code' ? 'mermaid' : 'json';

            if (currentLanguage !== newLanguage) {
              monaco.editor.setModelLanguage(model, newLanguage);
            }
          }
        })
      );
    }
  }

  ngAfterViewInit(): void {
    // Skip Monaco initialization if not in browser
    if (!this.isBrowser) return;

    // Dynamically import monaco editor only in browser
    import('monaco-editor').then(monaco => {
      this.initMonacoEditor(monaco);
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();

    // Only dispose editor in browser environment
    if (this.editor && this.isBrowser) {
      this.editor.dispose();
    }
  }

  private initMonacoEditor(monaco: any): void {
    // Safety check - should never happen but just in case
    if (!this.isBrowser) return;

    // Define the Mermaid language if it doesn't exist
    if (!monaco.languages.getLanguages().some((lang: any) => lang.id === 'mermaid')) {
      this.registerMermaidLanguage(monaco);
    }

    // Create editor
    this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
      value: this.currentText,
      language: 'mermaid',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: {
        enabled: false
      },
      scrollBeyondLastLine: false
    });

    // Listen for changes
    this.editor.onDidChangeModelContent(() => {
      const newText = this.editor?.getValue() || '';
      if (newText !== this.currentText) {
        this.currentText = newText;

        if (this.editorMode === 'code') {
          this.diagramState.updateCode(newText, { updateDiagram: true });
        } else {
          this.diagramState.updateConfig(newText);
        }
      }
    });

    // Get initial state
    const initialState = this.diagramState.currentState;
    this.currentText = this.editorMode === 'code' ? initialState.code : initialState.mermaid;
    this.editor.setValue(this.currentText);
  }

  private registerMermaidLanguage(monaco: any): void {
    // Safety check - should never happen but just in case
    if (!this.isBrowser) return;

    // This is a simplified version - would need to be expanded with proper syntax highlighting
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

  toggleEditorMode(): void {
    // No need for browser check here as this just updates state
    const newMode = this.editorMode === 'code' ? 'config' : 'code';
    this.diagramState.updateState({ editorMode: newMode });
  }

  openDocumentation(): void {
    // Skip if not in browser
    if (!this.isBrowser) return;

    const validatedState = this.diagramState.currentState as ValidatedState;
    const diagramType = validatedState.diagramType || 'flowchart';
    window.open(`https://mermaid.js.org/syntax/${diagramType}.html`, '_blank');
  }

  tryFixWithAI(): void {
    // Skip if not in browser
    if (!this.isBrowser) return;

    // In a real implementation, this could call an AI service to fix the code
    alert('AI Fix feature would be implemented here');
  }
}
