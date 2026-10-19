import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiFetch } from '@/lib/api';
import type { ShopCategory } from '@/lib/categories';
import { categoryLabels } from '@/data/products';

/** Used until the API is reachable — mirrors DEFAULT_CATEGORIES in backend/lib/categories.js */
const DEFAULT_SHOP_CATEGORIES: ShopCategory[] = Object.entries(categoryLabels).map(
  ([slug, label], i) => ({ _id: `default-${slug}`, slug, label, sortOrder: i + 1 })
);

type CategoriesContextValue = {
  categories: ShopCategory[];
  loading: boolean;
  refresh: () => Promise<void>;
  getLabel: (slug: string) => string;
};

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        data: { categories: ShopCategory[] };
      }>('/api/categories');
      const list = res.data.categories || [];
      setCategories(list.length > 0 ? list : DEFAULT_SHOP_CATEGORIES);
    } catch {
      setCategories(DEFAULT_SHOP_CATEGORIES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onChange = () => {
      void refresh();
    };
    window.addEventListener('vrant:categories-changed', onChange);
    return () => window.removeEventListener('vrant:categories-changed', onChange);
  }, [refresh]);

  const getLabel = useCallback(
    (slug: string) => {
      const match = categories.find((c) => c.slug === slug);
      return match?.label ?? slug;
    },
    [categories]
  );

  const value = useMemo(
    () => ({ categories, loading, refresh, getLabel }),
    [categories, loading, refresh, getLabel]
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) {
    throw new Error('useCategories must be used within CategoriesProvider');
  }
  return ctx;
}
