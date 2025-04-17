import { Component, ViewChild, ElementRef, OnInit, AfterViewInit, OnDestroy, inject, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DiagramStateService, ValidatedState } from '../../services/diagram-state.service';
import { UtilsService } from '../../services/utils.service';
import { MonacoLoaderService } from '../../services/monaco-loader.service';
import { Subscription } from 'rxjs';
import { NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    NgIf,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('editorContainer') editorContainer!: ElementRef;

  private diagramState = inject(DiagramStateService);
  private utils = inject(UtilsService);
  private monacoLoader = inject(MonacoLoaderService);

  private editor?: any;
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
              const monaco = (window as any).monaco;
              monaco?.editor.setModelLanguage(model, newLanguage);
            }
          }
        })
      );
    }
  }

  ngAfterViewInit(): void {
    // Skip Monaco initialization if not in browser
    if (!this.isBrowser) return;

    // Initialize Monaco editor
    this.initMonacoEditor();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();

    // Only dispose editor in browser environment
    if (this.editor && this.isBrowser) {
      this.editor.dispose();
    }
  }

  private async initMonacoEditor(): Promise<void> {
    try {
      // Load Monaco from CDN via the service
      const monaco = await this.monacoLoader.loadMonaco();

      // Log success message
      console.log('Monaco Editor loaded successfully from CDN');

      // Create editor with the loaded Monaco instance
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
    } catch (error) {
      console.error('Error initializing Monaco editor:', error);
    }
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
