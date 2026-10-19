import type { ShopProduct } from '@/data/products';

/** Lowercase, strip accents and punctuation so "Ivory," and "ivory" match */
function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');
}

/** Words that shoppers type but that would match almost everything */
const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'for', 'of', 'in', 'vrant']);

function searchableText(product: ShopProduct, categoryLabel: string) {
  return normalize(
    [
      product.name,
      product.description,
      product.category,
      categoryLabel,
      ...(product.colors || []),
      ...(product.details || []),
      ...(product.sizes || []),
    ].join(' ')
  );
}

/**
 * Every meaningful word of the query must appear somewhere in the product
 * (name, description, category, colours, details or sizes). Simple plural "s" is ignored,
 * so "slide" finds "Slides" and "shirts" finds "Shirt".
 */
export function matchesSearch(product: ShopProduct, query: string, categoryLabel = '') {
  const words = normalize(query)
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w));
  if (words.length === 0) return true;

  const haystack = searchableText(product, categoryLabel);
  return words.every((word) => {
    const stem = word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word;
    return haystack.includes(stem);
  });
}

/** Name matches first, then everything else, keeping the incoming order within each group */
export function rankSearchResults(products: ShopProduct[], query: string) {
  const q = normalize(query).trim();
  const inName = (p: ShopProduct) => normalize(p.name).includes(q);
  return [...products.filter(inName), ...products.filter((p) => !inName(p))];
}
