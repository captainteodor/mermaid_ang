import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DiagramStateService } from '../../services/diagram-state.service';
import { UtilsService } from '../../services/utils.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {
  private diagramState = inject(DiagramStateService);
  private utils = inject(UtilsService);

  mermaidVersion = '11.6.0'; // This should be dynamic in the future

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
    document.body.classList.toggle('dark-theme');
    // Would also update Mermaid theme accordingly
    const config = JSON.parse(this.diagramState.currentState.mermaid);
    config.theme = document.body.classList.contains('dark-theme') ? 'dark' : 'default';
    this.diagramState.updateConfig(JSON.stringify(config, null, 2));
  }

  exportDiagram(format: 'svg' | 'png'): void {
    // In the future, this would use a proper service
    alert(`Export as ${format.toUpperCase()} feature will be available soon`);
  }
}
