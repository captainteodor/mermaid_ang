import { Component, inject, signal, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiagramStateService } from '../../services/diagram-state.service';
import { UtilsService } from '../../services/utils.service';

interface DialogCloseOptions {
  refresh?: boolean;
}

// Custom notification service to replace MatSnackBar
export class NotificationService {
  showNotification(message: string, action: string = 'OK', duration: number = 3000): void {
    const notification = document.createElement('div');
    notification.className = 'notification-toast';

    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    notification.appendChild(messageSpan);

    const actionButton = document.createElement('button');
    actionButton.textContent = action;
    actionButton.className = 'notification-action';
    actionButton.onclick = () => document.body.removeChild(notification);
    notification.appendChild(actionButton);

    document.body.appendChild(notification);

    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, duration);
  }
}

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './export-dialog.component.html',
  styleUrl: './export-dialog.component.scss',
  providers: [NotificationService]
})
export class ExportDialogComponent {
  @Output() closeDialog = new EventEmitter<DialogCloseOptions>();

  private diagramState = inject(DiagramStateService);
  private utils = inject(UtilsService);
  private notificationService = inject(NotificationService);

  // Active tab tracking
  activeTab = 'png'; // Default tab

  // PNG export settings
  pngSettings = signal({
    scale: 2,
    transparentBackground: false,
    width: 1000,
    height: 0, // 0 means auto (calculated from width and diagram aspect ratio)
    fileName: 'mermaid-diagram.png'
  });

  // SVG export settings
  svgSettings = signal({
    includeFonts: true,
    fileName: 'mermaid-diagram.svg'
  });

  // URL export settings
  urlSettings = signal({
    includeState: true,
    includeTheme: true
  });

  // Change active tab
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Close dialog method to replace dialogRef.close()
  close(options?: DialogCloseOptions): void {
    this.closeDialog.emit(options || {});
  }

  // This would be implemented in a real application to generate PNG
  exportAsPng(): void {
    // In a real implementation, this would use a service to generate PNG
    this.notificationService.showNotification('PNG export feature coming soon!');
    this.close();
  }

  // This would be implemented in a real application to generate SVG
  exportAsSvg(): void {
    // In a real implementation, this would use a service to generate SVG
    this.notificationService.showNotification('SVG export feature coming soon!');
    this.close();
  }

  // Share URL implementation
  shareUrl(): void {
    const state = this.diagramState.currentState;
    const serialized = this.utils.serializeState(state);

    const url = `${window.location.origin}${window.location.pathname}#${serialized}`;
    this.utils.copyToClipboard(url).then(() => {
      this.notificationService.showNotification('URL copied to clipboard!');
      this.close();
    }).catch(err => {
      console.error('Could not copy text: ', err);
      this.notificationService.showNotification('Failed to copy URL');
    });
  }

  formatScale(value: number): string {
    return `${value}x`;
  }
}
