const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const {
  slugifyCategory,
  listActiveCategories,
  invalidateCategoryCache,
} = require('../lib/categories');

const router = express.Router();

// @desc    List shop categories (public)
// @route   GET /api/categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await listActiveCategories();
    res.status(200).json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ success: false, message: 'Error fetching categories' });
  }
});

// @desc    Create category (admin)
// @route   POST /api/categories
// @access  Admin
router.post('/', protect, authorize('admin'), [
  body('label').trim().isLength({ min: 2, max: 60 }).withMessage('Label must be 2–60 characters'),
  body('slug').optional().trim().isLength({ min: 2, max: 40 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const label = req.body.label.trim();
    const slug = (req.body.slug ? slugifyCategory(req.body.slug) : slugifyCategory(label));

    if (!slug || slug.length < 2) {
      return res.status(400).json({ success: false, message: 'Could not generate a valid category slug' });
    }

    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const maxOrder = await Category.findOne().sort({ sortOrder: -1 }).select('sortOrder');
    const sortOrder = (maxOrder?.sortOrder || 0) + 1;

    const category = await Category.create({
      slug,
      label,
      sortOrder,
      isActive: true,
    });
    invalidateCategoryCache();

    res.status(201).json({
      success: true,
      data: { category },
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Error creating category' });
  }
});

// @desc    Delete category (admin)
// @route   DELETE /api/categories/:id
// @access  Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const productCount = await Product.countDocuments({ category: category.slug });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot remove "${category.label}" — ${productCount} product(s) still use it.`,
      });
    }

    await category.deleteOne();
    invalidateCategoryCache();

    res.status(200).json({
      success: true,
      message: 'Category removed',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Error deleting category' });
  }
});

module.exports = router;
