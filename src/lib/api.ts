/**
 * The API is served by the same Vercel deployment as the site (/api), so requests are same-origin.
 * In development Vite proxies /api to localhost:5000. Outside the browser, fall back to the local API.
 */
export const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:5000';

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
