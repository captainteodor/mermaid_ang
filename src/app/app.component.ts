import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { SampleDiagramsComponent } from './components/sample-diagrams/sample-diagrams.component';
import { ExportDialogComponent } from './components/export-dialog/export-dialog.component';
import { DiagramStateService } from './services/diagram-state.service';
import { UtilsService } from './services/utils.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ToolbarComponent
  ],
  template: `
    <div class="app-container">
      <app-toolbar></app-toolbar>
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
  `]
})
export class AppComponent implements OnInit {
  private isBrowser: boolean;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private diagramState: DiagramStateService,
    private utils: UtilsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    // Check for hash in URL to load a diagram
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        try {
          const state = this.utils.deserializeState(fragment);
          this.diagramState.updateState({ ...state, updateDiagram: true });
        } catch (error) {
          console.error('Failed to load diagram from URL:', error);
        }
      }
    });

    // Set up listeners for toolbar actions
    window.addEventListener('toolbarAction', ((event: CustomEvent) => {
      if (event.detail.action === 'openSampleDiagrams') {
        this.openSampleDiagrams();
      } else if (event.detail.action === 'openExportDialog') {
        this.openExportDialog();
      }
    }) as EventListener);
  }

  openSampleDiagrams(): void {
    if (!this.isBrowser) return;

    this.dialog.open(SampleDiagramsComponent, {
      width: '800px',
      maxWidth: '90vw'
    });
  }

  openExportDialog(): void {
    if (!this.isBrowser) return;

    this.dialog.open(ExportDialogComponent, {
      width: '600px',
      maxWidth: '90vw'
    });
  }
}
