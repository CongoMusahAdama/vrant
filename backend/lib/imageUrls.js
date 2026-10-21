const path = require('path');

function publicApiBase() {
  if (process.env.API_PUBLIC_URL) {
    return process.env.API_PUBLIC_URL.replace(/\/$/, '');
  }
  const port = process.env.PORT || 5000;
  return `http://localhost:${port}`;
}

/** Where /uploads images are served (local development only — production uploads go to Cloudinary) */
function uploadsPublicBase() {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL.replace(/\/$/, '');
  }
  return publicApiBase();
}

function extractUploadsPath(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/uploads\/[^?#]+/);
  return match ? match[0] : null;
}

/** Rewrite stored /uploads or localhost URLs to the public API base */
function normalizeStoredImageUrl(url) {
  if (!url || typeof url !== 'string') return url || '';
  if (url.startsWith('https://res.cloudinary.com/')) return url;

  const uploadsPath = extractUploadsPath(url);
  if (uploadsPath) {
    return `${uploadsPublicBase()}${uploadsPath}`;
  }

  return url;
}

function normalizeProductImages(images) {
  if (!images) return images;
  const normalized = { ...images };
  if (normalized.front) normalized.front = normalizeStoredImageUrl(normalized.front);
  if (normalized.back) normalized.back = normalizeStoredImageUrl(normalized.back);
  if (Array.isArray(normalized.additional)) {
    normalized.additional = normalized.additional.map(normalizeStoredImageUrl);
  }
  return normalized;
}

function withNormalizedImages(product) {
  if (!product) return product;
  const doc = typeof product.toObject === 'function' ? product.toObject() : { ...product };
  if (doc.images) {
    doc.images = normalizeProductImages(doc.images);
  }
  return doc;
}

function localUploadPathFromUrl(url) {
  const uploadsPath = extractUploadsPath(url);
  if (!uploadsPath) return null;
  return path.join(__dirname, '..', 'uploads', path.basename(uploadsPath));
}

module.exports = {
  publicApiBase,
  uploadsPublicBase,
  extractUploadsPath,
  normalizeStoredImageUrl,
  normalizeProductImages,
  withNormalizedImages,
  localUploadPathFromUrl,
};
