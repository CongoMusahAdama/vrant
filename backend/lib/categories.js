const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  { slug: 'sets', label: 'Two-Piece Sets', sortOrder: 1 },
  { slug: 'shirts', label: 'Shirts', sortOrder: 2 },
  { slug: 'jeans', label: 'Jeans', sortOrder: 3 },
  { slug: 'trousers', label: 'Trousers', sortOrder: 4 },
  { slug: 'footwear', label: 'Footwear', sortOrder: 5 },
  { slug: 'accessories', label: 'Accessories', sortOrder: 6 },
];

function slugifyCategory(label) {
  return String(label)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function labelFromSlug(slug) {
  return String(slug)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function ensureDefaultCategories() {
  for (const item of DEFAULT_CATEGORIES) {
    await Category.findOneAndUpdate(
      { slug: item.slug },
      { $setOnInsert: { ...item, isActive: true } },
      { upsert: true, new: true }
    );
  }
}

let activeSlugCache = null;
let activeSlugCacheAt = 0;
const SLUG_CACHE_MS = 5 * 60 * 1000;

async function refreshActiveSlugCache() {
  const cats = await Category.find({ isActive: true }).select('slug');
  activeSlugCache = new Set(cats.map((c) => c.slug));
  activeSlugCacheAt = Date.now();
}

function invalidateCategoryCache() {
  activeSlugCache = null;
  activeSlugCacheAt = 0;
}

async function isValidCategorySlug(slug) {
  if (!slug) return false;
  if (!activeSlugCache || Date.now() - activeSlugCacheAt > SLUG_CACHE_MS) {
    await refreshActiveSlugCache();
  }
  return activeSlugCache.has(String(slug).toLowerCase());
}

async function listActiveCategories() {
  return Category.find({ isActive: true }).sort({ sortOrder: 1, label: 1 });
}

module.exports = {
  DEFAULT_CATEGORIES,
  slugifyCategory,
  labelFromSlug,
  ensureDefaultCategories,
  isValidCategorySlug,
  listActiveCategories,
  invalidateCategoryCache,
};
