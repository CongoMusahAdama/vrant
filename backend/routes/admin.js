const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const ShopOrder = require('../models/ShopOrder');
const { protect, authorize } = require('../middleware/auth');

const COMPLETED_STATUSES = ['delivered', 'shipped'];
const PAID_MATCH = { $or: [{ paymentStatus: 'paid' }, { status: { $in: COMPLETED_STATUSES } }] };

const { withNormalizedImages } = require('../lib/imageUrls');
const { escapeRegex } = require('../lib/regex');

const router = express.Router();

// @desc    Create or reset admin from .env (dev) or first-time setup (prod)
// @route   POST /api/admin/setup
// @access  Public (must stay above admin auth middleware)
router.post('/setup', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_ADMIN_SETUP !== 'true') {
      return res.status(403).json({
        success: false,
        message: 'Admin setup is disabled in production. Set ALLOW_ADMIN_SETUP=true to enable first-time setup.',
      });
    }

    const email = (req.body.email || process.env.ADMIN_EMAIL || 'admin@vrant.com')
      .trim()
      .toLowerCase();
    const password = req.body.password || process.env.ADMIN_PASSWORD || 'admin123';
    const isDev = process.env.NODE_ENV !== 'production';

    let user = await User.findOne({ email }).select('+password');

    if (user) {
      if (!isDev) {
        return res.status(400).json({
          success: false,
          message: 'User already exists. Reset is only allowed in development.',
        });
      }
      user.password = password;
      user.role = 'admin';
      user.isActive = true;
      if (!user.name) user.name = 'VRANT Admin';
      await user.save();
      return res.status(200).json({
        success: true,
        message: 'Admin credentials updated',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
    }

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin && !isDev) {
      return res.status(400).json({
        success: false,
        message: 'Admin user already exists',
      });
    }

    const admin = await User.create({
      name: 'VRANT Admin',
      email,
      password,
      role: 'admin',
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Default admin user created successfully',
      data: {
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      },
    });
  } catch (error) {
    console.error('Setup admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating admin user',
    });
  }
});

// All other admin routes require authentication
router.use(protect, authorize('admin'));

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
router.get('/dashboard', async (req, res) => {
  try {
    const { LOW_STOCK_THRESHOLD } = require('../lib/constants');
    const trendStart = new Date();
    trendStart.setDate(trendStart.getDate() - 29);
    trendStart.setHours(0, 0, 0, 0);

    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      totalSales,
      recentOrders,
      lowStockProducts,
      monthlyRevenue,
      topProducts,
      revenueTrend,
      orderValueTotal,
    ] = await Promise.all([
      Product.countDocuments(),
      ShopOrder.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      ShopOrder.aggregate([
        { $match: PAID_MATCH },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      ShopOrder.find()
        .populate('customer', 'name email phone')
        .sort({ createdAt: -1 })
        .limit(5),
      Product.find({ stock: { $lte: LOW_STOCK_THRESHOLD } })
        .select('name stock category images')
        .limit(10),
      ShopOrder.aggregate([
        { $match: PAID_MATCH },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 6 },
      ]),
      ShopOrder.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            name: { $first: '$items.name' },
            totalSold: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.priceAmount', '$items.quantity'] } },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
      ]),
      ShopOrder.aggregate([
        {
          $match: {
            createdAt: { $gte: trendStart },
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      ShopOrder.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalSales: totalSales[0]?.total || 0,
          totalOrders,
          totalCustomers,
          totalProducts,
          recentSales: monthlyRevenue[0]?.revenue || 0,
          lowStockProducts: lowStockProducts.length,
          orderValueTotal: orderValueTotal[0]?.total || 0,
        },
        recentOrders,
        lowStockProducts,
        monthlyRevenue,
        topProducts,
        revenueTrend,
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Sales growth
    const currentPeriodSales = await ShopOrder.aggregate([
      { $match: { createdAt: { $gte: startDate }, ...PAID_MATCH } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);
    const previousPeriodSales = await ShopOrder.aggregate([
      {
        $match: {
          createdAt: { $gte: previousStartDate, $lt: startDate },
          ...PAID_MATCH,
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const currentSales = currentPeriodSales[0]?.total || 0;
    const previousSales = previousPeriodSales[0]?.total || 0;
    const salesGrowth = previousSales > 0 ? ((currentSales - previousSales) / previousSales) * 100 : 0;

    // Order growth
    const currentPeriodOrders = await ShopOrder.countDocuments({ createdAt: { $gte: startDate } });
    const previousPeriodOrders = await ShopOrder.countDocuments({
      createdAt: { $gte: previousStartDate, $lt: startDate },
    });
    const orderGrowth = previousPeriodOrders > 0 ? ((currentPeriodOrders - previousPeriodOrders) / previousPeriodOrders) * 100 : 0;

    // Customer growth
    const currentPeriodCustomers = await User.countDocuments({ 
      role: 'customer', 
      createdAt: { $gte: startDate } 
    });
    const previousPeriodCustomers = await User.countDocuments({ 
      role: 'customer', 
      createdAt: { $gte: previousStartDate, $lt: startDate } 
    });
    const customerGrowth = previousPeriodCustomers > 0 ? ((currentPeriodCustomers - previousPeriodCustomers) / previousPeriodCustomers) * 100 : 0;

    // Product views (simulated - in real app, you'd track this)
    const productViews = 0;
    const productViewsGrowth = 0;

    // Daily sales for chart
    const dailySales = await ShopOrder.aggregate([
      { $match: { createdAt: { $gte: startDate }, ...PAID_MATCH } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const categoryPerformance = await ShopOrder.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          revenue: { $sum: { $multiply: ['$items.priceAmount', '$items.quantity'] } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        growth: {
          salesGrowth: Math.round(salesGrowth * 100) / 100,
          orderGrowth: Math.round(orderGrowth * 100) / 100,
          customerGrowth: Math.round(customerGrowth * 100) / 100,
          productViewsGrowth: Math.round(productViewsGrowth * 100) / 100
        },
        dailySales,
        categoryPerformance
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics data'
    });
  }
});

// @desc    List all products (admin catalog)
// @route   GET /api/admin/products
// @access  Private (Admin only)
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, category } = req.query;
    let query = {};
    if (category && category !== 'all') {
      query.category = String(category).toLowerCase();
    }
    if (search) {
      const term = escapeRegex(String(search).trim());
      if (term) {
        query.$or = [
          { name: { $regex: term, $options: 'i' } },
          { description: { $regex: term, $options: 'i' } },
        ];
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        products: products.map(withNormalizedImages),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.max(1, Math.ceil(total / limitNum)),
        },
      },
    });
  } catch (error) {
    console.error('Admin products error:', error);
    res.status(500).json({ success: false, message: 'Error fetching products' });
  }
});

// @desc    Get system health
// @route   GET /api/admin/health
// @access  Private (Admin only)
router.get('/health', async (req, res) => {
  try {
    const dbStatus = 'connected'; // You can add more sophisticated DB health checks
    
    const stats = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      database: dbStatus
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking system health'
    });
  }
});

module.exports = router;
