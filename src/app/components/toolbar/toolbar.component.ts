import { Component, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramStateService } from '../../services/diagram-state.service';
import { UtilsService } from '../../services/utils.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
  ]
})
export class ToolbarComponent {
  @Output() themeToggled = new EventEmitter<boolean>();

  private diagramState = inject(DiagramStateService);
  private utils = inject(UtilsService);

  mermaidVersion = '11.6.0'; // Example version
  isDarkTheme = false;
  isExportMenuOpen = false; // State for custom dropdown

  shareDiagram(): void {
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

  saveToAccount(): void {
    alert('Save to account feature will be available in the future');
  }

  openSampleDiagrams(): void {
    alert('Sample diagrams feature will be available soon');
  }

  openDocumentation(): void {
    window.open('https://mermaid.js.org/intro/', '_blank');
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    this.themeToggled.emit(this.isDarkTheme);
    // Assuming DiagramStateService and updateConfig are independent of Material
    try {
        const config = JSON.parse(this.diagramState.currentState.mermaid);
        config.theme = this.isDarkTheme ? 'dark' : 'default';
        this.diagramState.updateConfig(JSON.stringify(config, null, 2));
    } catch (e) {
        console.error("Error parsing or updating mermaid config:", e)
    }
  }

  // Method to toggle custom dropdown
  toggleExportMenu(): void {
    this.isExportMenuOpen = !this.isExportMenuOpen;
  }

  exportDiagram(format: 'svg' | 'png'): void {
    this.isExportMenuOpen = false; // Close menu after selection
    try {
      // Query for the SVG element
      const svgElementGeneric = document.querySelector('.diagram-content svg'); // Type is Element | null

      // **FIX:** Check if the element exists AND is an SVGSVGElement
      if (!(svgElementGeneric instanceof SVGSVGElement)) {
        // Handle cases where the element is not found or is not an SVG
        if (!svgElementGeneric) {
            throw new Error('No SVG element found with selector ".diagram-content svg" to export');
        } else {
            throw new Error('The found element is not an SVG element.');
        }
      }

      // **FIX:** Now TypeScript knows svgElement is an SVGSVGElement here
      const svgElement: SVGSVGElement = svgElementGeneric;

      if (format === 'svg') {
        // Export as SVG - Use the correctly typed svgElement
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        this.downloadBlob(blob, 'diagram.svg');

      } else if (format === 'png') {
        // Export as PNG
        const canvas = document.createElement('canvas');
        // Use the correctly typed svgElement
        const svgRect = svgElement.getBoundingClientRect();
        const scale = 2; // Keep scaling for better resolution
        canvas.width = svgRect.width * scale;
        canvas.height = svgRect.height * scale;

        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Could not create canvas context');
        }
        context.scale(scale, scale);

        const image = new Image();
        image.onload = () => {
          context.drawImage(image, 0, 0);
          canvas.toBlob(blob => {
            if (blob) {
              this.downloadBlob(blob, 'diagram.png');
            } else {
              throw new Error('Failed to create PNG blob');
            }
          });
        };
        image.onerror = (e) => {
           console.error("Image loading error for PNG export:", e); // Log the error object
           throw new Error('Image loading failed for PNG export. Check console for details.');
        }

        // Use the correctly typed svgElement with the helper function
        const styledSvgData = this.embedSvgStyles(svgElement); // Pass SVGSVGElement
        const base64Svg = btoa(unescape(encodeURIComponent(styledSvgData)));
        image.src = 'data:image/svg+xml;base64,' + base64Svg;
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Failed to export diagram: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Keep the embedSvgStyles function as is, it expects SVGSVGElement
  private embedSvgStyles(svgElement: SVGSVGElement): string {
       const clonedSvgElement = svgElement.cloneNode(true) as SVGSVGElement; // Clone to avoid modifying the original DOM
       const styleDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
       const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");

       let cssText = "";
       // Iterate through stylesheets safely
       for (let i = 0; i < document.styleSheets.length; i++) {
           try {
               const sheet = document.styleSheets[i];
               if (!sheet.href || sheet.href.startsWith(window.location.origin)) { // Avoid cross-origin issues
                   if (sheet.cssRules) {
                       for (let j = 0; j < sheet.cssRules.length; j++) {
                          // Add relevant rules (example: targeting SVG elements or common diagram classes)
                          const ruleText = sheet.cssRules[j].cssText;
                          if (ruleText.includes('svg') || ruleText.includes('.node') || ruleText.includes('.edge') || ruleText.includes('path') || ruleText.includes('rect') || ruleText.includes('text')) {
                               cssText += ruleText + "\n";
                          }
                       }
                   }
               }
           } catch (e: any) {
                // Log CORS or other access errors without stopping the process
                if (e.name !== 'SecurityError') {
                   console.warn("Could not read CSS rules from stylesheet:", document.styleSheets[i].href, e);
                }
           }
       }

       styleElement.setAttribute('type', 'text/css');
       styleElement.textContent = cssText;
       styleDefs.appendChild(styleElement);
       // Prepend defs to the cloned element
       clonedSvgElement.insertBefore(styleDefs, clonedSvgElement.firstChild);

       // Serialize the modified clone
       const svgData = new XMLSerializer().serializeToString(clonedSvgElement);

       return svgData;
  }

 // downloadBlob remains the same
 private downloadBlob(blob: Blob, filename: string): void {
   // ... (implementation is unchanged)
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = filename;
   document.body.appendChild(a);
   a.click();
   document.body.removeChild(a);
   URL.revokeObjectURL(url);
 }

 // Other methods like shareDiagram, saveToAccount etc. remain the same...
}
