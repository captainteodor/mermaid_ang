// app.routes.ts

import { Routes } from '@angular/router';
import { SimpleDiagramEditorComponent } from './components/simple-diagram-editor/simple-diagram-editor.component';

export const routes: Routes = [
  {
    path: '',
    component: SimpleDiagramEditorComponent
  },
  {
    path: ':mode',  // 'code' or 'config'
    component: SimpleDiagramEditorComponent
  }
];
