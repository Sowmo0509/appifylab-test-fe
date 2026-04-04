/** Backend base URL (same as axios). */
export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
}

/**
 * Turn stored paths like `/uploads/foo.jpg` into absolute URLs on the API host.
 * Already-absolute URLs are returned unchanged.
 */
export function resolveUploadUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const base = getApiBaseUrl();
  const p = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${p}`;
}
