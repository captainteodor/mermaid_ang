import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';




import { provideHttpClient } from '@angular/common/http';
import { DiagramStateService } from './services/diagram-state.service';
import { UtilsService } from './services/utils.service';
import { LocalStorageService } from './services/local-storage.service';
import { ServiceWorkerModule } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [

    provideRouter(routes),


    provideAnimations(),





    provideHttpClient(),
    // Import providers from modules if needed
    importProvidersFrom(
      ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: false, // Set to true for production
        registrationStrategy: 'registerWhenStable:30000'
      })
    ),


    // Services
    DiagramStateService,
    UtilsService,
    LocalStorageService
  ]
};
