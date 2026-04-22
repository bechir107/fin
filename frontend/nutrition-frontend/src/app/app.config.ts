import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth/auth.interceptor';


import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideOAuthClient()
    
  ]
};
