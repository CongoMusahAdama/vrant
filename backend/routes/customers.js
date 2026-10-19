const express = require('express');
const User = require('../models/User');
const ShopOrder = require('../models/ShopOrder');
const { escapeRegex } = require('../lib/regex');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { anonymizeCustomerUser, isDeletedCustomerEmail } = require('../lib/customerAccount');

const router = express.Router();

// @desc    Get all customers (admin only)
// @route   GET /api/customers
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    let query = {
      role: 'customer',
      isActive: true,
      email: { $not: /@deleted.vrant.local$/i },
    };

    if (search) {
      const term = escapeRegex(String(search).trim());
      if (term) {
        query.$or = [
          { name: { $regex: term, $options: 'i' } },
          { email: { $regex: term, $options: 'i' } },
          { phone: { $regex: term, $options: 'i' } },
        ];
      }
    }

    const customers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);
    const customerIds = customers.map((c) => c._id);
    const orderCounts = customerIds.length
      ? await ShopOrder.aggregate([
          { $match: { customer: { $in: customerIds } } },
          { $group: { _id: '$customer', count: { $sum: 1 } } },
        ])
      : [];
    const orderCountById = new Map(
      orderCounts.map((row) => [row._id.toString(), row.count])
    );

    const customersWithStats = customers.map((customer) => ({
      ...customer.toObject(),
      orderCount: orderCountById.get(customer._id.toString()) || 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        customers: customersWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCustomers: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers'
    });
  }
});

// @desc    Get single customer (admin only)
// @route   GET /api/customers/:id
// @access  Private (Admin only)
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const customer = await User.findById(req.params.id)
      .select('-password');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    if (customer.role !== 'customer') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const paidStatuses = ['delivered', 'shipped', 'confirmed', 'processing'];
    const [orders, totalOrders, totalSpent, lastOrder] = await Promise.all([
      ShopOrder.find({ customer: customer._id })
        .sort({ createdAt: -1 })
        .limit(10),
      ShopOrder.countDocuments({ customer: customer._id }),
      ShopOrder.aggregate([
        {
          $match: {
            customer: customer._id,
            $or: [
              { paymentStatus: 'paid' },
              { status: { $in: paidStatuses } },
            ],
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      ShopOrder.findOne({ customer: customer._id }).sort({ createdAt: -1 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        customer: {
          ...customer.toObject(),
          totalOrders,
          totalSpent: totalSpent[0]?.total || 0,
          lastOrder: lastOrder ? {
            id: lastOrder._id,
            orderNumber: lastOrder.orderNumber,
            totalAmount: lastOrder.totalAmount,
            status: lastOrder.status,
            createdAt: lastOrder.createdAt
          } : null
        },
        recentOrders: orders
      }
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer'
    });
  }
});

// @desc    Update customer (admin only)
// @route   PUT /api/customers/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional({ values: 'null' }).trim(),
  body('isActive').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || 'Validation failed',
      });
    }

    const { name, email, phone, isActive, addresses } = req.body;

    const customer = await User.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    if (customer.role !== 'customer') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    if (name) customer.name = name;
    if (email && email !== customer.email) {
      const existing = await User.findOne({ email });
      if (existing && existing._id.toString() !== customer._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Another account already uses this email',
        });
      }
      customer.email = email;
    }
    if (phone !== undefined) customer.phone = phone ? String(phone).trim() : undefined;
    if (isActive !== undefined) customer.isActive = isActive;
    if (addresses) customer.addresses = addresses;

    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: { customer }
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating customer'
    });
  }
});

// @desc    Delete customer account (admin — anonymize, orders kept)
// @route   DELETE /api/customers/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const customer = await User.findById(req.params.id).select('+password');
    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    if (isDeletedCustomerEmail(customer.email)) {
      return res.status(400).json({
        success: false,
        message: 'Customer account is already deleted',
      });
    }

    await anonymizeCustomerUser(customer);

    res.status(200).json({
      success: true,
      message: 'Customer account deleted',
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting customer',
    });
  }
});

// @desc    Get customer statistics (admin only)
// @route   GET /api/customers/stats/overview
// @access  Private (Admin only)
router.get('/stats/overview', protect, authorize('admin'), async (req, res) => {
  try {
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const activeCustomers = await User.countDocuments({ role: 'customer', isActive: true });
    const newCustomersThisMonth = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });

    // Top customers by spending
    const topCustomers = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped'] } } },
      {
        $group: {
          _id: '$customer',
          totalSpent: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      {
        $project: {
          name: '$customer.name',
          email: '$customer.email',
          totalSpent: 1,
          orderCount: 1
        }
      }
    ]);

    // Customer growth over time
    const customerGrowth = await User.aggregate([
      { $match: { role: 'customer' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        activeCustomers,
        newCustomersThisMonth,
        topCustomers,
        customerGrowth
      }
    });
  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer statistics'
    });
  }
});

module.exports = router;
