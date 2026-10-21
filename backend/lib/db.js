const mongoose = require('mongoose');
const { ensureDefaultCategories } = require('./categories');
const { isPaystackConfigured, getPaystackKeyStatus } = require('./paystack');
const { isBrevoConfigured } = require('./brevo');
const { isMnotifyConfigured } = require('./mnotify');

async function warnIfCloudinaryMisconfigured() {
  const { isCloudinaryReady } = require('./cloudinaryClient');
  if (await isCloudinaryReady()) {
    console.log('✅ Cloudinary connected');
    return;
  }
  console.warn(
    '⚠️  Cloudinary misconfigured — use the exact Cloud name from console.cloudinary.com in the Vercel env vars.'
  );
}

function logIntegrationStatus() {
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
    console.warn('⚠️  Paystack keys missing — add PAYSTACK_PUBLIC_KEY and PAYSTACK_SECRET_KEY');
  }
  if (isBrevoConfigured()) {
    console.log('✅ Brevo configured (transactional email enabled)');
  } else {
    console.warn('⚠️  Brevo not configured — add BREVO_API_KEY and BREVO_SENDER_EMAIL');
  }
  if (isMnotifyConfigured()) {
    console.log('✅ Mnotify configured (transactional SMS enabled)');
    if (!process.env.ADMIN_NOTIFY_PHONE?.trim()) {
      console.warn('⚠️  ADMIN_NOTIFY_PHONE missing — admin order SMS alerts will not be sent');
    }
  } else {
    console.warn('⚠️  Mnotify not configured — add MNOTIFY_API_KEY and MNOTIFY_SENDER_ID');
  }
}

/**
 * One shared MongoDB connection per process. Serverless instances are reused between
 * requests, so the promise is cached and a failed attempt is cleared to retry next time.
 */
let connecting = null;

function connectDb() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (connecting) return connecting;

  connecting = mongoose
    .connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
      family: 4,
    })
    .then(async () => {
      console.log('✅ Connected to MongoDB');
      await ensureDefaultCategories();
      // Status checks are informational only — don't hold up the first request for them
      warnIfCloudinaryMisconfigured().catch(() => {});
      logIntegrationStatus();
    })
    .catch((err) => {
      connecting = null;
      throw err;
    });

  return connecting;
}

module.exports = { connectDb };
