import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { CommonModule } from '@angular/common';

// Import Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ClipboardModule } from '@angular/cdk/clipboard';

// Import Components
import { AppComponent } from './app.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { EditorComponent } from './components/editor/editor.component';
import { DiagramComponent } from './components/diagram/diagram.component';
import { SimpleDiagramEditorComponent } from './components/simple-diagram-editor/simple-diagram-editor.component';
import { WorkspaceComponent } from './components/workspace/workspace.component';

// Import Routes
import { routes } from './app.routes';

// Import Services
import { DiagramStateService } from './services/diagram-state.service';
import { UtilsService } from './services/utils.service';
import { LocalStorageService } from './services/local-storage.service';

@NgModule({
  declarations: [
    // Include all components in declarations - now they're all non-standalone
    AppComponent,
    ToolbarComponent,
    EditorComponent,
    DiagramComponent,
    SimpleDiagramEditorComponent,
    WorkspaceComponent  // Added WorkspaceComponent to declarations
  ],
  imports: [
    // Core Angular Modules
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forRoot(routes),

    // Material Modules
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTabsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSliderModule,
    MatCheckboxModule,
    MatButtonToggleModule,
    ClipboardModule,

    // PWA Support
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: false, // Set to true for production
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [
    DiagramStateService,
    UtilsService,
    LocalStorageService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
