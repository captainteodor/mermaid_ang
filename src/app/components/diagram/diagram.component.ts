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
      this.showGrid = !!this.diagramState.currentState.grid; // FIX: Use !! to ensure boolean
      // Initial theme setting might be needed here too if config isn't loaded immediately
      // mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'strict' });
    }
  }

  ngOnInit(): void {
    if (!this.isBrowser) return; // Skip initialization on server

    // Subscribe to state changes with debounce to prevent too frequent renders
    this.subscription.add(
      this.diagramState.state$.pipe(
        debounceTime(300) // Debounce time can be adjusted
      ).subscribe(state => {
        try {
          // FIX: Safely parse and explicitly check theme, ensuring boolean assignment
          const config = state.mermaid ? JSON.parse(state.mermaid) : {};
          this.darkMode = !!(config.theme === 'dark');
        } catch(e) {
          console.error("Error parsing mermaid config in subscription for dark mode:", e);
          // Keep previous darkMode value if parsing fails
        }
        if (state.updateDiagram) {
          this.renderDiagram(state.code, state.mermaid, state.rough);
          // Reset the update flag AFTER rendering attempt
          this.diagramState.updateState({ updateDiagram: false });
        }
        this.showGrid = !!state.grid; // FIX: Use !! to ensure boolean
      })
    );
  }

  private resizeObserver: ResizeObserver | null = null;

  ngAfterViewInit(): void {
    if (!this.isBrowser) return; // Skip on server

    // Initial render after view initialization
    const state = this.diagramState.currentState;
    try {
      // FIX: Safely parse and explicitly check theme, ensuring boolean assignment
      const config = state.mermaid ? JSON.parse(state.mermaid) : {};
      this.darkMode = !!(config.theme === 'dark');
    } catch(e) {
        console.error("Error parsing mermaid config in ngAfterViewInit for dark mode:", e);
        // Default darkMode to false if parsing fails initially
        this.darkMode = false;
    }
    this.renderDiagram(state.code, state.mermaid, state.rough);

    // Set up resize observer to handle container size changes
    this.setupResizeObserver();
  }

  private setupResizeObserver(): void {
    if (!this.isBrowser || !window.ResizeObserver) return;

    this.resizeObserver = new ResizeObserver(() => {
      if (this.panZoomInstance) {
        this.ngZone.runOutsideAngular(() => {
          // Fit and center on resize
          this.panZoomInstance.resize();
          this.panZoomInstance.fit();
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
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  private async renderDiagram(code: string, configStr: string, useRough: boolean): Promise<void> {
    if (!this.isBrowser) return; // Skip on server

    console.log('Attempting to render diagram. Code:', JSON.stringify(code), 'Config:', configStr);

    if (!code || code.trim() === '') {
      console.error('Render attempt with empty code. Aborting.');
      this.loading = false;
      // Optionally clear the container or show a message
      if (this.diagramContainer) this.diagramContainer.nativeElement.innerHTML = '<p style="padding: 20px; color: grey;">Empty diagram code.</p>';
      this.error = null; // Clear previous errors
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      // Parse the config
      let config: any = {}; // Initialize config object, use 'any' for flexibility
      try {
        config = JSON.parse(configStr || '{}'); // Ensure valid JSON or empty object
      } catch (e) {
        console.error("Failed to parse mermaid config JSON:", e);
        this.error = "Invalid Mermaid configuration JSON.";
        this.loading = false;
        return;
      }

      // --- START: Force htmlLabels: false for classDiagram ---
      // Ensure the classDiagram key exists
      if (!config.classDiagram) {
        config.classDiagram = {};
      }
      // Set htmlLabels to false
      config.classDiagram.htmlLabels = false;
      // --- END: Force htmlLabels: false ---

      // ---> ADD LOGGING <---
      console.log('Initializing Mermaid with config:', JSON.stringify(config, null, 2));
      // ---> END LOGGING <---

      // Initialize mermaid with the MODIFIED config
      // Ensure theme from config is respected, falling back to component state if needed
      const themeToUse = config.theme || (this.darkMode ? 'dark' : 'default');

      mermaid.initialize({
        ...config, // Spread the potentially modified config
        theme: themeToUse, // Explicitly set theme
        startOnLoad: false,
        securityLevel: 'strict',
      });

      // Clear previous diagram
      if (this.diagramContainer) {
        this.diagramContainer.nativeElement.innerHTML = '';
      }

      const uniqueId = `${this.diagramId}-${++this.renderCount}`;
      const { svg } = await mermaid.render(uniqueId, code);
      this.diagramContainer.nativeElement.innerHTML = svg;

      // Process the SVG
      const svgElement = this.diagramContainer.nativeElement.querySelector('svg');
      if (svgElement) {
        svgElement.style.removeProperty('max-width');
        const svgBBox = svgElement.getBBox();
        // Basic check for valid bbox dimensions
        if (svgBBox && svgBBox.width > 0 && svgBBox.height > 0) {
           svgElement.setAttribute('viewBox', `0 0 ${svgBBox.width} ${svgBBox.height}`);
        }
        svgElement.setAttribute('width', '100%');
        svgElement.setAttribute('height', 'auto'); // Use auto height for scaling
        svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      }

      // Setup pan-zoom after a slight delay
      setTimeout(() => { this.setupPanZoom(); }, 100);

    } catch (error: any) {
        this.error = error.message || 'Error rendering diagram';
        console.error('Diagram rendering error:', error);

        // Attempt to improve error message with line number
        if (error.message) {
            try {
                const errorLineText = this.utils.extractErrorLineText(error.message);
                const lineNumber = this.utils.findMostRelevantLineNumber(errorLineText, code);
                if (lineNumber !== -1) {
                    this.error = this.utils.replaceLineNumberInErrorMessage(error.message, lineNumber);
                }
            } catch (utilError) {
                console.error('Error processing error message:', utilError);
                // Keep the original error message if utils fail
            }
        }
        // Display error in the container
        if (this.diagramContainer) {
            this.diagramContainer.nativeElement.innerHTML = `<div style="padding: 20px; color: red; white-space: pre-wrap;">${this.error}</div>`;
        }
    } finally {
      this.loading = false;
    }
  }

  private setupPanZoom(): void {
    if (!this.isBrowser) return;

    import('svg-pan-zoom').then(module => {
      const svgPanZoom = module.default || module;

      this.ngZone.runOutsideAngular(() => {
        try {
          const svgElement = this.diagramContainer.nativeElement.querySelector('svg');
          if (!svgElement) {
            console.error('SVG element not found for pan-zoom setup');
            return;
          }

          // Destroy previous instance if it exists
          if (this.panZoomInstance) {
            this.panZoomInstance.destroy();
          }

          // Create new instance
          this.panZoomInstance = svgPanZoom(svgElement, {
            zoomEnabled: true,
            controlIconsEnabled: false,
            fit: true, // Fit diagram initially
            center: true, // Center diagram initially
            minZoom: 0.1,
            maxZoom: 10,
            zoomScaleSensitivity: 0.3,
            dblClickZoomEnabled: true,
            panEnabled: true,
            contain: false, // Allow panning slightly outside for better UX
            preventMouseEventsDefault: true,
          });

          // Fit and center again after creation for safety
          this.panZoomInstance.resize();
          this.panZoomInstance.fit();
          this.panZoomInstance.center();

          // Apply saved state or default zoom
          const state = this.diagramState.currentState;
          if (state.pan && state.zoom && Number.isFinite(state.zoom) && Number.isFinite(state.pan.x) && Number.isFinite(state.pan.y)) {
            this.panZoomInstance.zoom(state.zoom);
            this.panZoomInstance.pan(state.pan);
          } else {
             // Apply a slightly zoomed-out view initially if no state
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

  private setupPanZoomStateTracking(): void {
    if (!this.panZoomInstance || !this.isBrowser) return;

    const updateState = () => {
      if (!this.panZoomInstance) return; // Check if instance still exists
      const zoom = this.panZoomInstance.getZoom();
      const pan = this.panZoomInstance.getPan();
      if (Number.isFinite(zoom) && Number.isFinite(pan.x) && Number.isFinite(pan.y)) {
        this.diagramState.updateState({ zoom, pan });
      }
    };

    // Add listeners for pan and zoom events
    this.panZoomInstance.setOnPan(updateState);
    this.panZoomInstance.setOnZoom(updateState);
  }

  // Public methods for toolbar buttons
  resetView(): void {
    if (!this.isBrowser || !this.panZoomInstance) return;
    this.ngZone.runOutsideAngular(() => {
       this.panZoomInstance.resetZoom();
       this.panZoomInstance.resetPan();
       this.panZoomInstance.center();
       this.panZoomInstance.fit();
       this.panZoomInstance.zoom(0.95); // Reapply initial zoom after reset
    });
  }

  zoomIn(): void {
    if (!this.isBrowser || !this.panZoomInstance) return;
    this.ngZone.runOutsideAngular(() => { this.panZoomInstance.zoomIn(); });
  }

  zoomOut(): void {
    if (!this.isBrowser || !this.panZoomInstance) return;
    this.ngZone.runOutsideAngular(() => { this.panZoomInstance.zoomOut(); });
  }

  toggleGrid(): void {
    this.showGrid = !this.showGrid;
    this.diagramState.updateState({ grid: this.showGrid });
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    try {
        const config = JSON.parse(this.diagramState.currentState.mermaid || '{}');
        config.theme = this.darkMode ? 'dark' : 'default';
        this.diagramState.updateConfig(JSON.stringify(config, null, 2));
        // Trigger re-render with new theme
        this.diagramState.updateState({ updateDiagram: true });
    } catch(e) {
        console.error("Failed to parse/update theme config:", e);
    }
  }

  dismissError(): void {
    this.error = null;
  }
}
