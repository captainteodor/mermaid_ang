import { Component } from '@angular/core';
import { WorkspaceComponent } from './components/workspace/workspace.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    WorkspaceComponent
  ]
})
export class AppComponent {
  title = 'Mermaid Editor';
}
