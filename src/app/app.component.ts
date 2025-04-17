import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DiagramStateService } from './services/diagram-state.service';
import { UtilsService } from './services/utils.service';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container" [class.dark-theme]="isDarkTheme">
      <app-toolbar (themeToggled)="toggleTheme($event)"></app-toolbar>
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    main {
      flex: 1;
      overflow: hidden;
    }
  `]
})
export class AppComponent implements OnInit {
  isDarkTheme = false;
  private isBrowser: boolean;

  constructor(
    private diagramState: DiagramStateService,
    private utils: UtilsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    // Check for dark mode preference
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    this.isDarkTheme = prefersDarkScheme.matches;

    // Set initial theme in mermaid config
    this.updateMermaidTheme();
  }

  // Fixed to accept a boolean parameter directly
  toggleTheme(isDark: boolean): void {
    this.isDarkTheme = isDark;
    this.updateMermaidTheme();

    // Dispatch a custom event for other components
    if (this.isBrowser) {
      window.dispatchEvent(new CustomEvent('themeChange', {
        detail: { isDark: this.isDarkTheme }
      }));
    }
  }

  private updateMermaidTheme(): void {
    try {
      const config = JSON.parse(this.diagramState.currentState.mermaid);
      config.theme = this.isDarkTheme ? 'dark' : 'default';
      this.diagramState.updateConfig(JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Error updating mermaid theme:', error);
    }
  }
}
