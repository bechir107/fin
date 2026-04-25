import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  clientId: '722639722963-42jql8upidibj8rs86ktuobnnfha1pud.apps.googleusercontent.com',
  redirectUri: 'http://localhost:4200/callback', // ← valeur fixe, pas window.location
  scope: 'openid profile email',
  responseType: 'token id_token',
  strictDiscoveryDocumentValidation: false,
  requireHttps: false,
  showDebugInformation: true,
  useSilentRefresh: false,
  clearHashAfterLogin: true,
};