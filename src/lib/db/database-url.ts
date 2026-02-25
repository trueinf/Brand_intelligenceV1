/**
 * Use process.env.DATABASE_URL only. No hardcoded DB URLs.
 * On Netlify, throws if DATABASE_URL is missing or points to localhost.
 */

function isNetlify(): boolean {
  return process.env.NETLIFY === "true";
}

function isLocalhostUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

/**
 * Returns DATABASE_URL. Throws if:
 * - DATABASE_URL is not set
 * - On Netlify: DATABASE_URL contains localhost or 127.0.0.1
 */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url || url.trim() === "") {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env for local development, or set it in Netlify environment variables for production."
    );
  }
  if (isNetlify() && isLocalhostUrl(url)) {
    throw new Error(
      "DATABASE_URL must not point to localhost or 127.0.0.1 in production. Use a hosted PostgreSQL (e.g. Neon) and set DATABASE_URL in Netlify."
    );
  }
  return url;
}
