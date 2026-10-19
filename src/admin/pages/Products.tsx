import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import AdminPageHeader from '../components/ui/AdminPageHeader';
import AdminPanel from '../components/ui/AdminPanel';
import AdminProductsTable from '../components/products/AdminProductsTable';
import AdminCategoryField from '../components/products/AdminCategoryField';
import AdminProductColorsField from '../components/products/AdminProductColorsField';
import AdminProductSizesField from '../components/products/AdminProductSizesField';
import { DEFAULT_PRODUCT_SIZES } from '@/lib/product-sizes';
import { useCategories } from '@/contexts/CategoriesContext';
import ProductImagePicker, {
  type ImageRole,
  type ProductImageEntry,
} from '../components/products/ProductImagePicker';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminConfirm } from '@/admin/contexts/AdminConfirmContext';
import { apiFetch } from '@/lib/api';
import { apiFormFetch, ADMIN_INPUT, ADMIN_LABEL, ADMIN_BTN, ADMIN_BTN_OUTLINE } from '../lib/apiForm';
import { sweetSuccessCenter } from '@/lib/sweet-alert';
import { productImageUrl } from '../lib/productImage';
import { formatMaxUploadSize, MAX_PRODUCT_IMAGES } from '@/lib/upload-limits';
import type { MongoProduct } from '../types/admin';
import AdminPagination from '../components/ui/AdminPagination';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

type FormState = {
  name: string;
  description: string;
  price: string;
  discount: string;
  category: string;
  stock: string;
  outOfStock: boolean;
  colors: string[];
  sizes: string[];
};

const emptyForm: FormState = {
  name: '',
  description: '',
  price: '',
  discount: '',
  category: '',
  stock: '1',
  outOfStock: false,
  colors: [],
  sizes: [...DEFAULT_PRODUCT_SIZES],
};

function discountFromProduct(product: MongoProduct) {
  if (!product.originalPrice || product.originalPrice <= product.price) return '';
  return String(
    Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
  );
}

function productToForm(product: MongoProduct): FormState {
  const soldOut = Boolean(product.soldOut || product.stock <= 0);
  return {
    name: product.name,
    description: product.description || '',
    price: String(product.price),
    discount: discountFromProduct(product),
    category: product.category,
    stock: soldOut ? '0' : String(product.stock),
    outOfStock: soldOut,
    colors: (product.colors || []).map((c) => c.name).filter(Boolean),
    sizes:
      (product.sizes || []).map((s) => s.name).filter(Boolean).length > 0
        ? (product.sizes || []).map((s) => s.name).filter(Boolean)
        : [...DEFAULT_PRODUCT_SIZES],
  };
}

type ProductsContentProps = {
  onProductCount: (count: number) => void;
};

const ProductsContent = ({ onProductCount }: ProductsContentProps) => {
  const { token } = useAuth();
  const { categories } = useCategories();
  const { confirm } = useAdminConfirm();
  const filterCats = ['all', ...categories.map((c) => c.slug)];
  const [products, setProducts] = useState<MongoProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [mode, setMode] = useState<'idle' | 'add' | 'edit'>('idle');
  const [editingProduct, setEditingProduct] = useState<MongoProduct | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [productImages, setProductImages] = useState<ProductImageEntry[]>([]);
  const [existingImageLabels, setExistingImageLabels] = useState({
    front: '',
    back: '',
    additional: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (category !== 'all') params.set('category', category);
      if (search.trim()) params.set('search', search.trim());

      const res = await apiFetch<{
        success: boolean;
        data: {
          products: MongoProduct[];
          pagination: { total: number; totalPages: number };
        };
      }>(`/api/admin/products?${params}`, { token });

      setProducts(res.data.products);
      setTotal(res.data.pagination.total);
      setTotalPages(res.data.pagination.totalPages);
      onProductCount(res.data.pagination.total);
    } catch {
      setProducts([]);
      setTotal(0);
      setTotalPages(1);
      onProductCount(0);
    } finally {
      setLoading(false);
    }
  }, [token, category, search, page, onProductCount]);

  useEffect(() => {
    setPage(1);
  }, [category, search]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!categories.length) return;
    setForm((f) => {
      if (f.category && categories.some((c) => c.slug === f.category)) return f;
      return { ...f, category: categories[0].slug };
    });
  }, [categories]);

  const resetForm = () => {
    productImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setForm(emptyForm);
    setProductImages([]);
    setExistingImageLabels({ front: '', back: '', additional: [] });
    setEditingProduct(null);
    setError('');
    setMode('idle');
  };

  const openAdd = () => {
    resetForm();
    setMode('add');
  };

  const openEdit = (product: MongoProduct) => {
    productImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setProductImages([]);
    setEditingProduct(product);
    setForm(productToForm(product));
    setExistingImageLabels({
      front: product.imageLabels?.front?.trim() || '',
      back: product.imageLabels?.back?.trim() || '',
      additional: (product.imageLabels?.additional || []).map((label) => label?.trim() || ''),
    });
    setError('');
    setMode('edit');
  };

  const buildImageLabelsPayload = () => {
    const labels = {
      front: existingImageLabels.front.trim(),
      back: existingImageLabels.back.trim(),
      additional: [...existingImageLabels.additional],
    };

    if (mode === 'add') {
      productImages.forEach((img, index) => {
        const label = img.label.trim();
        if (index === 0) labels.front = label;
        else if (index === 1) labels.back = label;
        else labels.additional.push(label);
      });
      return labels;
    }

    for (const img of productImages) {
      labels.additional.push(img.label.trim());
    }

    return labels;
  };

  const appendFormFields = (fd: FormData) => {
    fd.append('name', form.name.trim());
    fd.append('description', form.description.trim());
    fd.append('price', form.price);
    fd.append('category', form.category);
    fd.append('stock', form.outOfStock ? '0' : form.stock);
    fd.append('soldOut', form.outOfStock ? 'true' : 'false');
    if (form.discount.trim()) fd.append('discount', form.discount.trim());
    fd.append('colors', JSON.stringify(form.colors.map((name) => ({ name }))));
    fd.append('sizes', JSON.stringify(form.sizes.map((name) => ({ name }))));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!form.name.trim() || !form.description.trim() || !form.price) {
      setError('Name, description, and price are required');
      return;
    }

    if (!form.category.trim()) {
      setError('Select or add a category first');
      return;
    }

    if (mode === 'add' && productImages.length === 0) {
      setError('At least one image is required for new products');
      return;
    }

    if (productImages.some((img) => !img.label.trim())) {
      setError('Add a view label for each image (e.g. Black, White)');
      return;
    }

    if (mode === 'edit' && editingProduct) {
      if (editingProduct.images?.front && !existingImageLabels.front.trim()) {
        setError('Add a view label for each current image (e.g. Black, White)');
        return;
      }
      if (
        editingProduct.images?.back &&
        editingProduct.images.back !== editingProduct.images.front &&
        !existingImageLabels.back.trim()
      ) {
        setError('Add a view label for each current image (e.g. Black, White)');
        return;
      }
      const extraCount = (editingProduct.images?.additional || []).length;
      for (let i = 0; i < extraCount; i++) {
        if (!existingImageLabels.additional[i]?.trim()) {
          setError('Add a view label for each current image (e.g. Black, White)');
          return;
        }
      }
    }

    if (form.colors.length === 0) {
      setError('Add at least one available color');
      return;
    }

    if (form.sizes.length === 0) {
      setError('Select at least one available size');
      return;
    }

    setSaving(true);
    setError('');
    const savedName = form.name.trim();
    const wasEdit = mode === 'edit';
    try {
      const fd = new FormData();
      appendFormFields(fd);

      if (productImages.length) {
        productImages.forEach((img) => fd.append('images', img.file));
      }
      fd.append('imageLabels', JSON.stringify(buildImageLabelsPayload()));

      if (mode === 'edit' && editingProduct) {
        await apiFormFetch(`/api/products/${editingProduct._id}`, fd, {
          method: 'PUT',
          token,
        });
      } else {
        await apiFormFetch('/api/products', fd, { token });
      }

      resetForm();
      loadProducts();
      sweetSuccessCenter(
        wasEdit ? 'Product updated' : 'Product saved',
        `${savedName} is live in the shop.`
      );
      window.dispatchEvent(new CustomEvent('vrant:catalog-changed'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!token) return;
    const ok = await confirm({
      title: 'Remove product?',
      message: `"${name}" will be permanently removed from the catalog. This cannot be undone.`,
      confirmLabel: 'Remove',
      cancelLabel: 'Keep product',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await apiFetch(`/api/products/${id}`, { method: 'DELETE', token });
      if (editingProduct?._id === id) resetForm();
      loadProducts();
      window.dispatchEvent(new CustomEvent('vrant:catalog-changed'));
    } catch {
      /* ignore */
    }
  };

  const patchInventory = async (productId: string, body: { soldOut?: boolean; stock?: number }) => {
    if (!token) return;
    setUpdatingId(productId);
    try {
      await apiFetch(`/api/products/${productId}/inventory`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(body),
      });
      await loadProducts();
      window.dispatchEvent(new CustomEvent('vrant:catalog-changed'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleSoldOut = async (product: MongoProduct, soldOut: boolean) => {
    const ok = await confirm({
      title: soldOut ? 'Mark out of stock?' : 'Restock product?',
      message: soldOut
        ? `"${product.name}" will be marked sold out and stock will be set to 0.`
        : `"${product.name}" will be marked as available again with updated stock.`,
      confirmLabel: soldOut ? 'Mark sold out' : 'Restock',
      cancelLabel: 'Cancel',
      variant: soldOut ? 'danger' : 'default',
    });
    if (!ok) return;

    if (soldOut) {
      void patchInventory(product._id, { soldOut: true });
      return;
    }
    void patchInventory(product._id, { soldOut: false, stock: Math.max(product.stock, 1) });
  };

  const handleMarkSoldOut = async (product: MongoProduct) => {
    const ok = await confirm({
      title: 'Confirm sold out?',
      message: `"${product.name}" will be marked as sold out and stock will be reduced to 0.`,
      confirmLabel: 'Mark sold out',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    void patchInventory(product._id, { soldOut: true });
  };

  const existingImages: {
    key: string;
    src: string;
    slot: 'front' | 'back' | 'additional';
    additionalIndex?: number;
  }[] = [];
  if (editingProduct?.images?.front) {
    existingImages.push({
      key: 'front',
      slot: 'front',
      src: productImageUrl(editingProduct.images.front),
    });
  }
  if (
    editingProduct?.images?.back &&
    editingProduct.images.back !== editingProduct.images.front
  ) {
    existingImages.push({
      key: 'back',
      slot: 'back',
      src: productImageUrl(editingProduct.images.back),
    });
  }
  (editingProduct?.images?.additional || []).forEach((url, index) => {
    if (!url?.trim()) return;
    existingImages.push({
      key: `additional-${index}`,
      slot: 'additional',
      additionalIndex: index,
      src: productImageUrl(url),
    });
  });

  return (
    <>
      <AdminPageHeader
        title="Product catalog"
        description="Add, edit, and manage inventory — table view with stock and sold-out controls."
      >
        <button
          type="button"
          onClick={() => (mode === 'add' ? resetForm() : openAdd())}
          className={cn(ADMIN_BTN_OUTLINE, 'w-full sm:w-auto justify-center')}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          {mode === 'add' ? 'Cancel' : 'Add product'}
        </button>
      </AdminPageHeader>

      {mode !== 'idle' && (
        <AdminPanel title={mode === 'edit' ? `Edit — ${editingProduct?.name}` : 'New product'}>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            {error && (
              <p className="text-[9px] font-bold uppercase text-red-700 bg-red-50 border border-red-200 px-3 py-2">
                {error}
              </p>
            )}
            <label className="block">
              <span className={ADMIN_LABEL}>Name *</span>
              <input
                className={ADMIN_INPUT}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </label>

            <AdminCategoryField
              value={form.category}
              onChange={(slug) => setForm((f) => ({ ...f, category: slug }))}
            />
            <AdminProductColorsField
              colors={form.colors}
              onChange={(colors) => setForm((f) => ({ ...f, colors }))}
            />

            {mode === 'edit' && existingImages.length > 0 && (
              <div>
                <span className={ADMIN_LABEL}>Current images</span>
                <p className="text-[9px] font-bold text-black/40 uppercase tracking-wider mb-2">
                  Name each thumbnail (e.g. Black, Front, Side). Shown under photos on the shop exactly as typed.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1">
                  {existingImages.map((img, index) => (
                    <div key={img.key} className="border border-black/15 bg-white">
                      <img
                        src={img.src}
                        alt=""
                        className="w-full aspect-square object-contain bg-white p-1"
                      />
                      <label className="block p-2 border-t border-black/10">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-black/45">
                          View label *
                        </span>
                        <input
                          type="text"
                          value={
                            img.slot === 'additional'
                              ? existingImageLabels.additional[img.additionalIndex ?? 0] || ''
                              : existingImageLabels[img.slot]
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            if (img.slot === 'additional') {
                              const idx = img.additionalIndex ?? 0;
                              setExistingImageLabels((prev) => {
                                const additional = [...prev.additional];
                                additional[idx] = value;
                                return { ...prev, additional };
                              });
                            } else {
                              setExistingImageLabels((prev) => ({
                                ...prev,
                                [img.slot]: value,
                              }));
                            }
                          }}
                          placeholder={form.colors[index]?.trim() || 'e.g. Black'}
                          className="mt-1 w-full border border-black/15 bg-white px-2 py-2 min-h-[40px] text-[10px] font-bold text-black"
                          required
                        />
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-[8px] font-bold uppercase text-black/35 mt-2">
                  Add new images below to replace or extend photos
                </p>
              </div>
            )}

            <ProductImagePicker
              images={productImages}
              onChange={setProductImages}
              maxImages={
                mode === 'edit'
                  ? Math.max(0, MAX_PRODUCT_IMAGES - existingImages.length)
                  : MAX_PRODUCT_IMAGES
              }
              appendOnly={mode === 'edit'}
              colorSuggestions={form.colors}
              onReject={(message) => setError(message)}
            />
            {mode === 'add' && productImages.length === 0 ? (
              <p className="text-[8px] font-bold uppercase text-black/40 -mt-2">Required for new products</p>
            ) : null}

            <label className="block">
              <span className={ADMIN_LABEL}>Description *</span>
              <textarea
                className={`${ADMIN_INPUT} min-h-[80px] resize-y normal-case`}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                required
                minLength={10}
              />
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <label className="block">
                <span className={ADMIN_LABEL}>Price (GHS) *</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={ADMIN_INPUT}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  required
                />
              </label>
              <label className="block">
                <span className={ADMIN_LABEL}>Discount (%)</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  step="1"
                  placeholder="Optional"
                  className={ADMIN_INPUT}
                  value={form.discount}
                  onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className={ADMIN_LABEL}>Stock *</span>
                <input
                  type="number"
                  min="0"
                  className={ADMIN_INPUT}
                  value={form.stock}
                  disabled={form.outOfStock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  required
                />
              </label>
            </div>
            <label className="flex items-center gap-3 min-h-[48px] cursor-pointer">
              <input
                type="checkbox"
                checked={form.outOfStock}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    outOfStock: e.target.checked,
                    stock: e.target.checked ? '0' : f.stock === '0' ? '1' : f.stock,
                  }))
                }
                className="h-4 w-4 accent-black"
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-black">
                Mark as out of stock / sold out
              </span>
            </label>
            <AdminProductSizesField
              sizes={form.sizes}
              onChange={(sizes) => setForm((f) => ({ ...f, sizes }))}
            />
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={saving} className={ADMIN_BTN}>
                {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Save product'}
              </button>
              {mode === 'edit' && (
                <button type="button" onClick={resetForm} className={ADMIN_BTN_OUTLINE}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </AdminPanel>
      )}

      <div className="mb-4 space-y-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className={ADMIN_INPUT}
        />
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
          {filterCats.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                'shrink-0 px-3 py-2.5 min-h-[44px] text-[9px] font-bold tracking-[0.12em] uppercase border transition-colors touch-manipulation',
                category === c
                  ? 'bg-black text-white border-black'
                  : 'text-black/50 border-black/15 hover:border-black/30'
              )}
            >
              {c === 'all' ? 'all' : categories.find((cat) => cat.slug === c)?.label ?? c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center border border-black/10">
          <p className="text-[10px] font-bold uppercase text-black/40 animate-pulse">Loading…</p>
        </div>
      ) : products.length === 0 ? (
        <div className="border border-dashed border-black/20 p-8 text-center">
          <p className="text-[11px] font-bold uppercase text-black/50">No products yet</p>
          <p className="text-[10px] font-bold text-black/40 mt-2 uppercase">Tap Add product above</p>
        </div>
      ) : (
        <>
          <AdminProductsTable
            products={products}
            onEdit={openEdit}
            onDelete={handleDelete}
            onToggleSoldOut={handleToggleSoldOut}
            onMarkSoldOut={handleMarkSoldOut}
            updatingId={updatingId}
          />
          <AdminPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="products"
          />
        </>
      )}
    </>
  );
};

const Products = () => {
  const [productCount, setProductCount] = useState(0);

  return (
    <AdminLayout productCount={productCount}>
      <ProductsContent onProductCount={setProductCount} />
    </AdminLayout>
  );
};

export default Products;
