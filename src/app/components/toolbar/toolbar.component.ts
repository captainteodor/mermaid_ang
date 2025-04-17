import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DiagramStateService } from '../../services/diagram-state.service';
import { UtilsService } from '../../services/utils.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatMenuModule,
    MatTooltipModule
  ]
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
    }).catch((err: Error) => {
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

  handleError(err: Error) {
    console.error('Error:', err);
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
