import {
  getMergedShopProducts,
  resolveProductById,
  sortShopProductsNewestFirst,
} from '@/lib/shop-catalog';

export interface ShopProduct {
  id: number;
  /** Set when product comes from admin MongoDB catalog */
  mongoId?: string;
  name: string;
  price: string;
  priceAmount: number;
  frontImage: string;
  backImage: string;
  images: string[];
  /** Admin-defined labels shown under gallery thumbnails */
  imageLabels?: { front?: string; back?: string; additional?: string[] };
  category: string;
  stock: number;
  sizes: string[];
  /** Admin-defined color options for checkout */
  colors?: string[];
  description: string;
  details: string[];
  /** Present for products loaded from the admin API */
  createdAt?: string;
}

export const categoryLabels: Record<string, string> = {
  sets: 'Two-Piece Sets',
  shirts: 'Shirts',
  jeans: 'Jeans',
  trousers: 'Trousers',
  footwear: 'Footwear',
  accessories: 'Accessories',
};

export function getLatestProducts(limit = 16): ShopProduct[] {
  return sortShopProductsNewestFirst(getMergedShopProducts()).slice(0, limit);
}

export function getProductById(id: number): ShopProduct | undefined {
  return resolveProductById(id);
}

export function getCategoryLabel(category: string): string {
  return categoryLabels[category] ?? category;
}
