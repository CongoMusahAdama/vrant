const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const customerRoutes = require('./routes/customers');
const adminRoutes = require('./routes/admin');
const shopOrderRoutes = require('./routes/shopOrders');
const paymentRoutes = require('./routes/payments');
const paystackWebhookHandler = paymentRoutes.paystackWebhookHandler;
const galleryRoutes = require('./routes/gallery');
const categoryRoutes = require('./routes/categories');
const settingsRoutes = require('./routes/settings');
const seoRoutes = require('./routes/seo');
const customRequestRoutes = require('./routes/customRequests');
const { connectDb } = require('./lib/db');

const app = express();

// Behind Vercel's proxy: use the real client IP (X-Forwarded-For) for rate limiting
app.set('trust proxy', 1);

// Security middleware — allow shop/admin on another origin to load /uploads images
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
// The site and API share one Vercel domain, so same-origin requests are always allowed.
// Extra origins (e.g. a second custom domain) go in CORS_ORIGINS, comma-separated.
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
  ...(process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()),
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
]
  .filter(Boolean)
  .map((o) => o.replace(/\/$/, ''));

app.use(
  cors((req, callback) => {
    const origin = req.header('Origin');
    const sameOrigin = origin && origin === `https://${req.headers.host}`;
    // Unknown origin: send no CORS headers, so the browser blocks it (no 500, no stack trace)
    const allowed = !origin || sameOrigin || allowedOrigins.includes(origin);
    callback(null, { origin: allowed, credentials: true });
  })
);

const {
  AUTH_RATE_LIMIT_WINDOW_MS,
  AUTH_RATE_LIMIT_MAX,
  API_RATE_LIMIT_WINDOW_MS,
  API_RATE_LIMIT_MAX,
} = require('./lib/constants');

// Stricter rate limit on auth endpoints
const authLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// General API rate limiting (per client IP). Paystack webhooks and health checks are never limited.
const limiter = rateLimit({
  windowMs: API_RATE_LIMIT_WINDOW_MS,
  max: API_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/payments/webhook' || req.path === '/health',
  message: { success: false, message: 'Too many requests. Please slow down and try again shortly.' },
});
app.use('/api/', limiter);

// Logging middleware
app.use(morgan('combined'));

// Every API route except the health check needs the database (connection is reused between requests)
app.use('/api', async (req, res, next) => {
  if (req.path === '/health') return next();
  try {
    await connectDb();
    next();
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    res.status(503).json({
      success: false,
      message: 'The shop is temporarily unavailable. Please try again in a moment.',
    });
  }
});

// Paystack webhook needs raw body for signature verification
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  paystackWebhookHandler
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (always serve from backend/uploads regardless of process cwd)
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d',
    setHeaders(res) {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
    },
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shop-orders', shopOrderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use(seoRoutes);
app.use('/api/custom-requests', customRequestRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  await connectDb().catch(() => {});
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
  res.status(dbState === 1 ? 200 : 503).json({ 
    status: dbState === 1 ? 'OK' : 'DEGRADED',
    database: dbStatus,
    message: 'VRANT API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// API 404
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// API only — the website is served by Vercel
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16)
) {
  throw new Error('JWT_SECRET must be set and at least 16 characters in production');
}

// Local development: `node server.js` runs a normal server. On Vercel the app is imported by api/index.js.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  });
  connectDb().catch((err) => console.error(`❌ MongoDB connection failed: ${err.message}`));
}

module.exports = app;
