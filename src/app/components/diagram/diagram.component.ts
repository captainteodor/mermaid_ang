import { Component, ElementRef, OnInit, OnDestroy, ViewChild, inject, AfterViewInit, NgZone, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DiagramStateService } from '../../services/diagram-state.service';
import { UtilsService } from '../../services/utils.service';
import { Subscription, debounceTime } from 'rxjs';
import mermaid from 'mermaid';

@Component({
  selector: 'app-diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.scss'],
  standalone: true,
  imports: [
    CommonModule
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
        theme: 'default', // In Mermaid 12, theme is set directly, not via themeVariables
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

  // Add a simple debounce utility
  private debounce(fn: Function, delay: number): () => void {
    let timeoutId: any;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(), delay);
    };
  }

  private setupResizeObserver(): void {
    if (!this.isBrowser || !window.ResizeObserver) return;

    this.resizeObserver = new ResizeObserver(() => {
      if (this.panZoomInstance) {
        this.ngZone.runOutsideAngular(() => {
          // Remember current zoom level
          const currentZoom = this.panZoomInstance.getZoom();

          this.panZoomInstance.updateBBox();
          this.panZoomInstance.resize();
          this.panZoomInstance.fit();

          // Optionally restore zoom level if desired
          // this.panZoomInstance.zoom(currentZoom);

          this.panZoomInstance.center();
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

    // ---> ADD LOGGING HERE <---
    console.log('Attempting to render diagram. Code:', JSON.stringify(code), 'Config:', configStr);

    if (!code || code.trim() === '') {
      console.error('Render attempt with empty code. Aborting.');
      this.loading = false;
      // Optionally set a specific error message for empty code
      // this.error = 'Cannot render an empty diagram.';
      return; // Prevent rendering empty code
    }
    // ---> END LOGGING <---

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

      // Process the SVG - IMPROVED CODE HERE
      const svgElement = this.diagramContainer.nativeElement.querySelector('svg');
      if (svgElement) {
        // Remove any inline max-width constraint
        svgElement.style.removeProperty('max-width');

        // Instead of calculating aspect ratio and explicit dimensions,
        // set viewBox and let SVG fill the container responsively
        const svgBBox = svgElement.getBBox();

        // Ensure viewBox is set correctly
        svgElement.setAttribute('viewBox', `0 0 ${svgBBox.width} ${svgBBox.height}`);

        // Let SVG fill its container while maintaining aspect ratio
        svgElement.setAttribute('width', '100%');
        svgElement.setAttribute('height', '100%');

        // Preserve aspect ratio
        svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
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
      // Use type assertion if needed to handle module structure
      const svgPanZoom = module.default || module;

      this.ngZone.runOutsideAngular(() => {
        try {
          const svgElement = this.diagramContainer.nativeElement.querySelector('svg');
          if (!svgElement) {
            console.error('SVG element not found');
            return;
          }

          // Remove any max-width constraint
          svgElement.style.removeProperty('max-width');

          // Ensure SVG has proper dimensions for pan/zoom
          // Instead of calculating percentages, use 100% width and maintain aspect ratio
          svgElement.setAttribute('width', '100%');
          svgElement.setAttribute('height', 'auto');

          // Ensure viewBox is set correctly
          if (!svgElement.getAttribute('viewBox')) {
            const bbox = svgElement.getBBox();
            svgElement.setAttribute('viewBox', `0 0 ${bbox.width} ${bbox.height}`);
          }

          // Destroy previous instance if it exists
          if (this.panZoomInstance) {
            this.panZoomInstance.destroy();
          }

          // Create new instance with optimized defaults
          this.panZoomInstance = svgPanZoom(svgElement, {
            zoomEnabled: true,
            controlIconsEnabled: false,
            fit: true,
            center: true,
            minZoom: 0.1,
            maxZoom: 10,
            zoomScaleSensitivity: 0.3,
            dblClickZoomEnabled: true,
            panEnabled: true,
            contain: false, // Allow panning beyond SVG boundaries for better UX
            preventMouseEventsDefault: true,
          });

          // Always fit and center the diagram immediately
          this.panZoomInstance.resize();
          this.panZoomInstance.fit();
          this.panZoomInstance.center();

          // Set initial position from state if available
          const state = this.diagramState.currentState;
          if (state.pan && state.zoom &&
              Number.isFinite(state.zoom) &&
              Number.isFinite(state.pan.x) &&
              Number.isFinite(state.pan.y)) {
            // Apply saved position
            this.panZoomInstance.zoom(state.zoom);
            this.panZoomInstance.pan(state.pan);
          } else {
            // If no saved position, set initial zoom that makes diagram comfortably visible
            this.panZoomInstance.zoom(0.95);
          }

          // Save pan/zoom state on change
          this.setupPanZoomStateTracking();

        } catch (error) {
          console.error('Error setting up pan-zoom:', error);
        }
      });
    }).catch(error => {
      console.error('Failed to load svg-pan-zoom:', error);
    });
  }

  // Add this helper method to track pan/zoom state changes
  private setupPanZoomStateTracking(): void {
    if (!this.panZoomInstance || !this.isBrowser) return;

    // Use a more efficient event-based approach instead of polling
    const updateState = () => {
      const zoom = this.panZoomInstance.getZoom();
      const pan = this.panZoomInstance.getPan();

      // Only update if values are valid
      if (Number.isFinite(zoom) && Number.isFinite(pan.x) && Number.isFinite(pan.y)) {
        this.diagramState.updateState({ zoom, pan });
      }
    };

    // Add custom event listeners for pan and zoom events
    const svgElement = this.diagramContainer.nativeElement.querySelector('svg');
    if (svgElement) {
      svgElement.addEventListener('panend', updateState);
      svgElement.addEventListener('zoomend', updateState);
    }
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

  /**
   * Dismisses the current error message
   */
  dismissError(): void {
    this.error = null;
  }
}
