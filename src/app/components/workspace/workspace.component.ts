import { Component, OnInit, OnDestroy, ElementRef, ViewChild, inject, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DiagramStateService } from '../../services/diagram-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  @ViewChild('workspaceContainer') workspaceContainer!: ElementRef;

  private diagramState = inject(DiagramStateService);
  private subscription = new Subscription();
  private isBrowser: boolean;

  isMobile = false;
  splitRatio = 50; // Percentage for the editor width (remainder goes to diagram)
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

  // Resizer functionality
  startDrag(event: MouseEvent): void {
    if (!this.isBrowser) return;

    event.preventDefault();
    this.isDragging = true;
    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('mouseup', this.stopDrag);
    document.body.style.cursor = 'col-resize';
  }

  @HostListener('document:mousemove', ['$event'])
  onDrag = (event: MouseEvent): void => {
    if (!this.isDragging || !this.isBrowser) return;

    const containerRect = this.workspaceContainer.nativeElement.getBoundingClientRect();
    const offsetX = event.clientX - containerRect.left;

    // Calculate percentage
    let percentage = (offsetX / containerRect.width) * 100;

    // Limit the percentage between 20% and 80%
    percentage = Math.max(20, Math.min(80, percentage));

    this.splitRatio = percentage;
  };

  @HostListener('document:mouseup')
  stopDrag = (): void => {
    if (!this.isBrowser) return;

    this.isDragging = false;
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
    document.body.style.cursor = 'default';
  };
}
