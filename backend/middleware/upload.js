const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { configureCloudinary } = require('../lib/cloudinaryClient');
const { MAX_UPLOAD_BYTES, MAX_PRODUCT_IMAGES } = require('../lib/constants');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const cloudinary = configureCloudinary();

const MAX_UPLOAD_MB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));

function fileTooLargeMessage() {
  return `File size too large. Maximum size is ${MAX_UPLOAD_MB}MB per image`;
}

/** Allowed image types → the only extensions we ever write (never trust the original filename) */
const IMAGE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}.${IMAGE_EXTENSIONS[file.mimetype]}`);
  },
});

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
  },
  fileFilter: (req, file, cb) => {
    if (IMAGE_EXTENSIONS[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WebP or GIF images are allowed'), false);
    }
  },
});

// Single image upload
const uploadSingle = upload.single('image');

const uploadSettingsFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'heroImage', maxCount: 1 },
  { name: 'heroImageLeft', maxCount: 1 },
  { name: 'heroImageRight', maxCount: 1 },
]);

// Multiple images upload
const uploadMultiple = upload.array('images', MAX_PRODUCT_IMAGES);

// Wrapper for single upload with error handling
const uploadSingleImage = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: fileTooLargeMessage(),
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
};

// Wrapper for multiple upload with error handling
const uploadMultipleImages = (req, res, next) => {
  uploadMultiple(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: fileTooLargeMessage(),
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: `Too many files. Maximum is ${MAX_PRODUCT_IMAGES} images`,
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
};

// Upload image to Cloudinary
const uploadToCloudinary = async (file, folder = 'vrant') => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: folder,
      transformation: [
        { width: 1600, height: 1600, crop: 'limit' },
        { quality: 'auto:good' },
      ],
    });
    return result;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

const { deleteCloudinaryUrl } = require('../lib/cloudinaryAssets');

// Delete image from Cloudinary by URL or public_id
const deleteImage = async (urlOrPublicId) => {
  return deleteCloudinaryUrl(urlOrPublicId);
};

const uploadSettingsImages = (req, res, next) => {
  uploadSettingsFields(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: fileTooLargeMessage(),
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
};

module.exports = {
  upload,
  uploadSingleImage,
  uploadSettingsImages,
  uploadMultipleImages,
  deleteImage,
  uploadToCloudinary,
  MAX_UPLOAD_BYTES,
  MAX_PRODUCT_IMAGES,
};
