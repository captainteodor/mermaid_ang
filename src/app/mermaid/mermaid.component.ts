import { afterNextRender, Component } from "@angular/core";
import mermaid from "mermaid";

@Component({
    selector: 'app-mermaid',
    imports: [],
    templateUrl: './mermaid.component.html',
    styleUrl: './mermaid.component.css'
})
export class MermaidComponent {
  constructor() {
    afterNextRender({
      read: () => {
        void mermaid.init()
      }
    })
  }
}
