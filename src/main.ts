import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

// Import all required browser providers explicitly
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient } from '@angular/common/http';

// Services
import { DiagramStateService } from './app/services/diagram-state.service';
import { UtilsService } from './app/services/utils.service';
import { LocalStorageService } from './app/services/local-storage.service';

bootstrapApplication(AppComponent, {
  providers: [
    // Core platform providers
    provideAnimations(),
    provideRouter(routes),
    provideHttpClient(),

    // Services
    DiagramStateService,
    UtilsService,
    LocalStorageService
  ]
}).catch(err => console.error('Error bootstrapping app:', err));
