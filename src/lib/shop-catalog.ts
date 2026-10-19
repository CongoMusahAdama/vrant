import { apiFetch } from '@/lib/api';
import { productImageUrl } from '@/lib/productImage';
import type { ShopProduct } from '@/data/products';
import { VRANT_COLLECTION } from '@/data/vrant-collection';

const CATALOG_ID_BASE = 1_000_000;

type ApiProduct = {
  _id: string;
  name: string;
  description?: string;
  details?: string[];
  price: number;
  originalPrice?: number;
  category: string;
  stock: number;
  soldOut?: boolean;
  isActive?: boolean;
  createdAt?: string;
  images?: { front?: string; back?: string; additional?: string[] };
  imageLabels?: { front?: string; back?: string; additional?: string[] };
  sizes?: { name: string; stock?: number }[];
  colors?: { name?: string; code?: string }[];
};

const mongoIdByCatalogId = new Map<number, string>();
let apiCatalog: ShopProduct[] = [];

function catalogIdFromMongoId(mongoId: string): number {
  let hash = 0;
  for (let i = 0; i < mongoId.length; i++) {
    hash = (hash * 31 + mongoId.charCodeAt(i)) >>> 0;
  }
  return CATALOG_ID_BASE + (hash % 899_999);
}

function formatPrice(amount: number) {
  return `₵${amount.toLocaleString('en-GH', { maximumFractionDigits: 0 })}`;
}

export function mapApiProductToShop(p: ApiProduct): ShopProduct | null {
  if (p.isActive === false) return null;

  const front = productImageUrl(p.images?.front);
  if (!front) return null;

  const back = productImageUrl(p.images?.back) || front;
  const extras = (p.images?.additional || []).map(productImageUrl).filter(Boolean);
  const images = [
    front,
    ...(back !== front ? [back] : []),
    ...extras.filter((url) => url !== front && url !== back),
  ];

  const sizesFromDb = p.sizes?.map((s) => s.name).filter(Boolean);
  const sizes =
    sizesFromDb && sizesFromDb.length > 0 ? sizesFromDb : ['S', 'M', 'L', 'XL'];

  const catalogId = catalogIdFromMongoId(p._id);
  mongoIdByCatalogId.set(catalogId, p._id);

  const priceLabel =
    p.originalPrice && p.originalPrice > p.price
      ? formatPrice(p.price)
      : formatPrice(p.price);

  return {
    id: catalogId,
    name: p.name,
    price: priceLabel,
    priceAmount: p.price,
    frontImage: front,
    backImage: back,
    images,
    imageLabels: p.imageLabels
      ? {
          front: p.imageLabels.front?.trim() || '',
          back: p.imageLabels.back?.trim() || '',
          additional: (p.imageLabels.additional || []).map((l) => l?.trim() || ''),
        }
      : undefined,
    category: p.category,
    stock: p.soldOut || p.stock <= 0 ? 0 : p.stock,
    sizes,
    colors: (p.colors || []).map((c) => c.name?.trim()).filter((n): n is string => Boolean(n)),
    description: p.description || '',
    details: (p.details || []).filter(Boolean),
    mongoId: p._id,
    createdAt: p.createdAt,
  };
}

/** Newest admin products first */
export function sortShopProductsNewestFirst(products: ShopProduct[]): ShopProduct[] {
  return [...products].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (aTime !== bTime) return bTime - aTime;
    return b.id - a.id;
  });
}

export type ShopProductWithMongo = ShopProduct & { mongoId?: string };

/* ── localStorage cache for instant page loads ── */

const CATALOG_CACHE_KEY = 'vrant_product_cache';

function loadCachedCatalog(): ShopProduct[] {
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ShopProduct[];
  } catch {
    return [];
  }
}

function saveCatalogToCache(products: ShopProduct[]) {
  try {
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(products));
  } catch {
    // storage full or unavailable — ignore
  }
}

// Hydrate from cache immediately so products show on first render
apiCatalog = loadCachedCatalog();

export async function fetchApiCatalog(): Promise<ShopProduct[]> {
  try {
    const res = await apiFetch<{
      success: boolean;
      data: { products: ApiProduct[] };
    }>('/api/products?limit=500&sort=createdAt&order=desc');

    const mapped = (res.data.products || [])
      .map(mapApiProductToShop)
      .filter((p): p is ShopProduct => Boolean(p));

    apiCatalog = mapped;
    saveCatalogToCache(mapped);
    return mapped;
  } catch {
    // Keep cached products if API fails — don't wipe them
    if (apiCatalog.length === 0) {
      apiCatalog = loadCachedCatalog();
    }
    return apiCatalog;
  }
}

export function getApiCatalog(): ShopProduct[] {
  return apiCatalog;
}

/** Live catalog — admin/API products, or the starter VRANT collection until the admin catalog has any */
export function getMergedShopProducts(): ShopProduct[] {
  return sortShopProductsNewestFirst(apiCatalog.length > 0 ? apiCatalog : VRANT_COLLECTION);
}

export function resolveProductById(id: number): ShopProduct | undefined {
  return getMergedShopProducts().find((p) => p.id === id);
}

export function getMongoIdForCatalogProduct(id: number): string | undefined {
  return mongoIdByCatalogId.get(id);
}

export function isApiCatalogProduct(id: number): boolean {
  return mongoIdByCatalogId.has(id);
}
