const cloudinary = require('cloudinary').v2;

function configureCloudinary() {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ secure: true });
    return cloudinary;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return cloudinary;
}

async function isCloudinaryReady() {
  const { CLOUDINARY_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  if (!CLOUDINARY_URL && (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET)) {
    return false;
  }

  try {
    configureCloudinary();
    await cloudinary.api.ping();
    return true;
  } catch {
    return false;
  }
}

module.exports = { configureCloudinary, isCloudinaryReady, cloudinary };
