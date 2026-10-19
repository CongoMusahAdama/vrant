const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');
const CustomRequest = require('../models/CustomRequest');
const { CUSTOM_REQUEST_STATUSES, GARMENT_TYPES } = require('../models/CustomRequest');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { resolveUploadedImageUrls } = require('../lib/uploadImage');
const { deleteCloudinaryUrl } = require('../lib/cloudinaryAssets');
const { isValidPhoneInput } = require('../lib/phone');
const { queueAdminCustomRequest } = require('../lib/customRequestNotifications');

const router = express.Router();

const MAX_DESIGN_IMAGES = 4;
const uploadDesignImages = upload.array('images', MAX_DESIGN_IMAGES);

/** Public form with file uploads: keep spam and storage abuse in check */
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many design requests. Please try again in an hour.' },
});

/** multer errors → clean 400s */
function withUpload(req, res, next) {
  uploadDesignImages(req, res, (err) => {
    if (!err) return next();
    const message =
      err instanceof multer.MulterError && err.code === 'LIMIT_FILE_COUNT'
        ? `You can attach up to ${MAX_DESIGN_IMAGES} images`
        : err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
          ? 'One of the images is too large'
          : err.message;
    res.status(400).json({ success: false, message });
  });
}

function firstError(req) {
  const errors = validationResult(req);
  return errors.isEmpty() ? null : errors.array()[0].msg;
}

// @desc    Submit a custom design request (with optional reference images)
// @route   POST /api/custom-requests
// @access  Public (signed-in customers are linked automatically)
router.post('/', submitLimiter, optionalAuth, withUpload, [
  body('name').trim().notEmpty().withMessage('Please enter your name').isLength({ max: 100 }),
  body('phone').trim().notEmpty().withMessage('Please enter your phone number').bail().custom(isValidPhoneInput).withMessage('Please enter a valid phone number'),
  body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage('Please enter a valid email'),
  body('garmentType').isIn(GARMENT_TYPES).withMessage('Please choose what you would like made'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Please describe your design (at least 10 characters)'),
  body('sizing').optional().trim().isLength({ max: 600 }),
  body('fabricPreference').optional().trim().isLength({ max: 200 }),
  body('budget').optional().trim().isLength({ max: 80 }),
  body('neededBy').optional({ checkFalsy: true }).isISO8601().withMessage('Please choose a valid date'),
], async (req, res) => {
  try {
    const error = firstError(req);
    if (error) return res.status(400).json({ success: false, message: error });

    const images = req.files?.length ? await resolveUploadedImageUrls(req.files, 'custom-designs') : [];
    const { name, phone, email, garmentType, description, sizing, fabricPreference, budget, neededBy } = req.body;

    const request = await CustomRequest.create({
      customer: req.user?._id,
      name,
      phone,
      email: email || undefined,
      garmentType,
      description,
      sizing,
      fabricPreference,
      budget,
      neededBy: neededBy || undefined,
      images,
    });

    queueAdminCustomRequest(request);

    res.status(201).json({
      success: true,
      message: 'Design received',
      data: { reference: request.reference },
    });
  } catch (err) {
    console.error('Custom request create error:', err);
    // Customers never see storage/config details — the real error is in the log above
    const message = err.message?.startsWith('Image upload failed')
      ? 'We could not upload your images just now. Please try again, or send the design without images and share them with us on WhatsApp.'
      : 'Could not send your design. Please try again.';
    res.status(500).json({ success: false, message });
  }
});

// Everything below is admin only
router.use(protect, authorize('admin'));

// @desc    List custom design requests
// @route   GET /api/custom-requests?status=new&page=1&limit=20
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const filter = CUSTOM_REQUEST_STATUSES.includes(req.query.status) ? { status: req.query.status } : {};

    const [items, total, counts] = await Promise.all([
      CustomRequest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      CustomRequest.countDocuments(filter),
      CustomRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    res.json({
      success: true,
      data: {
        items,
        counts: Object.fromEntries(counts.map((c) => [c._id, c.count])),
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      },
    });
  } catch (err) {
    console.error('Custom request list error:', err);
    res.status(500).json({ success: false, message: 'Could not load custom requests' });
  }
});

// @desc    Update status and/or private notes
// @route   PATCH /api/custom-requests/:id
router.patch('/:id', [
  param('id').isMongoId(),
  body('status').optional().isIn(CUSTOM_REQUEST_STATUSES).withMessage('Invalid status'),
  body('adminNotes').optional().trim().isLength({ max: 2000 }),
], async (req, res) => {
  try {
    const error = firstError(req);
    if (error) return res.status(400).json({ success: false, message: error });

    const update = {};
    if (req.body.status !== undefined) update.status = req.body.status;
    if (req.body.adminNotes !== undefined) update.adminNotes = req.body.adminNotes;

    const request = await CustomRequest.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    res.json({ success: true, data: { request } });
  } catch (err) {
    console.error('Custom request update error:', err);
    res.status(500).json({ success: false, message: 'Could not update request' });
  }
});

// @desc    Delete a request and its uploaded images
// @route   DELETE /api/custom-requests/:id
router.delete('/:id', [param('id').isMongoId()], async (req, res) => {
  try {
    const request = await CustomRequest.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    await Promise.all(request.images.map((url) => deleteCloudinaryUrl(url).catch(() => {})));
    res.json({ success: true, message: 'Request deleted' });
  } catch (err) {
    console.error('Custom request delete error:', err);
    res.status(500).json({ success: false, message: 'Could not delete request' });
  }
});

module.exports = router;
