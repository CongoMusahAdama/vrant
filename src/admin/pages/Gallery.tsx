import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import AdminPageHeader from '../components/ui/AdminPageHeader';
import AdminPanel from '../components/ui/AdminPanel';
import AdminSingleImagePicker from '../components/ui/AdminSingleImagePicker';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminConfirm } from '@/admin/contexts/AdminConfirmContext';
import { apiFetch } from '@/lib/api';
import { isLegacyLocalUpload, productImageUrl } from '@/lib/productImage';
import { apiFormFetch, ADMIN_INPUT, ADMIN_LABEL, ADMIN_BTN, ADMIN_BTN_OUTLINE } from '../lib/apiForm';
import AdminPagination from '../components/ui/AdminPagination';
import type { GalleryItem } from '../types/admin';

const CATEGORIES = ['lookbook', 'sets', 'shirts', 'jeans', 'footwear', 'accessories'] as const;
const PAGE_SIZE = 12;

const emptyForm = { name: '', caption: '', category: 'lookbook' };

const GalleryContent = () => {
  const { token } = useAuth();
  const { confirm } = useAdminConfirm();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const resetImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const resetForm = () => {
    setForm(emptyForm);
    resetImage();
    setError('');
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; data: { items: GalleryItem[] } }>(
        '/api/gallery'
      );
      setItems(res.data.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [items.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !imageFile || !form.name.trim()) {
      setError('Name and image are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('caption', form.caption.trim());
      fd.append('category', form.category);
      fd.append('image', imageFile);

      await apiFormFetch('/api/gallery', fd, { token });
      resetForm();
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!token) return;
    const ok = await confirm({
      title: 'Remove gallery image?',
      message: `"${name}" will be removed from the public gallery. This cannot be undone.`,
      confirmLabel: 'Remove',
      cancelLabel: 'Keep image',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await apiFetch(`/api/gallery/${id}`, { method: 'DELETE', token });
      load();
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Site gallery"
        description="Upload photos for the public Gallery page — lookbook and product shots."
      >
        <button
          type="button"
          onClick={() => {
            if (showForm) resetForm();
            setShowForm((v) => !v);
          }}
          className={ADMIN_BTN_OUTLINE}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          {showForm ? 'Cancel' : 'Add image'}
        </button>
      </AdminPageHeader>

      {showForm && (
        <AdminPanel title="New gallery image">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            {error && (
              <p className="text-[9px] font-bold uppercase text-red-700 bg-red-50 border border-red-200 px-3 py-2">
                {error}
              </p>
            )}
            <label className="block">
              <span className={ADMIN_LABEL}>Title *</span>
              <input
                className={ADMIN_INPUT}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </label>

            <AdminSingleImagePicker
              file={imageFile}
              preview={imagePreview}
              onChange={(file, preview) => {
                setImageFile(file);
                setImagePreview(preview);
              }}
              label="Image *"
              hint="Preview your photo before publishing."
              required
            />

            <label className="block">
              <span className={ADMIN_LABEL}>Caption</span>
              <input
                className={ADMIN_INPUT}
                value={form.caption}
                onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className={ADMIN_LABEL}>Category</span>
              <select
                className={ADMIN_INPUT}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={saving} className={ADMIN_BTN}>
              {saving ? 'Uploading…' : 'Publish to gallery'}
            </button>
          </form>
        </AdminPanel>
      )}

      {loading ? (
        <div className="py-12 text-center border border-black/10">
          <p className="text-[10px] font-bold uppercase text-black/40 animate-pulse">Loading…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-black/20 p-8 text-center">
          <p className="text-[11px] font-bold uppercase text-black/50">Gallery is empty</p>
          <p className="text-[10px] font-bold text-black/40 mt-2 uppercase">
            Add your first image above
          </p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items
            .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
            .map((item) => (
            <article key={item._id} className="border border-black/10 bg-white group relative">
              <img
                src={productImageUrl(item.image)}
                alt={item.name}
                className="w-full aspect-[4/5] object-cover"
              />
              <div className="p-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-black line-clamp-1">
                  {item.name}
                </p>
                <p className="text-[8px] font-bold uppercase text-black/40 mt-0.5">
                  {item.category}
                </p>
                {isLegacyLocalUpload(item.image) && (
                  <p className="text-[8px] font-bold uppercase text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 mt-2">
                    Image missing — delete and re-upload
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item._id, item.name)}
                className="absolute top-2 right-2 min-h-[36px] min-w-[36px] flex items-center justify-center bg-white/95 border border-black/10 text-red-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                aria-label="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </article>
          ))}
        </div>
        <AdminPagination
          page={page}
          totalPages={Math.max(1, Math.ceil(items.length / PAGE_SIZE))}
          total={items.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          itemLabel="images"
        />
        </>
      )}
    </>
  );
};

const AdminGallery = () => (
  <AdminLayout>
    <GalleryContent />
  </AdminLayout>
);

export default AdminGallery;
