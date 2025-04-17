import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

export const appConfig: ApplicationConfig = {
  providers: [
    // Routing with modern features
    provideRouter(
      routes,
      withViewTransitions(),
      withComponentInputBinding()
    ),

    // SSR Support
    provideClientHydration(),

    // Angular Core
    provideAnimations(),
    provideHttpClient(withFetch()),

    // PWA Support
    provideServiceWorker('ngsw-worker.js', {
      enabled: false, // Set to false for development
      registrationStrategy: 'registerWhenStable:30000'
    }),

    // Angular Material and Forms
    importProvidersFrom(
      MatDialogModule,
      MatSnackBarModule,
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
