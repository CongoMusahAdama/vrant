import { API_BASE } from '@/lib/api';

export async function apiFormFetch<T>(
  path: string,
  formData: FormData,
  options: { method?: string; token?: string | null } = {}
): Promise<T> {
  const { method = 'POST', token } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data.message || data.errors?.[0]?.msg || 'Something went wrong';
    throw new Error(message);
  }
  return data as T;
}

export const ADMIN_INPUT =
  'w-full border border-black/20 bg-white px-4 py-3 min-h-[48px] text-[10px] font-bold uppercase tracking-wider text-black placeholder:text-black/30';

export const ADMIN_LABEL =
  'block text-[8px] font-bold tracking-[0.15em] uppercase text-black/40 mb-1';

export const ADMIN_BTN =
  'inline-flex items-center justify-center border border-black bg-black text-white px-6 py-3.5 min-h-[48px] text-[10px] font-bold tracking-[0.2em] uppercase hover:opacity-90 transition-opacity disabled:opacity-40';

export const ADMIN_BTN_OUTLINE =
  'inline-flex items-center justify-center border border-black/20 px-4 py-2.5 min-h-[44px] text-[9px] font-bold tracking-[0.12em] uppercase hover:border-black/40 transition-colors';
