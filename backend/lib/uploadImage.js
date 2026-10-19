const fs = require('fs');
const path = require('path');
const { uploadsPublicBase } = require('./imageUrls');
const { isCloudinaryReady } = require('./cloudinaryClient');
const { uploadToCloudinary } = require('../middleware/upload');

let cloudinaryReadyCache = null;
let cloudinaryReadyCheckedAt = 0;
const READY_TTL_MS = 10 * 60 * 1000;

async function getCloudinaryReady() {
  const now = Date.now();
  if (cloudinaryReadyCache !== null && now - cloudinaryReadyCheckedAt < READY_TTL_MS) {
    return cloudinaryReadyCache;
  }
  cloudinaryReadyCache = await isCloudinaryReady();
  cloudinaryReadyCheckedAt = now;
  return cloudinaryReadyCache;
}

function unlinkQuiet(filePath) {
  if (!filePath) return;
  fs.unlink(filePath, () => {});
}

async function resolveUploadedImageUrl(file, folder = 'products') {
  const ready = await getCloudinaryReady();
  if (ready) {
    try {
      const result = await uploadToCloudinary(file.path, folder);
      unlinkQuiet(file.path);
      if (result?.secure_url) return result.secure_url;
    } catch (uploadError) {
      console.error('Cloudinary upload failed:', uploadError.message);
      unlinkQuiet(file.path);
      throw new Error('Image upload failed — check Cloudinary settings on Render.');
    }
    unlinkQuiet(file.path);
    throw new Error('Image upload failed — Cloudinary returned no URL.');
  }

  if (process.env.NODE_ENV === 'production') {
    unlinkQuiet(file.path);
    throw new Error(
      'Image upload failed — set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on Render.'
    );
  }

  return `${uploadsPublicBase()}/uploads/${path.basename(file.path)}`;
}

async function resolveUploadedImageUrls(files, folder = 'products') {
  return Promise.all(files.map((file) => resolveUploadedImageUrl(file, folder)));
}

function invalidateCloudinaryReadyCache() {
  cloudinaryReadyCache = null;
  cloudinaryReadyCheckedAt = 0;
}

module.exports = {
  resolveUploadedImageUrl,
  resolveUploadedImageUrls,
  getCloudinaryReady,
  invalidateCloudinaryReadyCache,
};
