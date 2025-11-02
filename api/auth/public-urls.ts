import { env } from '../env/env.js';

function parseUrl(value?: string | null): URL | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value);
  } catch (error) {
    console.error('Invalid URL configured:', value, error);
    return undefined;
  }
}

function sanitizeRelativePath(path: string): string | undefined {
  if (!path) {
    return '/';
  }

  const trimmed = path.trim();
  if (!trimmed) {
    return '/';
  }

  const lowerTrimmed = trimmed.toLowerCase();
  if (lowerTrimmed.startsWith('http://') || lowerTrimmed.startsWith('https://')) {
    return undefined;
  }

  const withoutLeadingSlashes = trimmed.replace(/^\/+/, '');
  return `/${withoutLeadingSlashes}`;
}

const redirectUri = parseUrl(env.REDIRECT_URI ?? undefined);
export const applicationOrigin = redirectUri?.origin;

const explicitLogoutRedirect = parseUrl(env.LOGOUT_REDIRECT_URI ?? undefined);
const fallbackLogoutRedirect = applicationOrigin
  ? parseUrl(applicationOrigin)
  : undefined;

const logoutTarget = explicitLogoutRedirect ?? fallbackLogoutRedirect;
export const logoutRedirectUri = logoutTarget?.toString();

export function buildApplicationUrl(path: string): URL | undefined {
  if (!applicationOrigin) {
    return undefined;
  }

  const sanitizedPath = sanitizeRelativePath(path);
  if (!sanitizedPath) {
    return undefined;
  }

  try {
    return new URL(sanitizedPath, applicationOrigin);
  } catch (error) {
    console.error('Failed to build application URL from path:', path, error);
    return undefined;
  }
}
