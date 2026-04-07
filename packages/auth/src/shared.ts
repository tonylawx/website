export const DEFAULT_AUTH_APP_URL = "https://auth.tonylaw.cc";
export const DEFAULT_COOKIE_DOMAIN = ".tonylaw.cc";

export function isProductionAuth() {
  return process.env.NODE_ENV === "production";
}

export function getAuthAppUrl() {
  const fallback = isProductionAuth() ? DEFAULT_AUTH_APP_URL : "http://localhost:3003";
  return (process.env.AUTH_APP_URL ?? fallback).replace(/\/$/, "");
}

export function getAuthApiUrl() {
  const fallback = isProductionAuth() ? "https://api.tonylaw.cc/auth" : "http://localhost:3001/auth";
  return (process.env.AUTH_API_URL ?? fallback).replace(/\/$/, "");
}

export function getAuthCookieDomain() {
  return process.env.AUTH_COOKIE_DOMAIN ?? DEFAULT_COOKIE_DOMAIN;
}

export function getSessionCookieName() {
  return isProductionAuth() ? "__Secure-tonylaw.session-token" : "tonylaw.session-token";
}

export function buildSignInUrl(callbackUrl: string) {
  const signInUrl = new URL("/signin", getAuthAppUrl());
  signInUrl.searchParams.set("callbackUrl", callbackUrl);
  return signInUrl;
}
