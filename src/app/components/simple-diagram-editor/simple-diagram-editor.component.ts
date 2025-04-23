import { Component, OnInit, OnDestroy, ElementRef, ViewChild, inject, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { DiagramStateService } from '../../services/diagram-state.service';
import { EditorComponent } from '../editor/editor.component';
import { DiagramComponent } from '../diagram/diagram.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-simple-diagram-editor',
  templateUrl: './simple-diagram-editor.component.html',
  styleUrls: ['./simple-diagram-editor.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    EditorComponent,
    DiagramComponent
  ]
})
export class SimpleDiagramEditorComponent implements OnInit, OnDestroy {
  @ViewChild('editorContainer') editorContainer?: ElementRef;

  private diagramState = inject(DiagramStateService);
  private subscription = new Subscription();
  private isBrowser: boolean;

  editorMode: 'code' | 'config' = 'code';
  editorWidth = 50; // Default split percentage
  isDragging = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

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
    this.subscription.unsubscribe();
  }

  onTabChange(mode: 'code' | 'config'): void {
    this.editorMode = mode;
    this.diagramState.updateState({ editorMode: mode });
  }

  // Resizing functionality
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
    // Adjust for mobile devices
    if (this.isBrowser && window.innerWidth < 768) {
      // Reset to default on mobile
      this.editorWidth = 50;
    }
  }

  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.isDragging || !this.isBrowser) return;

    // Calculate width based on mouse position
    const containerWidth = window.innerWidth;
    const newWidth = (event.clientX / containerWidth) * 100;

    // Constrain within reasonable limits (20% to 80%)
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
