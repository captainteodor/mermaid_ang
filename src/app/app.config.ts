import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

export const appConfig: ApplicationConfig = {
  providers: [
    // Routing with modern features
    provideRouter(
      routes,
      withViewTransitions(),
      withComponentInputBinding()
    ),

    // Core providers
    provideClientHydration(),
    provideAnimations(),
    provideHttpClient(withFetch()),

    // PWA Support
    provideServiceWorker('ngsw-worker.js', {
      enabled: false, // Set to true for production
      registrationStrategy: 'registerWhenStable:30000'
    }),

    // Material Modules
    importProvidersFrom(
      MatDialogModule,
      MatSnackBarModule,
      MatToolbarModule,
      MatIconModule,
      MatButtonModule,
      MatMenuModule,
      MatDividerModule,
      MatTooltipModule,
      FormsModule,
      ReactiveFormsModule
    ),

    // Material Configuration
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' }
    }
  ]
};
