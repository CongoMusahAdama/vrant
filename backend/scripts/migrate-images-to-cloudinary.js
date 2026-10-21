/**
 * Upload local /uploads product & gallery images to Cloudinary and update MongoDB.
 * Run from backend after fixing CLOUDINARY_CLOUD_NAME in .env:
 *   npm run migrate:images
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Product = require('../models/Product');
const GalleryItem = require('../models/GalleryItem');
const {
  extractUploadsPath,
  localUploadPathFromUrl,
} = require('../lib/imageUrls');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function verifyCloudinary() {
  try {
    await cloudinary.api.ping();
    return true;
  } catch (err) {
    const msg = err?.error?.message || err?.message || String(err);
    console.error('\n❌ Cloudinary is not configured correctly.');
    console.error(`   Error: ${msg}`);
    console.error(
      '   Open https://console.cloudinary.com → Dashboard → copy the exact Cloud name (e.g. dxxxx).'
    );
    console.error('   Update CLOUDINARY_CLOUD_NAME in backend/.env and in Vercel, then run again.\n');
    return false;
  }
}

async function uploadLocalFile(filePath, folder) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }, { quality: 'auto' }],
  });
  return result.secure_url;
}

const migrated = new Map();

async function migrateUrl(url, folder) {
  if (!url || url.startsWith('https://res.cloudinary.com/')) return url;
  const uploadsPath = extractUploadsPath(url);
  if (!uploadsPath) return url;

  if (migrated.has(uploadsPath)) {
    return migrated.get(uploadsPath);
  }

  const localPath = localUploadPathFromUrl(url);
  const secureUrl = await uploadLocalFile(localPath, folder);
  if (!secureUrl) {
    console.warn(`   ⚠ Skipped (file missing): ${uploadsPath}`);
    return url;
  }

  migrated.set(uploadsPath, secureUrl);
  console.log(`   ✓ ${uploadsPath} → Cloudinary`);
  return secureUrl;
}

async function migrateProductImages(images) {
  if (!images) return images;
  const next = { ...images };
  if (next.front) next.front = await migrateUrl(next.front, 'products');
  if (next.back) next.back = await migrateUrl(next.back, 'products');
  if (Array.isArray(next.additional)) {
    next.additional = await Promise.all(
      next.additional.map((url) => migrateUrl(url, 'products'))
    );
  }
  return next;
}

async function main() {
  if (!(await verifyCloudinary())) {
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const products = await Product.find({});
  console.log(`Products: ${products.length}`);
  for (const product of products) {
    const needs =
      extractUploadsPath(product.images?.front) ||
      extractUploadsPath(product.images?.back) ||
      (product.images?.additional || []).some((u) => extractUploadsPath(u));
    if (!needs) continue;

    console.log(`→ ${product.name}`);
    product.images = await migrateProductImages(product.images);
    await product.save();
  }

  const gallery = await GalleryItem.find({});
  console.log(`\nGallery: ${gallery.length}`);
  for (const item of gallery) {
    if (!extractUploadsPath(item.image)) continue;
    console.log(`→ ${item.name}`);
    item.image = await migrateUrl(item.image, 'gallery');
    await item.save();
  }

  console.log(`\n✅ Done. Migrated ${migrated.size} file(s) to Cloudinary.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
