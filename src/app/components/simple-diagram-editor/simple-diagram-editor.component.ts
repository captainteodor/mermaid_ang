import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { DiagramStateService } from '../../services/diagram-state.service';
import { EditorComponent } from '../editor/editor.component';
import { DiagramComponent } from '../diagram/diagram.component';

@Component({
  selector: 'app-simple-diagram-editor',
  templateUrl: './simple-diagram-editor.component.html',
  styleUrls: ['./simple-diagram-editor.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    EditorComponent,
    DiagramComponent
  ]
})
export class SimpleDiagramEditorComponent implements OnInit, OnDestroy {
  editorMode: string = 'code';
  editorWidth: number = 50;
  isDragging = false;

  // Add the three injected members
  private diagramState = inject(DiagramStateService);
  private subscription = new Subscription();
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  ngOnInit(): void {
    if (!this.isBrowser) return;

    // Subscribe to editor mode changes
    this.subscription.add(
      this.diagramState.state$.subscribe(state => {
        this.editorMode = state.editorMode || 'code';
      })
    );
  }

  ngOnDestroy(): void {
    // Properly unsubscribe to prevent memory leaks
    this.subscription.unsubscribe();
  }

  onTabChange(mode: string): void {
    this.editorMode = mode;
    this.diagramState.updateState({ editorMode: mode as 'code' | 'config' });
  }

  startResize(event: MouseEvent): void {
    if (!this.isBrowser) return;

    event.preventDefault();
    this.isDragging = true;
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.body.style.cursor = 'col-resize';
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isBrowser && window.innerWidth < 768) {
      this.editorWidth = 50;
    }
  }

  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.isDragging || !this.isBrowser) return;

    const containerWidth = window.innerWidth;
    const newWidth = (event.clientX / containerWidth) * 100;
    this.editorWidth = Math.max(20, Math.min(80, newWidth));
  };

  private handleMouseUp = (): void => {
    if (!this.isBrowser) return;

    this.isDragging = false;
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.body.style.cursor = 'default';
  };
}
