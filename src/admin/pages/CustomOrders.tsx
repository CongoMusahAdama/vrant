import { useCallback, useEffect, useState } from 'react';
import { Mail, MessageCircle, Phone, Trash2 } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import AdminPageHeader from '../components/ui/AdminPageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { ADMIN_BTN_OUTLINE, ADMIN_LABEL } from '../lib/apiForm';
import { formatShortDate } from '../lib/format';
import { productImageUrl } from '../lib/productImage';
import { sweetError, sweetSuccess } from '@/lib/sweet-alert';
import {
  CUSTOM_STATUS_OPTIONS,
  garmentLabel,
  statusLabel,
  type CustomRequest,
  type CustomStatus,
} from '@/lib/custom-design';
import { cn } from '@/lib/utils';

const STATUS_STYLE: Record<CustomStatus, string> = {
  new: 'bg-army-green text-white border-army-green',
  reviewing: 'bg-[#f3efe6] text-[#6b5c45] border-[#ddd4c4]',
  quoted: 'bg-[#e8edf2] text-[#4a5f6e] border-[#cdd6de]',
  in_progress: 'bg-[#ebe8f0] text-[#5c5470] border-[#d4cede]',
  completed: 'bg-[#e8efe9] text-[#4a5f4f] border-[#cdd8cf]',
  declined: 'bg-[#f0e8e8] text-[#6b4f4f] border-[#ddd0d0]',
};

/** Ghana numbers like 024… → 23324… for wa.me links */
const waNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('0') ? `233${digits.slice(1)}` : digits;
};

const CustomOrders = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<CustomRequest[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<'all' | CustomStatus>('all');
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const qs = filter === 'all' ? '' : `?status=${filter}`;
      const res = await apiFetch<{
        data: { items: CustomRequest[]; counts: Record<string, number> };
      }>(`/api/custom-requests${qs}`, { token });
      setItems(res.data.items);
      setCounts(res.data.counts);
      setNotes(Object.fromEntries(res.data.items.map((i) => [i._id, i.adminNotes || ''])));
    } catch (err) {
      sweetError('Could not load requests', err instanceof Error ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = async (id: string, body: Partial<Pick<CustomRequest, 'status' | 'adminNotes'>>) => {
    try {
      await apiFetch(`/api/custom-requests/${id}`, { method: 'PATCH', token, body: JSON.stringify(body) });
      if (body.adminNotes !== undefined) sweetSuccess('Notes saved');
      await load();
    } catch (err) {
      sweetError('Update failed', err instanceof Error ? err.message : undefined);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this request and its images? This cannot be undone.')) return;
    try {
      await apiFetch(`/api/custom-requests/${id}`, { method: 'DELETE', token });
      await load();
    } catch (err) {
      sweetError('Delete failed', err instanceof Error ? err.message : undefined);
    }
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Custom orders"
        description="Designs customers sent in to be made. Call them, quote a price and track progress."
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {[{ value: 'all' as const, label: 'All' }, ...CUSTOM_STATUS_OPTIONS].map((o) => {
          const n = o.value === 'all' ? total : counts[o.value] || 0;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => setFilter(o.value)}
              className={cn(
                'min-h-[40px] px-3 text-[9px] font-bold tracking-[0.12em] uppercase border transition-colors',
                filter === o.value ? 'bg-black text-white border-black' : 'bg-white text-black/60 border-black/15 hover:border-black/40'
              )}
            >
              {o.label} <span className="opacity-60">({n})</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-[10px] font-bold uppercase text-black/40 animate-pulse">Loading…</p>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-black/15 px-6 py-14 text-center">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-black/50">No custom requests yet</p>
          <p className="text-[9px] font-bold tracking-[0.08em] uppercase text-black/35 mt-2">
            They appear here when customers submit the “Bring your own design” form.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((r) => (
            <article key={r._id} className="border border-black/10 bg-white">
              <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-black/10 bg-black/[0.02]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn('px-2 py-0.5 text-[8px] font-bold tracking-[0.12em] uppercase border', STATUS_STYLE[r.status])}>
                    {statusLabel(r.status)}
                  </span>
                  <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-black">{garmentLabel(r.garmentType)}</span>
                  <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-black/40">
                    {r.reference} · {formatShortDate(r.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={r.status}
                    onChange={(e) => update(r._id, { status: e.target.value as CustomStatus })}
                    aria-label="Change status"
                    className="h-9 border border-black/20 bg-white px-2 text-[9px] font-bold tracking-[0.1em] uppercase"
                  >
                    {CUSTOM_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => remove(r._id)}
                    className="h-9 w-9 flex items-center justify-center border border-black/15 text-black/50 hover:text-red-700 hover:border-red-300"
                    aria-label="Delete request"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </header>

              <div className="grid lg:grid-cols-[1fr_280px] gap-5 p-4 sm:p-5">
                <div className="space-y-4 min-w-0">
                  <p className="text-[11px] leading-relaxed text-black whitespace-pre-line normal-case tracking-normal font-normal">
                    {r.description}
                  </p>

                  {r.images.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {r.images.map((src, i) => (
                        <a key={src} href={productImageUrl(src)} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 border border-black/10 overflow-hidden bg-[#f2f2f2]">
                          <img src={productImageUrl(src)} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}

                  <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      ['Size', r.sizing],
                      ['Fabric', r.fabricPreference],
                      ['Budget', r.budget],
                      ['Needed by', r.neededBy ? formatShortDate(r.neededBy) : ''],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className={ADMIN_LABEL}>{k}</dt>
                        <dd className="text-[10px] font-bold uppercase text-black">{v || '—'}</dd>
                      </div>
                    ))}
                  </dl>

                  <div>
                    <label className={ADMIN_LABEL} htmlFor={`notes-${r._id}`}>Private notes</label>
                    <textarea
                      id={`notes-${r._id}`}
                      value={notes[r._id] ?? ''}
                      onChange={(e) => setNotes((n) => ({ ...n, [r._id]: e.target.value }))}
                      rows={2}
                      placeholder="Price quoted, fabric sourced, fitting date…"
                      className="w-full border border-black/15 px-3 py-2 text-[11px] normal-case tracking-normal font-normal outline-none focus:border-black"
                    />
                    {(notes[r._id] ?? '') !== (r.adminNotes || '') && (
                      <button type="button" onClick={() => update(r._id, { adminNotes: notes[r._id] })} className={cn(ADMIN_BTN_OUTLINE, 'mt-2')}>
                        Save notes
                      </button>
                    )}
                  </div>
                </div>

                <aside className="border border-black/10 p-4 h-fit space-y-3">
                  <p className={ADMIN_LABEL}>Customer</p>
                  <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-black">{r.name}</p>
                  <div className="flex flex-col gap-2">
                    <a href={`tel:${r.phone.replace(/\s/g, '')}`} className={cn(ADMIN_BTN_OUTLINE, 'justify-start gap-2')}>
                      <Phone className="w-3.5 h-3.5" /> {r.phone}
                    </a>
                    <a
                      href={`https://wa.me/${waNumber(r.phone)}?text=${encodeURIComponent(`Hello ${r.name}, this is VRANT about your custom design (${r.reference}).`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(ADMIN_BTN_OUTLINE, 'justify-start gap-2')}
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                    {r.email && (
                      <a href={`mailto:${r.email}?subject=${encodeURIComponent(`Your VRANT custom design (${r.reference})`)}`} className={cn(ADMIN_BTN_OUTLINE, 'justify-start gap-2 normal-case')}>
                        <Mail className="w-3.5 h-3.5" /> {r.email}
                      </a>
                    )}
                  </div>
                </aside>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default CustomOrders;
