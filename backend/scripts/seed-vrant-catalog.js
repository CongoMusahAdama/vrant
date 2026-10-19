/**
 * Seed the starter VRANT catalog (products + lookbook gallery) into MongoDB.
 * Images are the static files in the frontend's public/products and public/lookbook folders.
 * Safe to re-run: products are matched by name and gallery items by image, then updated in place.
 *
 * Run from backend/: node scripts/seed-vrant-catalog.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const GalleryItem = require('../models/GalleryItem');
const User = require('../models/User');

const img = (slug, count) => Array.from({ length: count }, (_, i) => `/products/${slug}-${i + 1}.jpg`);
const APPAREL = ['S', 'M', 'L', 'XL', 'XXL'];

/** Listed newest first — the order shoppers see */
const PRODUCTS = [
  {
    name: 'Ember Diamond Zip Set',
    images: img('ember-diamond-zip-set', 5),
    labels: ['The set', 'Rhinestone zip', 'Folded', 'Styled', 'Lounge'],
    price: 850,
    category: 'sets',
    stock: 12,
    sizes: APPAREL,
    colors: ['Ember Red', 'Ivory'],
    featured: true,
    description:
      'Our signature two-piece. A relaxed short-sleeve shirt with hand-pintucked diamond quilting, a rhinestone-studded half zip and a sharp point collar, paired with matching straight-leg trousers.',
    details: ['Hand-pintucked diamond quilting', 'Rhinestone half-zip placket', 'Matching straight-leg trousers', 'Made in Ghana'],
  },
  {
    name: 'Abstract Bib Kaftan',
    images: img('abstract-bib-kaftan', 4),
    labels: ['Front', 'Bib detail', 'Print close-up', 'Styled'],
    price: 780,
    category: 'sets',
    stock: 10,
    sizes: APPAREL,
    colors: ['Cocoa'],
    featured: true,
    description:
      'A long-sleeve kaftan in textured cocoa cloth, finished with a bold hand-cut print bib and side vents. Comes with matching trousers for a complete, modern native look.',
    details: ['Textured cocoa woven cloth', 'Contrast print bib panel', 'Side vents and buttoned cuffs', 'Matching trousers included'],
  },
  {
    name: 'Coral Panel Shirt Set',
    images: img('coral-panel-shirt-set', 5),
    labels: ['Full look', 'Panel detail', 'Shoulder', 'Seated', 'Styled'],
    price: 720,
    category: 'sets',
    stock: 10,
    sizes: APPAREL,
    colors: ['Coral'],
    featured: true,
    description:
      'A clean coral shirt with curved wax-print shoulder panels and print-trimmed sleeves, cut with a straight hem. Paired with tailored coral trousers.',
    details: ['Curved wax-print shoulder panels', 'Print-trimmed sleeve hems', 'Tailored matching trousers', 'Made in Ghana'],
  },
  {
    name: 'Ivory Diamond Set',
    images: img('ivory-diamond-set', 3),
    labels: ['Full look', 'Detail', 'With Ember'],
    price: 850,
    category: 'sets',
    stock: 8,
    sizes: APPAREL,
    colors: ['Ivory'],
    description:
      'The diamond pintuck set in crisp ivory. A relaxed short-sleeve top with a soft collar and matching trousers — clean enough for a wedding, easy enough for Sunday.',
    details: ['Hand-pintucked diamond quilting', 'Soft collar, relaxed fit', 'Matching straight-leg trousers', 'Made in Ghana'],
  },
  {
    name: 'VRANT Cross Suede Slides',
    images: img('vrant-cross-suede-slides', 5),
    labels: ['Grey', 'On foot', 'Colours', 'Basket', 'The range'],
    price: 380,
    category: 'footwear',
    stock: 25,
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['Grey', 'Red', 'Brown', 'Black', 'Mint'],
    featured: true,
    description:
      'Hand-finished cross-strap slides in soft suede with a leather under-strap and the VRANT script on the upper. Cushioned footbed, built for all-day wear.',
    details: ['Suede upper with leather cross strap', 'Embossed VRANT script', 'Cushioned footbed', 'Available in five colours'],
  },
  {
    name: 'Crimson Print Shirt',
    images: img('crimson-print-shirt', 1),
    labels: [],
    price: 480,
    category: 'shirts',
    stock: 6,
    sizes: APPAREL,
    colors: ['Crimson / White'],
    description:
      'A long-sleeve shirt with a crimson print body, white textured sleeves and yoke, and a print-trimmed pocket square detail.',
    details: ['Bold print body', 'White textured sleeves and collar', 'Pocket square detail', 'Made in Ghana'],
  },
  {
    name: 'Olive Print Yoke Set',
    images: img('olive-print-yoke-set', 1),
    labels: [],
    price: 700,
    category: 'sets',
    stock: 6,
    sizes: APPAREL,
    colors: ['Olive'],
    description:
      'A short-sleeve olive shirt with a vivid abstract print yoke and structured shoulder panels, paired with matching olive trousers.',
    details: ['Abstract print yoke', 'Structured shoulder panels', 'Matching trousers included', 'Made in Ghana'],
  },
];

const GALLERY = [
  ['look-9', 'Ivory & Ember', 'Diamond sets, side by side.', 'sets'],
  ['look-13', 'Ember, Together', 'The Ember Diamond Zip Set.', 'sets'],
  ['look-21', 'Cocoa & Ivory', 'Abstract Bib Kaftan meets the Ivory set.', 'lookbook'],
  ['look-25', 'Coral, Seated', 'Wax-print panels, clean lines.', 'shirts'],
  ['look-16', 'Lounge', 'Ember set with red suede slides.', 'lookbook'],
  ['look-11', 'Ember Duo', 'Rhinestone zip, diamond quilting.', 'sets'],
  ['look-14', 'Standing Still', 'The Ember set, head to toe.', 'sets'],
  ['look-6', 'Coral Panel', 'Curved print shoulders.', 'shirts'],
  ['look-18', 'Ivory, Carried', 'Ivory set, Ember in hand.', 'sets'],
  ['look-24', 'Slides, Every Colour', 'VRANT Cross Suede Slides.', 'footwear'],
  ['look-26', 'Basket Drop', 'Hand-finished suede.', 'footwear'],
  ['look-7', 'Grey Slide', 'Suede, leather, VRANT script.', 'footwear'],
];

function toProductDoc(p, adminId) {
  const [front, back, ...additional] = p.images;
  const [frontLabel = '', backLabel = '', ...extraLabels] = p.labels;
  const perSize = Math.max(1, Math.floor(p.stock / p.sizes.length));
  return {
    name: p.name,
    description: p.description,
    details: p.details,
    price: p.price,
    category: p.category,
    images: { front, back: back || front, additional },
    imageLabels: { front: frontLabel, back: backLabel, additional: extraLabels },
    sizes: p.sizes.map((name) => ({ name, stock: perSize })),
    colors: p.colors.map((name) => ({ name })),
    stock: p.stock,
    soldOut: false,
    isActive: true,
    isFeatured: Boolean(p.featured),
    isNewArrival: true,
    tags: ['vrant', p.category],
    createdBy: adminId,
  };
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) throw new Error('No admin user found — run node scripts/ensureAdmin.js first');

  let created = 0;
  let updated = 0;
  // Insert oldest first so createdAt order matches the newest-first list above
  for (const p of [...PRODUCTS].reverse()) {
    const doc = toProductDoc(p, admin._id);
    const existing = await Product.findOne({ name: p.name });
    if (existing) {
      existing.set(doc);
      await existing.save();
      updated++;
    } else {
      await Product.create(doc);
      created++;
      await new Promise((r) => setTimeout(r, 25));
    }
  }
  console.log(`Products: ${created} created, ${updated} updated`);

  let gCreated = 0;
  let gUpdated = 0;
  for (const [i, [file, name, caption, category]] of GALLERY.entries()) {
    const image = `/lookbook/${file}.jpg`;
    const res = await GalleryItem.updateOne(
      { image },
      { $set: { name, caption, category, image, sortOrder: i, isActive: true } },
      { upsert: true }
    );
    if (res.upsertedCount) gCreated++;
    else gUpdated++;
  }
  console.log(`Gallery: ${gCreated} created, ${gUpdated} updated`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err.message);
  await mongoose.disconnect();
  process.exit(1);
});
