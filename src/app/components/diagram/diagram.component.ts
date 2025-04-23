import { Component, ElementRef, OnInit, OnDestroy, ViewChild, inject, AfterViewInit, NgZone, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DiagramStateService } from '../../services/diagram-state.service';
import { UtilsService } from '../../services/utils.service';
import { Subscription, debounceTime } from 'rxjs';
import mermaid from 'mermaid';

// Add these imports for Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.scss'],
  standalone: true,  // Mark as standalone
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ]
})
export class DiagramComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('diagramContainer') diagramContainer!: ElementRef;

  private diagramState = inject(DiagramStateService);
  private utils = inject(UtilsService);
  private ngZone = inject(NgZone);
  private subscription = new Subscription();
  private panZoomInstance: any;
  private diagramId = 'mermaid-diagram';
  private renderCount = 0;
  private isBrowser: boolean;

  error: string | null = null;
  loading = false;
  showGrid = true;
  darkMode = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Initialize isBrowser in the constructor
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Only initialize mermaid in browser environment
    if (this.isBrowser) {
      // Move initialization from ngAfterViewInit to here where possible
      this.showGrid = this.diagramState.currentState.grid || false;

      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'strict'
      });
    }
  }

  ngOnInit(): void {
    if (!this.isBrowser) return; // Skip initialization on server

    // Subscribe to state changes with debounce to prevent too frequent renders
    this.subscription.add(
      this.diagramState.state$.pipe(
        debounceTime(300)
      ).subscribe(state => {
        if (state.updateDiagram) {
          this.renderDiagram(state.code, state.mermaid, state.rough);

          // Reset the update flag
          this.diagramState.updateState({ updateDiagram: false });
        }

        this.showGrid = state.grid || false;
      })
    );
  }

  private resizeObserver: ResizeObserver | null = null;

  ngAfterViewInit(): void {
    if (!this.isBrowser) return; // Skip on server

    // Initial render after view initialization
    const state = this.diagramState.currentState;
    this.renderDiagram(state.code, state.mermaid, state.rough);

    // Set up resize observer to handle container size changes
    this.setupResizeObserver();
  }

  private setupResizeObserver(): void {
    if (!this.isBrowser || !window.ResizeObserver) return;

    this.resizeObserver = new ResizeObserver(entries => {
      // When container size changes, update the diagram size
      if (this.panZoomInstance) {
        this.ngZone.runOutsideAngular(() => {
          setTimeout(() => {
            this.panZoomInstance.updateBBox();
            this.panZoomInstance.resize();
            this.panZoomInstance.fit();
            this.panZoomInstance.center();
          }, 50);
        });
      }
    });

    this.resizeObserver.observe(this.diagramContainer.nativeElement);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.panZoomInstance && this.isBrowser) {
      this.panZoomInstance.destroy();
    }

    // Clean up resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  private async renderDiagram(code: string, configStr: string, useRough: boolean): Promise<void> {
    if (!this.isBrowser) return; // Skip on server

    this.loading = true;
    this.error = null;

    try {
      // Parse the config
      const config = JSON.parse(configStr);

      // Initialize mermaid with the config
      mermaid.initialize({
        ...config,
        startOnLoad: false,
        securityLevel: 'strict'
      });

      // Clear previous diagram
      if (this.diagramContainer) {
        this.diagramContainer.nativeElement.innerHTML = '';
      }

      // Generate a unique ID for this render to avoid conflicts
      const uniqueId = `${this.diagramId}-${++this.renderCount}`;

      // Render the diagram
      const { svg } = await mermaid.render(uniqueId, code);
      this.diagramContainer.nativeElement.innerHTML = svg;

      // Remove any inline max-width constraint
      const svgElement = this.diagramContainer.nativeElement.querySelector('svg');
      if (svgElement) {
        // Remove the inline max-width style that's constraining the SVG
        svgElement.style.removeProperty('max-width');

        // Get container dimensions once
        const containerWidth = this.diagramContainer.nativeElement.clientWidth || 300;
        const containerHeight = this.diagramContainer.nativeElement.clientHeight || 200;

        // Set width and height to fill most of the container while maintaining aspect ratio
        // Ensure valid values before setting
        const svgWidth = parseInt(svgElement.getAttribute('width')) || 100;
        const svgHeight = parseInt(svgElement.getAttribute('height')) || 100;
        const aspectRatio = svgWidth / svgHeight;

        // Calculate new dimensions that fill most of the container
        let newWidth, newHeight;
        if (containerWidth / containerHeight > aspectRatio) {
          // Container is wider than diagram
          newHeight = Math.min(containerHeight * 0.9, svgHeight);
          newWidth = newHeight * aspectRatio;
        } else {
          // Container is taller than diagram
          newWidth = Math.min(containerWidth * 0.9, svgWidth);
          newHeight = newWidth / aspectRatio;
        }

        // Check for NaN before setting attributes
        if (!isNaN(newWidth) && !isNaN(newHeight)) {
          svgElement.setAttribute('width', `${newWidth}px`);
          svgElement.setAttribute('height', `${newHeight}px`);
        } else {
          // Fallback to reasonable defaults
          svgElement.setAttribute('width', '100%');
          svgElement.setAttribute('height', '100%');
        }

        // Ensure viewBox is set correctly
        if (!svgElement.getAttribute('viewBox')) {
          svgElement.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
        }
      }

      // Setup pan-zoom after a slight delay to ensure SVG is fully rendered
      setTimeout(() => {
        this.setupPanZoom();
      }, 100);

    } catch (error: any) {
      this.error = error.message || 'Error rendering diagram';
      console.error('Diagram rendering error:', error);

      // Extract line information for better error messages
      if (error.message) {
        const errorLineText = this.utils.extractErrorLineText(error.message);
        const lineNumber = this.utils.findMostRelevantLineNumber(errorLineText, code);

        if (lineNumber !== -1) {
          this.error = this.utils.replaceLineNumberInErrorMessage(error.message, lineNumber);
        }
      }
    } finally {
      this.loading = false;
    }
  }

  private setupPanZoom(): void {
    if (!this.isBrowser) return;

    import('svg-pan-zoom').then(module => {
      // Extract the default export - this is the actual function
      const svgPanZoom = module.default;

      this.ngZone.runOutsideAngular(() => {
        try {
          const svgElement = this.diagramContainer.nativeElement.querySelector('svg');
          if (!svgElement) {
            console.error('SVG element not found');
            return;
          }

          // Remove any max-width constraint
          svgElement.style.removeProperty('max-width');

          // Using the container dimensions without redeclaration
          const containerDimensions = {
            width: this.diagramContainer.nativeElement.clientWidth,
            height: this.diagramContainer.nativeElement.clientHeight
          };

          // Set dimensions to fill most of the container
          svgElement.setAttribute('width', `${containerDimensions.width * 0.95}px`);
          svgElement.setAttribute('height', `${containerDimensions.height * 0.95}px`);

          // Ensure viewBox is set correctly
          const svgBBox = svgElement.getBBox();
          if (!svgElement.getAttribute('viewBox')) {
            svgElement.setAttribute('viewBox', `0 0 ${svgBBox.width} ${svgBBox.height}`);
          }

          // Destroy previous instance if it exists
          if (this.panZoomInstance) {
            this.panZoomInstance.destroy();
          }

          // Create new instance with better defaults
          this.panZoomInstance = svgPanZoom(svgElement, {
            zoomEnabled: true,
            controlIconsEnabled: false,
            fit: true,
            center: true,
            minZoom: 0.1,
            maxZoom: 10,
            zoomScaleSensitivity: 0.3,
            dblClickZoomEnabled: true
          });

          // Set initial zoom to a value that makes the diagram more visible
          this.panZoomInstance.zoom(0.9);

          // Fix to ensure pan/zoom is applied correctly
          setTimeout(() => {
            this.panZoomInstance.updateBBox();
            this.panZoomInstance.resize();
            this.panZoomInstance.fit();
            this.panZoomInstance.center();
          }, 50);

          // Set initial position from state if available
          const state = this.diagramState.currentState;
          if (state.pan && state.zoom &&
              Number.isFinite(state.zoom) &&
              Number.isFinite(state.pan.x) &&
              Number.isFinite(state.pan.y)) {
            this.panZoomInstance.zoom(state.zoom);
            this.panZoomInstance.pan(state.pan);
          }

        } catch (error) {
          console.error('Error setting up pan-zoom:', error);
        }
      });
    }).catch(error => {
      console.error('Failed to load svg-pan-zoom:', error);
    });
  }

  // Public methods for buttons
  resetView(): void {
    if (!this.isBrowser || !this.panZoomInstance) return;

    this.ngZone.runOutsideAngular(() => {
      this.panZoomInstance.reset();
    });
  }

  zoomIn(): void {
    if (!this.isBrowser || !this.panZoomInstance) return;

    this.ngZone.runOutsideAngular(() => {
      this.panZoomInstance.zoomIn();
    });
  }

  zoomOut(): void {
    if (!this.isBrowser || !this.panZoomInstance) return;

    this.ngZone.runOutsideAngular(() => {
      this.panZoomInstance.zoomOut();
    });
  }

  toggleGrid(): void {
    this.showGrid = !this.showGrid;
    this.diagramState.updateState({ grid: this.showGrid });
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    const config = JSON.parse(this.diagramState.currentState.mermaid);
    config.theme = this.darkMode ? 'dark' : 'default';
    this.diagramState.updateConfig(JSON.stringify(config, null, 2));
  }
}
