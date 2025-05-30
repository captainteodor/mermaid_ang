import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, Inject, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
// REMOVE Angular Material Imports:
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatButtonToggleModule } from '@angular/material/button-toggle';
// import { MatTooltipModule } from '@angular/material/tooltip';
// import { MatDialogModule } from '@angular/material/dialog';
// Removed unused imports:
// import { EditorComponent } from '../../components/editor/editor.component';
// import { DiagramComponent } from '../../components/diagram/diagram.component';
import { DiagramStateService } from '../../services/diagram-state.service';
import { UtilsService } from '../../services/utils.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-editor-page',
  standalone: true,
  imports: [
    CommonModule,
    // REMOVE Material Modules from imports:
    // MatButtonModule,
    // MatIconModule,
    // MatButtonToggleModule,
    // MatTooltipModule,
    // MatDialogModule,
    // Removed unused components from imports:
    // EditorComponent,
    // DiagramComponent
  ],
  templateUrl: './editor-page.component.html',
  styleUrl: './editor-page.component.scss'
})
export class EditorPageComponent implements OnInit, OnDestroy {
  private diagramState = inject(DiagramStateService);
  private utils = inject(UtilsService);
  private route = inject(ActivatedRoute);
  private subscription = new Subscription();

  isHistoryOpen = false;
  isMobile = false;
  activeView: 'editor' | 'diagram' = 'editor'; // For mobile view

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Check screen size only if in browser environment
    if (isPlatformBrowser(this.platformId)) {
        this.checkMobileView();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
     // Check screen size only if in browser environment
     if (isPlatformBrowser(this.platformId)) {
        this.checkMobileView();
    }
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Check for hash in URL to load a diagram
    this.subscription.add(
      this.route.fragment.subscribe(fragment => {
        if (fragment) {
          try {
            const state = this.utils.deserializeState(fragment);
            this.diagramState.updateState({ ...state, updateDiagram: true });
          } catch (error) {
            console.error('Failed to load diagram from URL:', error);
            // Optionally provide user feedback here
            alert('Could not load diagram data from the URL fragment.');
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private checkMobileView(): void {
    // This function assumes it only runs in the browser context
    this.isMobile = window.innerWidth < 768;
     // Reset view if switching to desktop and history is open
     if(!this.isMobile && this.isHistoryOpen) {
         // Optionally decide if activeView should reset
         // this.activeView = 'editor'; // Or keep last active view
     } else if (this.isMobile) {
        // Ensure history is closed on mobile
        this.isHistoryOpen = false;
     }
  }

  openSaveDialog(): void {
    // Placeholder: Replace with your custom dialog implementation
    // using your design system components
    alert('Save dialog would open here');
  }

  shareDiagram(): void {
    if (!isPlatformBrowser(this.platformId)) return; // Ensure browser context

    const state = this.diagramState.currentState;
    const serialized = this.utils.serializeState(state);

    const url = `${window.location.origin}${window.location.pathname}#${serialized}`;
    this.utils.copyToClipboard(url).then(() => {
      alert('Shareable link copied to clipboard!');
    }).catch(err => {
      console.error('Could not copy text: ', err);
      prompt('Copy this link to share your diagram:', url);
    });
  }

  exportDiagram(): void {
     // Placeholder: Replace with your custom dialog/menu implementation
    alert('Export dialog/options would open here');
  }

  toggleHistory(): void {
    // Prevent opening history on mobile view
    if(this.isMobile) return;
    this.isHistoryOpen = !this.isHistoryOpen;
  }

  switchView(view: 'editor' | 'diagram'): void {
    this.activeView = view;
  }
}
