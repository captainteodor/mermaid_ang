import { Component, ElementRef, ViewChild, OnInit, OnDestroy, inject, PLATFORM_ID, Inject, HostListener, Renderer2, AfterViewInit } from '@angular/core'; // Added Renderer2, AfterViewInit
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { DiagramStateService } from '../../services/diagram-state.service';
import { DiagramComponent } from '../diagram/diagram.component';
// REMOVE MatIconModule import
// import { MatIconModule } from '@angular/material/icon';
import { EditorComponent } from '../editor/editor.component';

@Component({
    selector: 'app-workspace',
    templateUrl: './workspace.component.html',
    styleUrls: ['./workspace.component.scss'],
    imports: [
        CommonModule,
        // REMOVE MatIconModule from imports
        EditorComponent,
        DiagramComponent
    ]
})
export class WorkspaceComponent implements OnInit, OnDestroy, AfterViewInit { // Implemented AfterViewInit
  @ViewChild('workspaceContainer') workspaceContainer!: ElementRef<HTMLDivElement>;

  private diagramState = inject(DiagramStateService);
  private renderer = inject(Renderer2); // Inject Renderer2
  private subscription = new Subscription();
  private isBrowser: boolean;


  isMobile = false;
  splitRatio = 40; // Default Percentage for the editor width (updated from 50)
  isDragging = false;
  selectedTab = 'code';

  // References to panels for mobile visibility toggle
  private editorPanelElement: HTMLElement | null = null;
  private diagramPanelElement: HTMLElement | null = null;


  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.checkScreenSize();
    } else {
      this.isMobile = false;
    }
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.subscription.add(
        this.diagramState.state$.subscribe(state => {
           // Ensure selectedTab reflects state only if it's code/config
           if (state.editorMode === 'code' || state.editorMode === 'config') {
             this.selectedTab = state.editorMode;
             this.updateMobileVisibility(); // Update visibility when state changes
           }
        })
      );
      // Set initial editor basis
      this.setEditorBasis(this.splitRatio);
    }
  }

   ngAfterViewInit() {
    if (this.isBrowser) {
      // Get panel elements after view is initialized
      this.editorPanelElement = this.workspaceContainer.nativeElement.querySelector('.editor-panel');
      this.diagramPanelElement = this.workspaceContainer.nativeElement.querySelector('.diagram-panel');

      // Set initial visibility for mobile
      this.updateMobileVisibility();

      // Fix layout after a short delay to ensure rendering
      // The fixPanelLayout logic seems overly complex and might conflict
      // with flexbox. Consider simplifying or removing if flex handles it.
      // setTimeout(() => this.fixPanelLayout(), 0);

      // Add resize listener using Renderer2 for better cleanup potential
      // window.addEventListener('resize', this.onWindowResize);
    }
  }


  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.isBrowser) {
        // Clean up listeners
        document.removeEventListener('mousemove', this.onDrag);
        document.removeEventListener('mouseup', this.stopDrag);
        // window.removeEventListener('resize', this.onWindowResize);
    }
  }

 // Bound arrow function for listener cleanup
  // private onWindowResize = (): void => {
  //    this.checkScreenSize();
  //    // this.fixPanelLayout(); // Re-evaluate if fixPanelLayout is needed
  // };

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (this.isBrowser) {
      this.checkScreenSize();
       // Re-apply editor basis on resize if needed, flexbox might handle it
       this.setEditorBasis(this.splitRatio);
    }
  }

  private checkScreenSize(): void {
    if (this.isBrowser) {
      const wasMobile = this.isMobile;
      this.isMobile = window.innerWidth < 768;
      if (wasMobile !== this.isMobile) {
         // Update visibility immediately if mobile state changes
         this.updateMobileVisibility();
         // Reset selected tab if switching TO mobile and it was 'diagram'
         if (this.isMobile && this.selectedTab === 'diagram') {
            this.selectedTab = 'code';
         }
         // Ensure panels are displayed correctly when switching FROM mobile
         if (!this.isMobile && this.editorPanelElement && this.diagramPanelElement) {
             this.renderer.removeStyle(this.editorPanelElement, 'display');
             this.renderer.removeStyle(this.diagramPanelElement, 'display');
             this.renderer.removeClass(this.editorPanelElement, 'visible-mobile');
             this.renderer.removeClass(this.diagramPanelElement, 'visible-mobile');
         }
      }
    }
  }

  onTabChange(tab: string): void {
    this.selectedTab = tab;
    if (tab === 'code' || tab === 'config') {
      this.diagramState.updateState({ editorMode: tab as 'code' | 'config' });
    }
    this.updateMobileVisibility(); // Update visibility when tab changes
  }

  // --- Resizer Logic ---

  startDrag(event: MouseEvent): void {
    if (!this.isBrowser || this.isMobile) return; // Don't drag on mobile

    event.preventDefault();
    this.isDragging = true;
    // Use bound functions for listeners
    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('mouseup', this.stopDrag);
    this.renderer.setStyle(document.body, 'cursor', 'col-resize');
    this.renderer.setStyle(document.body, 'user-select', 'none'); // Prevent text selection
  }

  // Use arrow function to preserve 'this' context for listener
  private onDrag = (event: MouseEvent): void => {
    if (!this.isDragging || !this.isBrowser) return;

    const containerRect = this.workspaceContainer.nativeElement.getBoundingClientRect();
    // Calculate position relative to the container
    const newPosition = event.clientX - containerRect.left;
    // Calculate ratio, preventing division by zero
    const newRatio = containerRect.width > 0 ? (newPosition / containerRect.width) * 100 : 50;

    // Constrain ratio
    this.splitRatio = Math.max(20, Math.min(80, newRatio));
    this.setEditorBasis(this.splitRatio);
  }

  // Use arrow function to preserve 'this' context for listener
  private stopDrag = (): void => {
    if (!this.isBrowser || !this.isDragging) return;

    this.isDragging = false;
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
    this.renderer.removeStyle(document.body, 'cursor');
    this.renderer.removeStyle(document.body, 'user-select');
  }

  private setEditorBasis(ratio: number): void {
     // Use Renderer2 to set style - safer for SSR potentially, though logic is browser-only
     this.renderer.setStyle(this.workspaceContainer.nativeElement, '--editor-basis', `${ratio}%`);
     // Alternatively, directly set:
     // document.documentElement.style.setProperty('--editor-basis', `${ratio}%`);
  }


  // --- Mobile Panel Visibility ---

  private updateMobileVisibility(): void {
     if (!this.isBrowser || !this.isMobile || !this.editorPanelElement || !this.diagramPanelElement) {
        // If not mobile, ensure classes are removed
        if (this.editorPanelElement) this.renderer.removeClass(this.editorPanelElement, 'visible-mobile');
        if (this.diagramPanelElement) this.renderer.removeClass(this.diagramPanelElement, 'visible-mobile');
        return;
     }

     // Logic for mobile visibility using Renderer2
     if (this.selectedTab === 'code' || this.selectedTab === 'config') {
        this.renderer.addClass(this.editorPanelElement, 'visible-mobile');
        this.renderer.removeClass(this.diagramPanelElement, 'visible-mobile');
     } else if (this.selectedTab === 'diagram') {
        this.renderer.removeClass(this.editorPanelElement, 'visible-mobile');
        this.renderer.addClass(this.diagramPanelElement, 'visible-mobile');
     }
  }

  // Consider removing fixPanelLayout if flexbox handles sizing sufficiently
  // private fixPanelLayout(): void { ... }

}
