import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// Import service providers
import { DiagramStateService } from './services/diagram-state.service';
import { UtilsService } from './services/utils.service';
import { LocalStorageService } from './services/local-storage.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // Your services
    DiagramStateService,
    UtilsService,
    LocalStorageService
  ]
};
