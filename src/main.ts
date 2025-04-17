import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ServiceWorkerModule } from '@angular/service-worker';

const extendedConfig = {
  ...appConfig,
  providers: [
    ...appConfig.providers || [],
    provideAnimations(),
    importProvidersFrom(
      MatDialogModule,
      MatSnackBarModule,
      FormsModule,
      ReactiveFormsModule,
      ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: true,
        registrationStrategy: 'registerWhenStable:30000'
      })
    )
  ]
};

bootstrapApplication(AppComponent, extendedConfig)
  .catch((err) => console.error(err));
