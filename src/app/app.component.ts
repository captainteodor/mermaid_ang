import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { WorkspaceComponent } from './components/workspace/workspace.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    MatToolbarModule,
    WorkspaceComponent
  ]
})
export class AppComponent {
  title = 'Mermaid Editor';
}
