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
const { isPaystackConfigured, getPaystackKeyStatus } = require('./lib/paystack');
const { isBrevoConfigured } = require('./lib/brevo');
const { isMnotifyConfigured } = require('./lib/mnotify');
const galleryRoutes = require('./routes/gallery');
const categoryRoutes = require('./routes/categories');
const settingsRoutes = require('./routes/settings');
const customRequestRoutes = require('./routes/customRequests');
const { ensureDefaultCategories } = require('./lib/categories');

const app = express();

// Behind Render's proxy: use the real client IP (X-Forwarded-For) for rate limiting
app.set('trust proxy', 1);

// Security middleware — allow shop/admin on another origin to load /uploads images
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
// Explicit allow-list only. Extra origins (e.g. a custom domain or Vercel preview) go in CORS_ORIGINS, comma-separated.
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.RENDER_EXTERNAL_URL,
  ...(process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()),
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
]
  .filter(Boolean)
  .map((o) => o.replace(/\/$/, ''));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    // Unknown origin: send no CORS headers, so the browser blocks it (no 500, no stack trace)
    callback(null, false);
  },
  credentials: true,
}));

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
app.use('/api/custom-requests', customRequestRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
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

// MongoDB connection
async function warnIfCloudinaryMisconfigured() {
  const { isCloudinaryReady } = require('./lib/cloudinaryClient');
  if (await isCloudinaryReady()) {
    console.log('✅ Cloudinary connected');
    return;
  }
  console.warn(
    '⚠️  Cloudinary misconfigured — use the exact Cloud name from console.cloudinary.com on Render.'
  );
}

if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16)
) {
  console.error('❌ JWT_SECRET must be set and at least 16 characters in production');
  process.exit(1);
}

// ── Start the Express server immediately so frontend never gets ERR_CONNECTION_REFUSED ──
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
});

// ── MongoDB connection with retry logic ──
const RETRY_DELAY_MS = 15_000; // retry every 15s indefinitely

async function connectWithRetry(attempt = 1) {
  try {
    console.log(`🔄 MongoDB connection attempt ${attempt}...`);
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15_000,
      socketTimeoutMS: 45_000,
      family: 4,
    });
    console.log('✅ Connected to MongoDB');
    await ensureDefaultCategories();
    await warnIfCloudinaryMisconfigured();
    if (isPaystackConfigured()) {
      const paystackKeys = getPaystackKeyStatus();
      if (paystackKeys.matched && paystackKeys.mode === 'live') {
        console.log('✅ Paystack configured (LIVE mode)');
      } else if (paystackKeys.matched && paystackKeys.mode === 'test') {
        console.log('✅ Paystack configured (TEST mode)');
      } else {
        console.warn(
          `⚠️  Paystack key mismatch — public=${paystackKeys.publicMode}, secret=${paystackKeys.secretMode}.`
        );
      }
    } else {
      console.warn('⚠️  Paystack keys missing — add PAYSTACK_PUBLIC_KEY and PAYSTACK_SECRET_KEY to backend/.env');
    }
    if (isBrevoConfigured()) {
      console.log('✅ Brevo configured (transactional email enabled)');
    } else {
      console.warn('⚠️  Brevo not configured — add BREVO_API_KEY and BREVO_SENDER_EMAIL to backend/.env');
    }
    if (isMnotifyConfigured()) {
      console.log('✅ Mnotify configured (transactional SMS enabled)');
      if (!process.env.ADMIN_NOTIFY_PHONE?.trim()) {
        console.warn('⚠️  ADMIN_NOTIFY_PHONE missing — admin order SMS alerts will not be sent');
      }
    } else {
      console.warn('⚠️  Mnotify not configured — add MNOTIFY_API_KEY and MNOTIFY_SENDER_ID to backend/.env');
    }
  } catch (err) {
    console.error(`❌ MongoDB attempt ${attempt} failed: ${err.message}`);
    console.log(`⏳ Retrying in ${RETRY_DELAY_MS / 1000}s...`);
    setTimeout(() => connectWithRetry(attempt + 1), RETRY_DELAY_MS);
  }
}

connectWithRetry();

// Graceful shutdown (Mongoose 8: close() returns a promise, callbacks are not supported)
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } finally {
    process.exit(0);
  }
});

module.exports = app;
