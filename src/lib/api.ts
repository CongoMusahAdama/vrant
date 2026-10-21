const envApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/$/, '');

/**
 * The API runs on the same Vercel domain as the site (/api), so requests are same-origin.
 * VITE_API_URL is only needed to point at an API somewhere else.
 * Development: empty → same origin, and Vite proxies /api to localhost:5000.
 */
export const API_BASE =
  envApiUrl && envApiUrl.length > 0
    ? envApiUrl
    : typeof window !== 'undefined'
      ? ''
      : 'http://localhost:5000';

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
