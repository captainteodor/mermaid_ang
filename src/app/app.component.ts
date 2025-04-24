import { Component } from '@angular/core';
import { WorkspaceComponent } from './components/workspace/workspace.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    WorkspaceComponent,
    ToolbarComponent
  ]
})
export class AppComponent {
  title = 'Mermaid Editor';
}
