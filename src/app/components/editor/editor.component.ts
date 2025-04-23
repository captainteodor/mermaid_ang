import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import {
  CommonModule,
  isPlatformBrowser,
} from '@angular/common';
import { Subscription } from 'rxjs';

import {
  DiagramStateService,
  ValidatedState,
} from '../../services/diagram-state.service';
import { MonacoLoaderService } from '../../services/monaco-loader.service';

import type * as monaco from 'monaco-editor';

@Component({
    selector: 'app-editor',
    templateUrl: './editor.component.html',
    styleUrls: ['./editor.component.scss'],
    imports: [
        CommonModule,
    ]
})
export class EditorComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  /* ───────────────────────── template refs ─────────────────────────── */
  @ViewChild('editorContainer', { static: true })
  private editorContainer!: ElementRef<HTMLDivElement>;

  /* ───────────────────────── injected services ─────────────────────── */
  private readonly diagramState = inject(DiagramStateService);
  private readonly monacoLoader = inject(MonacoLoaderService);
  private readonly isBrowser = isPlatformBrowser(
    inject(PLATFORM_ID) as Object
  );

  /* ───────────────────────── component state ───────────────────────── */
  editorMode: 'code' | 'config' = 'code';
  error: string | null = null;
  mermaidVersion = '11.6.0';
  isWordWrapEnabled = true;

  /** live caret position displayed in the footer */
  cursorPosition = { lineNumber: 1, column: 1 };

  private subs = new Subscription();
  private monaco!: typeof monaco;
  private editor!: monaco.editor.IStandaloneCodeEditor;
  private currentText = '';

  /* =================================================================== */
  /*  LIFECYCLE                                                         */
  /* =================================================================== */

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.subs.add(
      this.diagramState.state$.subscribe((state) =>
        this.updateFromState(state)
      )
    );
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) this.bootstrapMonaco();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.editor?.dispose();
  }

  /* =================================================================== */
  /*  PUBLIC API ­– hooks for the template                               */
  /* =================================================================== */

  onTabChange(mode: 'code' | 'config'): void {
    this.diagramState.updateState({ editorMode: mode });
  }

  dismissError(): void {
    this.error = null;
  }

  tryFixWithAI(): void {
    // stub – hook for future AI integration
    alert('AI fix coming soon 🚀');
  }

  formatCode(): void {
    this.editor?.getAction('editor.action.formatDocument')?.run();
  }

  clearEditor(): void {
    this.editor?.setValue('');
  }

  copyToClipboard(): void {
    const text = this.editor?.getValue() ?? '';
    navigator.clipboard.writeText(text).catch(console.error);
  }

  toggleWordWrap(): void {
    if (!this.isBrowser || !this.editor) return;
    this.isWordWrapEnabled = !this.isWordWrapEnabled;
    this.editor.updateOptions({ wordWrap: this.isWordWrapEnabled ? 'on' : 'off' });
  }

  /**
   * Updates the diagram with the current editor content
   */
  updateDiagram(): void {
    if (!this.editor) return;

    const code = this.editor.getValue();
    this.diagramState.updateCode(code, {
      updateDiagram: true,
      resetPanZoom: true
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Docs + example snippets                                           */
  /* ------------------------------------------------------------------ */
  /** Open the Mermaid syntax page for the currently-detected diagram */
  openDocumentation(): void {
    const state: any = this.diagramState.currentState;
    const type = state?.diagramType ?? 'flowchart';
    window.open(`https://mermaid.js.org/syntax/${type}.html`, '_blank');
  }

  /** Replace the editor text with an example template */
  loadExample(kind: string): void {
    const examples: Record<string, string> = {
      flowchart: `graph TD
  A[Start] --> B{Is it?}
  B -- Yes --> C[OK]
  C --> D[Rethink]
  D --> B
  B -- No --> E[End]`,
      sequence: `sequenceDiagram
  participant Alice
  participant Bob
  Alice->>John: Hello John, how are you?
  loop Healthcheck
      John->>John: Fight against hypochondria
  end
  John-->>Alice: Great!
  John->>Bob: How about you?
  Bob-->>John: Jolly good!`,
      classDiagram: `classDiagram
  Animal <|-- Duck
  Animal <|-- Fish
  Animal <|-- Zebra
  Animal : +int age
  Animal : +String gender
  Animal: +isMammal()
  Animal: +mate()
  class Duck{
    +String beakColor
    +swim()
    +quack()
  }`,
      gantt: `gantt
  title A Gantt Diagram
  dateFormat  YYYY-MM-DD
  section Section
  A task           :a1, 2014-01-01, 30d
  Another task     :after a1  , 20d
  section Another
  Task in sec      :2014-01-12  , 12d
  another task     : 24d`,
      er: `erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE-ITEM : contains
  CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`,
    };
    const sample = examples[kind] ?? '';
    this.editor?.setValue(sample);
    this.diagramState.updateState({ updateDiagram: true });
  }

  /* =================================================================== */
  /*  PRIVATE HELPERS                                                    */
  /* =================================================================== */

  private updateFromState(state: any /* ValidatedState | DiagramState */) {
    this.editorMode = state.editorMode ?? 'code';
    this.error = state.error?.message ?? null;

    if (!this.editor) return;

    const fresh =
      this.editorMode === 'code' ? state.code : state.mermaid;
    if (fresh !== this.currentText) {
      this.editor.setValue(fresh);
      this.currentText = fresh;
    }

    /* keep language in sync */
    const lang = this.editorMode === 'code' ? 'mermaid' : 'json';
    if (this.editor.getModel()?.getLanguageId() !== lang) {
      this.monaco.editor.setModelLanguage(this.editor.getModel()!, lang);
    }
  }

  private async bootstrapMonaco(): Promise<void> {
    this.monaco = await this.monacoLoader.loadMonaco();

    this.monaco.editor.defineTheme('simple-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editorLineNumber.foreground': '#94a3b8',
        'editorCursor.foreground': '#1e293b',
      },
    });

    this.editor = this.monaco.editor.create(
      this.editorContainer.nativeElement,
      {
        value: '',
        language: 'mermaid',
        theme: 'simple-light',
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
      }
    );

    /* update caret position */
    this.editor.onDidChangeCursorPosition((e) => {
      this.cursorPosition = {
        lineNumber: e.position.lineNumber,
        column: e.position.column,
      };
    });

    /* push initial text */
    const init = this.diagramState.currentState;
    this.currentText =
      this.editorMode === 'code' ? init.code : init.mermaid;
    this.editor.setValue(this.currentText);

    /* propagate edits */
    this.editor.onDidChangeModelContent(() => {
      const newText = this.editor.getValue();
      if (newText === this.currentText) return;
      this.currentText = newText;

      if (this.editorMode === 'code') {
        this.diagramState.updateCode(newText, { updateDiagram: true });
      } else {
        this.diagramState.updateConfig(newText);
      }
    });
  }
}
