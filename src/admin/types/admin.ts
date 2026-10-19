import type { ShopOrder } from '@/types/customer';

export interface AdminStats {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  recentSales: number;
  lowStockProducts: number;
  /** All non-cancelled order value (incl. pending checkout) */
  orderValueTotal?: number;
}

export type RevenueTrendPoint = {
  _id: string;
  revenue: number;
  orders: number;
};

export type PopulatedCustomer = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
};

export interface AdminShopOrder extends ShopOrder {
  customer?: PopulatedCustomer | string;
}

export interface MongoProduct {
  _id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  category: string;
  stock: number;
  soldOut?: boolean;
  isActive?: boolean;
  images?: { front?: string; back?: string; additional?: string[] };
  imageLabels?: { front?: string; back?: string; additional?: string[] };
  colors?: { name: string; code?: string }[];
  sizes?: { name: string; stock?: number }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminCustomer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  isActive?: boolean;
  orderCount?: number;
}

export interface DashboardPayload {
  stats: AdminStats;
  recentOrders: AdminShopOrder[];
  lowStockProducts: { _id: string; name: string; stock: number; category: string }[];
  revenueTrend?: RevenueTrendPoint[];
}

export interface SiteSettings {
  logoUrl: string;
  logoAlt: string;
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeCity: string;
  heroImageUrl: string;
  heroImageLeftUrl: string;
  heroImageRightUrl: string;
  heroImageAlt: string;
  aboutEyebrow: string;
  aboutTitle: string;
  aboutParagraphs: string[];
}

export interface GalleryItem {
  _id: string;
  name: string;
  caption?: string;
  category: string;
  image: string;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
}
