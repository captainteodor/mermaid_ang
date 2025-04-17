import { Component, EventEmitter, Output, inject } from '@angular/core';
import { DiagramStateService } from '../../services/diagram-state.service';
import { UtilsService } from '../../services/utils.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent {
  @Output() themeToggled = new EventEmitter<boolean>();

  private diagramState = inject(DiagramStateService);
  private utils = inject(UtilsService);

  mermaidVersion = '11.6.0';
  isDarkTheme = false;

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

  saveToAccount(): void {
    // This would connect to the backend in a future implementation
    alert('Save to account feature will be available in the future');
  }

  openSampleDiagrams(): void {
    // This would open the sample diagrams dialog
    alert('Sample diagrams feature will be available soon');
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    this.themeToggled.emit(this.isDarkTheme);

    // Update Mermaid theme
    const config = JSON.parse(this.diagramState.currentState.mermaid);
    config.theme = this.isDarkTheme ? 'dark' : 'default';
    this.diagramState.updateConfig(JSON.stringify(config, null, 2));
  }

  exportDiagram(format: 'svg' | 'png'): void {
    // In the future, this would use a proper service
    alert(`Export as ${format.toUpperCase()} feature will be available soon`);
  }
}
