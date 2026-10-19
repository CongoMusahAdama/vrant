const express = require('express');
const { body, validationResult } = require('express-validator');
const ShopOrder = require('../models/ShopOrder');
const { protect, authorize } = require('../middleware/auth');
const { validateShippingAddress } = require('../utils/validateShippingAddress');
const {
  queueAdminNewOrder,
  queueCustomerStatusChange,
} = require('../lib/orderNotifications');
const { escapeRegex } = require('../lib/regex');
const { validateOrderItems, totalsMatch } = require('../lib/orderPricing');

const router = express.Router();

// @desc    Get shop orders (customer: own, admin: all)
// @route   GET /api/shop-orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const query = isAdmin ? {} : { customer: req.user.id, status: { $ne: 'cancelled' } };
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const defaultLimit = isAdmin ? 10 : 5;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || defaultLimit));
    const skip = (page - 1) * limit;

    if (isAdmin && req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    if (isAdmin && req.query.search) {
      const term = escapeRegex(String(req.query.search).trim());
      if (term) {
        query.$or = [
          { orderNumber: { $regex: term, $options: 'i' } },
          { 'shippingAddress.fullName': { $regex: term, $options: 'i' } },
          { 'shippingAddress.phone': { $regex: term, $options: 'i' } },
        ];
      }
    }

    let orderQuery = ShopOrder.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
    if (isAdmin) {
      orderQuery = orderQuery.populate('customer', 'name email phone');
    }

    const [orders, total] = await Promise.all([
      orderQuery,
      ShopOrder.countDocuments(query),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: { page, limit, total, totalPages },
      },
    });
  } catch (error) {
    console.error('Get shop orders error:', error);
    res.status(500).json({ success: false, message: 'Error fetching orders' });
  }
});

// @desc    Create shop order (WhatsApp checkout log)
// @route   POST /api/shop-orders
// @access  Private (customer)
router.post('/', protect, [
  body('items').isArray({ min: 1 }),
  body('shippingAddress.fullName').trim().notEmpty(),
  body('shippingAddress.phone').trim().notEmpty(),
  body('shippingAddress.city').trim().notEmpty(),
  body('shippingAddress.region').trim().notEmpty(),
  body('totalAmount').isNumeric(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { items, shippingAddress, totalAmount } = req.body;
    // This endpoint is WhatsApp checkout only; Paystack orders are created by /api/payments/initialize
    const channel = 'whatsapp';
    const addressError = validateShippingAddress(shippingAddress);
    if (addressError) {
      return res.status(400).json({ success: false, message: addressError });
    }

    const pricing = await validateOrderItems(items);
    if (!pricing.ok) {
      return res.status(400).json({ success: false, message: pricing.message });
    }
    if (!totalsMatch(pricing.totalAmount, totalAmount)) {
      return res.status(400).json({
        success: false,
        message: 'Order total does not match product prices. Please refresh and try again.',
      });
    }

    const order = await ShopOrder.create({
      customer: req.user.id,
      items: pricing.items,
      shippingAddress,
      totalAmount: pricing.totalAmount,
      channel,
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        changedAt: new Date(),
        changedBy: req.user.id,
        note: 'Order placed',
      }],
    });

    queueAdminNewOrder(order);

    res.status(201).json({
      success: true,
      data: { order },
    });
  } catch (error) {
    console.error('Create shop order error:', error);
    res.status(500).json({ success: false, message: 'Error creating order' });
  }
});

// @desc    Update shop order status (admin)
// @route   PUT /api/shop-orders/:id/status
// @access  Admin
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await ShopOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousStatus = order.status;

    if (order.status !== status) {
      order.status = status;
      order.statusHistory.push({
        status,
        changedAt: new Date(),
        changedBy: req.user.id,
        note: `Status updated to ${status}`,
      });
      await order.save();
      queueCustomerStatusChange(order, previousStatus);
    }

    res.status(200).json({ success: true, data: { order } });
  } catch (error) {
    console.error('Update shop order status error:', error);
    res.status(500).json({ success: false, message: 'Error updating order' });
  }
});

module.exports = router;
