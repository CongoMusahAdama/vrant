const express = require('express');
const path = require('path');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const { uploadMultipleImages } = require('../middleware/upload');
const { withNormalizedImages } = require('../lib/imageUrls');
const { isValidCategorySlug } = require('../lib/categories');
const { resolveUploadedImageUrl } = require('../lib/uploadImage');
const { deleteCloudinaryUrls, collectProductImageUrls } = require('../lib/cloudinaryAssets');
const { MAX_PRODUCT_PAGE_LIMIT } = require('../lib/constants');

const ALLOWED_SORT_FIELDS = new Set(['createdAt', 'price', 'name', 'stock']);

async function buildImagesFromUploads(files) {
  const uploaded = await Promise.all(
    files.map((file) => resolveUploadedImageUrl(file, 'products'))
  );

  if (!uploaded.length) {
    return { front: '', back: '', additional: [] };
  }

  return {
    front: uploaded[0],
    back: uploaded[1] || uploaded[0],
    additional: uploaded.slice(2),
  };
}

async function appendUploadedImages(files) {
  return Promise.all(files.map((file) => resolveUploadedImageUrl(file, 'products')));
}

const ALLOWED_SIZES = new Set(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size', '28', '30', '32', '34', '36', '38', '39', '40', '41', '42', '43', '44', '45', '46']);

function parseSizesFromBody(sizesInput, stock = 0) {
  if (!sizesInput) return [];
  try {
    const parsed = typeof sizesInput === 'string' ? JSON.parse(sizesInput) : sizesInput;
    if (!Array.isArray(parsed)) return [];

    const names = parsed
      .map((entry) => {
        if (typeof entry === 'string') return entry.trim();
        if (entry?.name) return String(entry.name).trim();
        return '';
      })
      .filter((name) => ALLOWED_SIZES.has(name));

    return [...new Set(names)].map((name) => ({
      name,
      stock: Math.max(0, Number(stock) || 0),
    }));
  } catch {
    return [];
  }
}

function parseImageLabelsFromBody(labelsInput) {
  if (!labelsInput) return null;
  try {
    const parsed = typeof labelsInput === 'string' ? JSON.parse(labelsInput) : labelsInput;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      front: String(parsed.front || '').trim(),
      back: String(parsed.back || '').trim(),
      additional: Array.isArray(parsed.additional)
        ? parsed.additional.map((label) => String(label || '').trim())
        : [],
    };
  } catch {
    return null;
  }
}

function parseColorsFromBody(colorsInput) {
  if (!colorsInput) return [];
  try {
    const parsed = typeof colorsInput === 'string' ? JSON.parse(colorsInput) : colorsInput;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => {
        if (typeof entry === 'string') {
          const name = entry.trim();
          return name ? { name } : null;
        }
        if (entry?.name) {
          const name = String(entry.name).trim();
          return name ? { name, code: entry.code || undefined } : null;
        }
        return null;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

const router = express.Router();

// @desc    Get all products (public)
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      search, 
      sort = 'createdAt',
      order = 'desc',
      minPrice,
      maxPrice
    } = req.query;

    // Build query
    let query = { isActive: true };

    if (category) {
      query.category = category.toLowerCase();
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const sortField = ALLOWED_SORT_FIELDS.has(String(sort)) ? String(sort) : 'createdAt';
    const sortObj = { [sortField]: order === 'desc' ? -1 : 1 };
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(MAX_PRODUCT_PAGE_LIMIT, Math.max(1, parseInt(limit, 10) || 12));

    const products = await Product.find(query)
      .sort(sortObj)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .populate('createdBy', 'name');

    // Get total count
    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        products: products.map(withNormalizedImages),
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalProducts: total,
          hasNextPage: pageNum * limitNum < total,
          hasPrevPage: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.getFeatured();

    res.status(200).json({
      success: true,
      data: { products: products.map(withNormalizedImages) },
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products',
    });
  }
});

// @desc    Get new arrivals
// @route   GET /api/products/new-arrivals
// @access  Public
router.get('/new-arrivals', async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const products = await Product.getNewArrivals(limit);

    res.status(200).json({
      success: true,
      data: { products: products.map(withNormalizedImages) },
    });
  } catch (error) {
    console.error('Get new arrivals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching new arrivals',
    });
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('reviews.user', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { product: withNormalizedImages(product) }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product'
    });
  }
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), uploadMultipleImages, [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 99 })
    .withMessage('Discount must be between 0 and 99'),
  body('originalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Original price must be a positive number')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, description, price, category, stock, originalPrice, discount, tags, imageRoles, imageLabels, soldOut, colors, sizes } = req.body;
    const parsedColors = parseColorsFromBody(colors);
    const parsedStock = parseInt(stock, 10);
    const isSoldOut = soldOut === true || soldOut === 'true' || parsedStock <= 0;
    const parsedSizes = parseSizesFromBody(sizes, isSoldOut ? 0 : parsedStock);

    if (!(await isValidCategorySlug(category))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category — add it under Categories first',
      });
    }

    if (parsedColors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one available color is required',
      });
    }

    if (parsedSizes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one available size is required',
      });
    }

    const files = req.files?.length ? req.files : req.file ? [req.file] : [];

    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one product image is required',
      });
    }

    const images = await buildImagesFromUploads(files);
    const parsedImageLabels = parseImageLabelsFromBody(imageLabels);

    const salePrice = parseFloat(price);
    let resolvedOriginalPrice = originalPrice ? parseFloat(originalPrice) : undefined;

    if (!resolvedOriginalPrice && discount) {
      const pct = parseFloat(discount);
      if (pct > 0 && pct < 100) {
        resolvedOriginalPrice = Math.round((salePrice / (1 - pct / 100)) * 100) / 100;
      }
    }

    if (resolvedOriginalPrice && resolvedOriginalPrice <= salePrice) {
      resolvedOriginalPrice = undefined;
    }

    // Create product
    const product = await Product.create({
      name,
      description,
      price: salePrice,
      originalPrice: resolvedOriginalPrice,
      category: category.toLowerCase(),
      stock: isSoldOut ? 0 : parsedStock,
      soldOut: isSoldOut,
      images,
      imageLabels: parsedImageLabels || { front: '', back: '', additional: [] },
      colors: parsedColors,
      sizes: parsedSizes,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product'
    });
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), uploadMultipleImages, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 99 })
    .withMessage('Discount must be between 0 and 99'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const files = req.files?.length ? req.files : req.file ? [req.file] : [];
    if (files.length) {
      const extraUrls = await appendUploadedImages(files);
      product.images.additional = [...(product.images.additional || []), ...extraUrls];
    }

    const { name, description, price, category, stock, originalPrice, discount, tags, imageLabels, soldOut, colors, sizes } = req.body;

    if (imageLabels !== undefined) {
      const parsedImageLabels = parseImageLabelsFromBody(imageLabels);
      if (parsedImageLabels) {
        product.imageLabels = parsedImageLabels;
      }
    }

    if (colors !== undefined) {
      const parsedColors = parseColorsFromBody(colors);
      if (parsedColors.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one available color is required',
        });
      }
      product.colors = parsedColors;
    }

    if (sizes !== undefined) {
      const stockForSizes =
        stock !== undefined ? parseInt(stock, 10) : product.stock;
      const parsedSizes = parseSizesFromBody(sizes, stockForSizes);
      if (parsedSizes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one available size is required',
        });
      }
      product.sizes = parsedSizes;
    }

    if (category !== undefined && !(await isValidCategorySlug(category))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category — add it under Categories first',
      });
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category.toLowerCase();
    if (tags !== undefined) {
      product.tags = tags ? tags.split(',').map((tag) => tag.trim()) : [];
    }

    if (price !== undefined) {
      const salePrice = parseFloat(price);
      product.price = salePrice;

      let resolvedOriginalPrice = originalPrice ? parseFloat(originalPrice) : undefined;
      if (!resolvedOriginalPrice && discount) {
        const pct = parseFloat(discount);
        if (pct > 0 && pct < 100) {
          resolvedOriginalPrice = Math.round((salePrice / (1 - pct / 100)) * 100) / 100;
        }
      }
      if (resolvedOriginalPrice && resolvedOriginalPrice > salePrice) {
        product.originalPrice = resolvedOriginalPrice;
      } else if (discount === '' || discount === '0') {
        product.originalPrice = undefined;
      }
    }

    if (stock !== undefined) {
      product.stock = parseInt(stock, 10);
      if (product.stock > 0 && soldOut !== 'true' && soldOut !== true) {
        product.soldOut = false;
      }
      if (product.sizes?.length) {
        product.sizes = product.sizes.map((entry) => ({
          name: entry.name,
          stock: product.stock,
        }));
      }
    }

    if (soldOut !== undefined) {
      const isSoldOut = soldOut === true || soldOut === 'true';
      product.soldOut = isSoldOut;
      if (isSoldOut) product.stock = 0;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product'
    });
  }
});

// @desc    Quick inventory update (stock / sold out)
// @route   PATCH /api/products/:id/inventory
// @access  Private (Admin only)
router.patch('/:id/inventory', protect, authorize('admin'), [
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be non-negative'),
  body('soldOut').optional().isBoolean().withMessage('soldOut must be boolean'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { stock, soldOut } = req.body;

    if (soldOut === true) {
      product.soldOut = true;
      product.stock = 0;
    } else if (soldOut === false) {
      product.soldOut = false;
      if (stock !== undefined) product.stock = parseInt(stock, 10);
    } else if (stock !== undefined) {
      product.stock = parseInt(stock, 10);
      if (product.stock > 0) product.soldOut = false;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: product.soldOut ? 'Product marked as sold out' : 'Inventory updated',
      data: { product },
    });
  } catch (error) {
    console.error('Inventory update error:', error);
    res.status(500).json({ success: false, message: 'Error updating inventory' });
  }
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await deleteCloudinaryUrls(collectProductImageUrls(product.images));
    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product'
    });
  }
});

// @desc    Add product review
// @route   POST /api/products/:id/reviews
// @access  Private
router.post('/:id/reviews', protect, [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user already reviewed this product
    const existingReview = product.reviews.find(
      review => review.user.toString() === req.user.id
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Add review
    await product.addReview(req.user.id, req.body.rating, req.body.comment);

    res.status(200).json({
      success: true,
      message: 'Review added successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding review'
    });
  }
});

module.exports = router;
