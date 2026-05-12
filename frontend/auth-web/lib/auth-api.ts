const DEFAULT_PRODUCTION_AUTH_API_ORIGIN = "https://api.tonylaw.cc";
const DEFAULT_DEVELOPMENT_AUTH_API_ORIGIN = "http://localhost:3001";

function getDefaultAuthApiUrl() {
  return process.env.NODE_ENV === "production"
    ? DEFAULT_PRODUCTION_AUTH_API_ORIGIN
    : DEFAULT_DEVELOPMENT_AUTH_API_ORIGIN;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function stripDuplicatedAbsoluteUrl(value: string) {
  const secondProtocolIndex = value.indexOf("http", 8);

  if (secondProtocolIndex === -1) {
    return value;
  }

  return value.slice(secondProtocolIndex);
}

export function getAuthApiBaseUrl() {
  const rawValue = (process.env.NEXT_PUBLIC_AUTH_API_URL ?? getDefaultAuthApiUrl()).trim();
  const dedupedValue = stripDuplicatedAbsoluteUrl(rawValue);
  const normalizedValue = trimTrailingSlash(dedupedValue);

  if (normalizedValue.endsWith("/auth")) {
    return normalizedValue;
  }

  return `${normalizedValue}/auth`;
}

export function buildAuthApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getAuthApiBaseUrl()}${normalizedPath}`;
}
