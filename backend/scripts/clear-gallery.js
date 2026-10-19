/**
 * Remove all gallery items from MongoDB (and Cloudinary assets when configured).
 * Usage: node scripts/clear-gallery.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const GalleryItem = require('../models/GalleryItem');
const { deleteCloudinaryUrl } = require('../lib/cloudinaryAssets');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const items = await GalleryItem.find({});
  console.log(`Found ${items.length} gallery item(s)`);

  for (const item of items) {
    if (item.image) {
      await deleteCloudinaryUrl(item.image);
    }
  }

  const result = await GalleryItem.deleteMany({});
  console.log(`Deleted ${result.deletedCount} gallery item(s)`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
