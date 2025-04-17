import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, Inject, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { EditorComponent } from '../../components/editor/editor.component';
import { DiagramComponent } from '../../components/diagram/diagram.component';
import { DiagramStateService } from '../../services/diagram-state.service';
import { UtilsService } from '../../services/utils.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-editor-page',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatDialogModule,
    EditorComponent,
    DiagramComponent
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
    this.checkMobileView();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkMobileView();
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
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private checkMobileView(): void {
    this.isMobile = window.innerWidth < 768;
  }

  openSaveDialog(): void {
    // This would open a dialog to save the diagram
    // In a real implementation, this would use MatDialog
    alert('Save dialog would open here');
  }

  shareDiagram(): void {
    const state = this.diagramState.currentState;
    const serialized = this.utils.serializeState(state);

    // Copy URL with hash to clipboard
    const url = `${window.location.origin}${window.location.pathname}#${serialized}`;
    this.utils.copyToClipboard(url).then(() => {
      alert('Shareable link copied to clipboard!');
    }).catch(err => {
      console.error('Could not copy text: ', err);
      // Fallback
      prompt('Copy this link to share your diagram:', url);
    });
  }

  exportDiagram(): void {
    // This would open a dialog to export the diagram
    alert('Export dialog would open here');
  }

  toggleHistory(): void {
    this.isHistoryOpen = !this.isHistoryOpen;
  }

  switchView(view: 'editor' | 'diagram'): void {
    this.activeView = view;
  }
}
