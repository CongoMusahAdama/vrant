const { cloudinary } = require('./cloudinaryClient');

function publicIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('res.cloudinary.com')) return null;

  try {
    const afterUpload = url.split('/upload/')[1];
    if (!afterUpload) return null;

    const parts = afterUpload.split('/');
    const filePart = parts[parts.length - 1];
    const versionIdx = parts.findIndex((p) => /^v\d+$/.test(p));
    const pathParts = versionIdx >= 0 ? parts.slice(versionIdx + 1) : parts;
    const withExt = pathParts.join('/');
    const publicId = withExt.replace(/\.[a-zA-Z0-9]+$/, '');
    return publicId || null;
  } catch {
    return null;
  }
}

async function deleteCloudinaryUrl(url) {
  const publicId = publicIdFromUrl(url);
  if (!publicId) return { skipped: true };
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete failed:', error.message);
    return { error: error.message };
  }
}

async function deleteCloudinaryUrls(urls) {
  const unique = [...new Set((urls || []).filter(Boolean))];
  await Promise.all(unique.map((url) => deleteCloudinaryUrl(url)));
}

function collectProductImageUrls(images) {
  if (!images) return [];
  return [images.front, images.back, ...(images.additional || [])].filter(Boolean);
}

module.exports = {
  publicIdFromUrl,
  deleteCloudinaryUrl,
  deleteCloudinaryUrls,
  collectProductImageUrls,
};
