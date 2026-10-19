import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import type { ShopProduct } from '@/data/products';
import {
  fetchApiCatalog,
  getMergedShopProducts,
  resolveProductById,
} from '@/lib/shop-catalog';

type ShopCatalogContextValue = {
  products: ShopProduct[];
  loading: boolean;
  getProductById: (id: number) => ShopProduct | undefined;
  refresh: () => Promise<void>;
};

/** Background refreshes (route change, tab focus) reuse the catalog for this long */
const CATALOG_TTL_MS = 60_000;

const ShopCatalogContext = createContext<ShopCatalogContextValue | null>(null);

export function ShopCatalogProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [apiLoaded, setApiLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastFetchAt = useRef(0);
  const apiLoadedRef = useRef(false);
  const [version, setVersion] = useState(0);

  /** Refetch the catalog at most once per CATALOG_TTL_MS unless forced (admin edits) */
  const refresh = useCallback(async (force = false) => {
    if (!force && Date.now() - lastFetchAt.current < CATALOG_TTL_MS) return;
    lastFetchAt.current = Date.now();
    // Only the first load shows a loading state; background refreshes swap data silently
    if (!apiLoadedRef.current) setLoading(true);
    try {
      await fetchApiCatalog();
    } finally {
      apiLoadedRef.current = true;
      setApiLoaded(true);
      setLoading(false);
      setVersion((v) => v + 1);
    }
  }, []);

  useEffect(() => {
    void refresh(true);
  }, [refresh]);

  useEffect(() => {
    const onCatalogChange = () => {
      void refresh(true);
    };
    window.addEventListener('vrant:catalog-changed', onCatalogChange);
    return () => window.removeEventListener('vrant:catalog-changed', onCatalogChange);
  }, [refresh]);

  const isShopRoute =
    location.pathname === '/' ||
    location.pathname === '/products' ||
    location.pathname.startsWith('/products/');

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && isShopRoute) {
        void refresh();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh, isShopRoute]);

  useEffect(() => {
    if (isShopRoute) {
      void refresh();
    }
  }, [location.pathname, refresh, isShopRoute]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const products = useMemo(() => getMergedShopProducts(), [apiLoaded, version]);

  const value = useMemo(
    () => ({
      products,
      loading,
      getProductById: (id: number) => resolveProductById(id),
      refresh: () => refresh(true),
    }),
    [products, loading, refresh]
  );

  return (
    <ShopCatalogContext.Provider value={value}>{children}</ShopCatalogContext.Provider>
  );
}

export function useShopCatalog() {
  const ctx = useContext(ShopCatalogContext);
  if (!ctx) {
    throw new Error('useShopCatalog must be used within ShopCatalogProvider');
  }
  return ctx;
}
