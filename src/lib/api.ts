const envApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/$/, '');

/**
 * Production (Vercel): VITE_API_URL must point at the Render API.
 * Development: empty → same origin, and Vite proxies /api to localhost:5000.
 */
export const API_BASE =
  envApiUrl && envApiUrl.length > 0
    ? envApiUrl
    : typeof window !== 'undefined'
      ? ''
      : 'http://localhost:5000';

if (import.meta.env.PROD && !envApiUrl) {
  console.error(
    '[VRANT] VITE_API_URL is not set — API calls will fail. Add it in Vercel → Project → Settings → Environment Variables, then redeploy.'
  );
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data.message || data.errors?.[0]?.msg || 'Something went wrong';
    throw new Error(message);
  }
  return data as T;
}
