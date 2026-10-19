const express = require('express');
const { body, validationResult } = require('express-validator');
const GalleryItem = require('../models/GalleryItem');
const { protect, authorize } = require('../middleware/auth');
const { uploadSingleImage } = require('../middleware/upload');
const { normalizeStoredImageUrl } = require('../lib/imageUrls');
const { resolveUploadedImageUrl } = require('../lib/uploadImage');
const { deleteCloudinaryUrl } = require('../lib/cloudinaryAssets');

const router = express.Router();

// @desc    List gallery images (public)
// @route   GET /api/gallery
router.get('/', async (req, res) => {
  try {
    const items = await GalleryItem.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 });
    res.status(200).json({
      success: true,
      data: {
        items: items.map((item) => {
          const doc = item.toObject ? item.toObject() : item;
          if (doc.image) doc.image = normalizeStoredImageUrl(doc.image);
          return doc;
        }),
      },
    });
  } catch (error) {
    console.error('Gallery list error:', error);
    res.status(500).json({ success: false, message: 'Error fetching gallery' });
  }
});

// @desc    Add gallery image (admin)
// @route   POST /api/gallery
router.post('/', protect, authorize('admin'), uploadSingleImage, [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('caption').optional().trim().isLength({ max: 300 }),
  body('category').optional().isIn(['lookbook', 'sets', 'shirts', 'jeans', 'footwear', 'accessories']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const imageUrl = await resolveUploadedImageUrl(req.file, 'gallery');
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }

    const item = await GalleryItem.create({
      name: req.body.name.trim(),
      caption: req.body.caption?.trim() || '',
      category: (req.body.category || 'lookbook').toLowerCase(),
      image: imageUrl,
    });

    res.status(201).json({ success: true, data: { item } });
  } catch (error) {
    console.error('Gallery create error:', error);
    res.status(500).json({ success: false, message: 'Error adding gallery image' });
  }
});

// @desc    Delete gallery image (admin)
// @route   DELETE /api/gallery/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    if (item.image) {
      await deleteCloudinaryUrl(item.image);
    }

    await GalleryItem.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Gallery image removed' });
  } catch (error) {
    console.error('Gallery delete error:', error);
    res.status(500).json({ success: false, message: 'Error deleting gallery image' });
  }
});

module.exports = router;
