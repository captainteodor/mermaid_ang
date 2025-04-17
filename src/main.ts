import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { AppModule } from './app/app.module';

// Check if we're in production mode
const isProduction = false; // Set to true for production builds

if (isProduction) {
  enableProdMode();
}

// Bootstrap the application using the NgModule approach
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => {
    console.error('Error bootstrapping application:', err);

    // You can add additional error reporting here, like sending to a monitoring service
    // if you have one set up
  });

// Handle unhandled promise rejections for better debugging
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Log application startup
console.log('Mermaid Editor Application starting...');
