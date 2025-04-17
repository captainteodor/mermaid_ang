import { Component, OnInit, inject, PLATFORM_ID, Inject, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { EditorComponent } from '../editor/editor.component';
import { DiagramComponent } from '../diagram/diagram.component';
import { DiagramStateService } from '../../services/diagram-state.service';

@Component({
  selector: 'app-simple-diagram-editor',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    EditorComponent,
    DiagramComponent
  ],
  template: `
    <div class="simple-editor-container">
      <div class="editor-header">
        <a routerLink="/" class="editor-title">SimpleDiagramEditor</a>

        <!-- Documentation link -->
        <a href="https://mermaid.js.org/syntax/" target="_blank" class="docs-link">
          <mat-icon>menu_book</mat-icon>
          Documentation
        </a>
      </div>

      <div class="editor-content">
        <div class="editor-panel">
          <app-editor></app-editor>
        </div>

        <div class="diagram-panel">
          <app-diagram></app-diagram>
        </div>
      </div>
    </div>
  `,
  styleUrl: './simple-diagram-editor.component.scss'
})
export class SimpleDiagramEditorComponent implements OnInit {
  private diagramState = inject(DiagramStateService);
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    // Just initialize from state, no tab handling needed
    this.diagramState.currentState.editorMode || 'code';
  }
}
