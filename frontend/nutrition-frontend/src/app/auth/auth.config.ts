import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  clientId: '123456789-abcdefghijklmnop.apps.googleusercontent.com',
  responseType: 'code',
  scope: 'openid profile email',
  strictDiscoveryDocumentValidation: false,
};