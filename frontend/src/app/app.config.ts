import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { OAuthModule } from 'angular-oauth2-oidc';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './auth/auth.interceptor';
import { importProvidersFrom } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    importProvidersFrom(OAuthModule.forRoot()), // ← indispensable
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
   
    
  ]
};