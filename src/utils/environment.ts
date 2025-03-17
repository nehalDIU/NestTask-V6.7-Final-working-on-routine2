/**
 * Environment detection and URL utilities
 */

// Production domain
export const PRODUCTION_URL = 'https://nesttask.vercel.app';

/**
 * Checks if the app is running in a production environment
 */
export function isProduction(): boolean {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname.includes('vercel.app') || 
         hostname === 'nesttask.vercel.app' ||
         !hostname.includes('localhost');
}

/**
 * Gets the base URL for the current environment
 */
export function getBaseUrl(): string {
  if (typeof window === 'undefined') return PRODUCTION_URL;
  
  return isProduction() 
    ? PRODUCTION_URL 
    : window.location.origin;
}

/**
 * Gets the appropriate URL for auth redirects
 */
export function getAuthRedirectUrl(path: string): string {
  const baseUrl = getBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
} 
