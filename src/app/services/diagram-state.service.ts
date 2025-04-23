import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { LocalStorageService } from './local-storage.service';

// Base interface
export interface DiagramState {
  code: string;
  mermaid: string;
  updateDiagram: boolean;
  rough: boolean;
  panZoom?: boolean;
  grid?: boolean;
  editorMode?: 'code' | 'config';
  pan?: { x: number; y: number };
  zoom?: number;
}

// Extended interface for states that include validation results
export interface ValidatedState extends DiagramState {
  diagramType?: string;
  error?: Error;
  errorMarkers: any[];
  serialized: string;
}

const DEFAULT_DIAGRAM = `flowchart TD
  A[Christmas] -->|Get money| B(Go shopping)
  B --> C{Let me think}
  C -->|One| D[Laptop]
  C -->|Two| E[iPhone]
  C -->|Three| F[fa:fa-car Car]
`;

@Injectable({
  providedIn: 'root'
})
export class DiagramStateService {
  private defaultState: DiagramState = {
    code: DEFAULT_DIAGRAM,
    mermaid: JSON.stringify({ theme: 'default' }, null, 2),
    updateDiagram: true,
    rough: false,
    grid: true,
    panZoom: true,
    editorMode: 'code'
  };

  // Use Angular signals for reactive state
  private state = signal<DiagramState>(this.defaultState);

  // Observable for components that need to subscribe to state changes
  public state$ = toObservable(this.state);

  // Expose the current state value directly
  public get currentState(): DiagramState {
    return this.state();
  }

  constructor(private localStorageService: LocalStorageService) {
    // Initialize from local storage if available
    const savedState = this.localStorageService.getItem('diagramState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        this.updateState(parsedState);
      } catch (error) {
        console.error('Failed to parse saved state', error);
      }
    }
  }

  updateState(newState: Partial<DiagramState>): void {
    // Update the state signal with the new state
    this.state.update(currentState => ({
      ...currentState,
      ...newState
    }));

    // Save to local storage
    this.localStorageService.setItem('diagramState', JSON.stringify(this.state()));
  }

  updateCode(code: string, options: { updateDiagram?: boolean; resetPanZoom?: boolean } = {}): void {
    const updateData: Partial<DiagramState> = { code };

    if (options.updateDiagram) {
      updateData.updateDiagram = true;
    }

    if (options.resetPanZoom) {
      updateData.pan = undefined;
      updateData.zoom = undefined;
    }

    this.updateState(updateData);
  }

  updateConfig(config: string): void {
    this.updateState({ mermaid: config });
  }

  resetToDefault(): void {
    this.updateState(this.defaultState);
  }
}
