import { Component, ElementRef, ViewChild, OnInit, OnDestroy, inject, PLATFORM_ID, Inject, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { DiagramStateService } from '../../services/diagram-state.service';
import { DiagramComponent } from '../diagram/diagram.component';
import { MatIconModule } from '@angular/material/icon';
import { EditorComponent } from '../editor/editor.component';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    EditorComponent,
    DiagramComponent  // Import the DiagramComponent
  ]
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  @ViewChild('workspaceContainer') workspaceContainer!: ElementRef;

  private diagramState = inject(DiagramStateService);
  private subscription = new Subscription();
  private isBrowser: boolean;

  // Add these properties that are used in the template
  isMobile = false;
  splitRatio = 50; // Percentage for the editor width
  isDragging = false;
  selectedTab = 'code'; // 'code' or 'config' or 'diagram' for mobile

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Only check screen size in browser
    if (this.isBrowser) {
      this.checkScreenSize();
    } else {
      // Set a default for server-side rendering
      this.isMobile = false;
    }
  }

  ngOnInit(): void {
    // Only perform browser-specific operations if in browser
    if (this.isBrowser) {
      this.subscription.add(
        this.diagramState.state$.subscribe(state => {
          this.selectedTab = state.editorMode || 'code';
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (this.isBrowser) {
      this.checkScreenSize();
    }
  }

  private checkScreenSize(): void {
    if (this.isBrowser) {
      this.isMobile = window.innerWidth < 768;
    }
  }

  onTabChange(tab: string): void {
    this.selectedTab = tab;
    if (tab === 'code' || tab === 'config') {
      this.diagramState.updateState({ editorMode: tab as 'code' | 'config' });
    }
  }

  // Add the startDrag method used in the template
  startDrag(event: MouseEvent): void {
    if (!this.isBrowser) return;

    event.preventDefault();
    this.isDragging = true;
    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('mouseup', this.stopDrag);
    document.body.style.cursor = 'col-resize';
  }

  // Add these methods that would likely be needed by startDrag
  private onDrag = (event: MouseEvent): void => {
    if (!this.isDragging || !this.isBrowser) return;

    const containerRect = this.workspaceContainer.nativeElement.getBoundingClientRect();
    const newSplitRatio = ((event.clientX - containerRect.left) / containerRect.width) * 100;

    // Constrain the split ratio to avoid panels becoming too small
    if (newSplitRatio >= 20 && newSplitRatio <= 80) {
      this.splitRatio = newSplitRatio;
    }
  }

  stopDrag = (): void => {
    if (!this.isBrowser) return;

    this.isDragging = false;
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
    document.body.style.cursor = 'default';
  }
}
