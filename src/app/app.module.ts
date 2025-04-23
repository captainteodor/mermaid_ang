import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { WorkspaceComponent } from './components/workspace/workspace.component';
import { EditorComponent } from './components/editor/editor.component';
import { DiagramComponent } from './components/diagram/diagram.component';

// Services
import { DiagramStateService } from './services/diagram-state.service';
import { UtilsService } from './services/utils.service';
import { LocalStorageService } from './services/local-storage.service';
import { MonacoLoaderService } from './services/monaco-loader.service';

@NgModule({
  declarations: [
    // If using standalone components, remove these and add to imports instead
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot([]),

    // For standalone components
    WorkspaceComponent,
    EditorComponent,
    DiagramComponent
  ],
  providers: [
    DiagramStateService,
    UtilsService,
    LocalStorageService,
    MonacoLoaderService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
