import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { apiFetch } from '@/lib/api';
import { useAdminConfirm } from '@/admin/contexts/AdminConfirmContext';
import { ADMIN_INPUT, ADMIN_LABEL } from '@/admin/lib/apiForm';
import { cn } from '@/lib/utils';

type AdminCategoryFieldProps = {
  value: string;
  onChange: (slug: string) => void;
};

const AdminCategoryField = ({ value, onChange }: AdminCategoryFieldProps) => {
  const { token } = useAuth();
  const { categories, refresh } = useCategories();
  const { confirm } = useAdminConfirm();
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!token || !newLabel.trim()) return;
    setAdding(true);
    setError('');
    try {
      const res = await apiFetch<{
        success: boolean;
        data: { category: { slug: string } };
      }>('/api/categories', {
        method: 'POST',
        token,
        body: JSON.stringify({ label: newLabel.trim() }),
      });
      await refresh();
      onChange(res.data.category.slug);
      setNewLabel('');
      window.dispatchEvent(new CustomEvent('vrant:categories-changed'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add category');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string, label: string) => {
    if (!token) return;
    const ok = await confirm({
      title: 'Remove category?',
      message: `"${label}" will be removed from the shop nav and filters. Products using it must be reassigned first.`,
      confirmLabel: 'Remove',
      cancelLabel: 'Keep',
      variant: 'danger',
    });
    if (!ok) return;

    setRemovingId(id);
    setError('');
    try {
      await apiFetch(`/api/categories/${id}`, { method: 'DELETE', token });
      await refresh();
      if (value && categories.find((c) => c._id === id)?.slug === value) {
        const next = categories.find((c) => c._id !== id);
        if (next) onChange(next.slug);
      }
      window.dispatchEvent(new CustomEvent('vrant:categories-changed'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove category');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block">
        <span className={ADMIN_LABEL}>Category *</span>
        <select
          className={ADMIN_INPUT}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {categories.length === 0 ? (
            <option value="">No categories — add one below</option>
          ) : (
            categories.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.label}
              </option>
            ))
          )}
        </select>
      </label>

      <div>
        <span className={ADMIN_LABEL}>Add category</span>
        <div className="flex gap-2">
          <input
            type="text"
            className={cn(ADMIN_INPUT, 'flex-1')}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. Long Sleeves"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleAdd();
              }
            }}
          />
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={adding || !newLabel.trim()}
            className="shrink-0 inline-flex items-center gap-1.5 border border-black px-4 py-2 min-h-[48px] text-[9px] font-bold tracking-[0.12em] uppercase hover:bg-black hover:text-white transition-colors disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c._id}
              className="inline-flex items-center gap-1.5 border border-black/15 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-black/70"
            >
              {c.label}
              <button
                type="button"
                onClick={() => void handleRemove(c._id, c.label)}
                disabled={removingId === c._id}
                className="p-0.5 hover:text-red-700 disabled:opacity-40"
                aria-label={`Remove ${c.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {error && (
        <p className="text-[9px] font-bold text-red-600 uppercase tracking-wider">{error}</p>
      )}
    </div>
  );
};

export default AdminCategoryField;
