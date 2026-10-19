import { NEW_ARRIVALS_HASH } from '@/lib/scroll-to';

export type ShopCategory = {
  _id: string;
  slug: string;
  label: string;
  sortOrder?: number;
};

export function categoryLabelFromList(slug: string, categories: ShopCategory[]): string {
  const match = categories.find((c) => c.slug === slug);
  if (match) return match.label;
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function buildShopNavLinks(categories: ShopCategory[]) {
  return [
    { label: 'NEW ARRIVALS', path: `/${NEW_ARRIVALS_HASH}` },
    ...categories.map((c) => ({
      label: c.label.toUpperCase(),
      path: `/products?category=${c.slug}`,
    })),
    { label: 'ALL PRODUCTS', path: '/products?category=all' },
  ];
}

export function buildShopFilterTabs(categories: ShopCategory[]) {
  return [
    { key: 'all', label: 'ALL', path: '/products?category=all' },
    ...categories.map((c) => ({
      key: c.slug,
      label: c.label.toUpperCase(),
      path: `/products?category=${c.slug}`,
    })),
  ];
}

export function buildFeaturedCategoryTabs(categories: ShopCategory[]) {
  return [
    { key: 'new-arrivals', label: 'NEW ARRIVALS' },
    { key: 'all', label: 'ALL' },
    ...categories.map((c) => ({
      key: c.slug,
      label: c.label.toUpperCase(),
    })),
  ];
}
