import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { DiagramStateService } from '../../services/diagram-state.service';
import { UtilsService } from '../../services/utils.service';

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatTabsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSliderModule,
    MatCheckboxModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './export-dialog.component.html',
  styleUrl: './export-dialog.component.scss'
})
export class ExportDialogComponent {
  private diagramState = inject(DiagramStateService);
  private utils = inject(UtilsService);
  private dialogRef = inject(MatDialogRef<ExportDialogComponent>);
  private snackBar = inject(MatSnackBar);

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

  // This would be implemented in a real application to generate PNG
  exportAsPng(): void {
    // In a real implementation, this would use a service to generate PNG
    this.snackBar.open('PNG export feature coming soon!', 'OK', {
      duration: 3000
    });
    this.dialogRef.close();
  }

  // This would be implemented in a real application to generate SVG
  exportAsSvg(): void {
    // In a real implementation, this would use a service to generate SVG
    this.snackBar.open('SVG export feature coming soon!', 'OK', {
      duration: 3000
    });
    this.dialogRef.close();
  }

  // Share URL implementation
  shareUrl(): void {
    const state = this.diagramState.currentState;
    const serialized = this.utils.serializeState(state);

    const url = `${window.location.origin}${window.location.pathname}#${serialized}`;
    this.utils.copyToClipboard(url).then(() => {
      this.snackBar.open('URL copied to clipboard!', 'OK', {
        duration: 3000
      });
      this.dialogRef.close();
    }).catch(err => {
      console.error('Could not copy text: ', err);
      this.snackBar.open('Failed to copy URL', 'OK', {
        duration: 3000
      });
    });
  }

  formatScale(value: number): string {
    return `${value}x`;
  }
}
