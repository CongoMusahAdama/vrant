const crypto = require('crypto');
const ShopOrder = require('../models/ShopOrder');
const {
  queueAdminPaymentReceived,
  queueCustomerStatusChange,
} = require('./orderNotifications');
const { decrementStockForPaidOrder } = require('./inventory');

const PAYSTACK_TIMEOUT_MS = 15_000;

function isPaystackConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_PUBLIC_KEY);
}

function paystackKeyMode(key, prefix) {
  if (!key) return 'missing';
  if (key.startsWith(`${prefix}_live_`)) return 'live';
  if (key.startsWith(`${prefix}_test_`)) return 'test';
  return 'unknown';
}

function getPaystackKeyStatus() {
  const publicMode = paystackKeyMode(process.env.PAYSTACK_PUBLIC_KEY, 'pk');
  const secretMode = paystackKeyMode(process.env.PAYSTACK_SECRET_KEY, 'sk');
  const matched = publicMode !== 'missing' && publicMode === secretMode;
  return { publicMode, secretMode, matched, mode: matched ? publicMode : 'mismatch' };
}

function frontendBaseUrl() {
  return (process.env.FRONTEND_URL || 'http://localhost:8080').replace(/\/$/, '');
}

/** Unique per Paystack API call — never reuse across charge + initialize in one checkout. */
function generatePaystackReference(orderId) {
  const suffix = crypto.randomBytes(4).toString('hex');
  return `VRT-${orderId}-${Date.now()}-${suffix}`;
}

function isDuplicateReferenceError(message) {
  return String(message || '').toLowerCase().includes('duplicate');
}

async function paystackRequest(path, options = {}) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    const err = new Error('Paystack is not configured on the server');
    err.code = 'PAYSTACK_NOT_CONFIGURED';
    throw err;
  }

  const res = await fetch(`https://api.paystack.co${path}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    // Never let a slow Paystack response hang the request
    signal: AbortSignal.timeout(PAYSTACK_TIMEOUT_MS),
  });

  return res.json();
}

function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const expected = Buffer.from(crypto.createHmac('sha512', secret).update(rawBody).digest('hex'));
  const received = Buffer.from(String(signature));
  // Constant-time comparison so the signature can't be guessed byte by byte
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

async function markOrderPaidByReference(reference) {
  // Atomically claim the pending → paid transition. If the webhook and the callback
  // verify arrive together, only one of them gets a document back here.
  const claimed = await ShopOrder.findOneAndUpdate(
    { paystackReference: reference, paymentStatus: { $ne: 'paid' } },
    { $set: { paymentStatus: 'paid' } },
    { new: false }
  );
  if (!claimed) {
    // Already paid (return it) or unknown reference (null)
    return ShopOrder.findOne({ paystackReference: reference });
  }

  const previousStatus = claimed.status;
  const order = await ShopOrder.findById(claimed._id);

  if (order.status === 'pending') {
    order.status = 'confirmed';
    order.statusHistory.push({
      status: 'confirmed',
      changedAt: new Date(),
      note: 'Payment received via Paystack',
    });
    await order.save();
  }

  // Separate one-time claim for stock, so it can never be deducted twice
  const stockClaim = await ShopOrder.findOneAndUpdate(
    { _id: order._id, stockDeducted: { $ne: true } },
    { $set: { stockDeducted: true } }
  );
  if (stockClaim) {
    try {
      await decrementStockForPaidOrder(order);
    } catch (err) {
      console.error('[inventory] Failed to decrement stock for paid order:', err.message);
      // Release the claim so an admin re-check can retry the deduction
      await ShopOrder.updateOne({ _id: order._id }, { $set: { stockDeducted: false } });
    }
  }

  queueAdminPaymentReceived(order);
  if (previousStatus !== order.status) {
    queueCustomerStatusChange(order, previousStatus);
  }

  return order;
}

async function chargeMobileMoney({ email, amount, reference, phone, provider, metadata }) {
  return paystackRequest('/charge', {
    method: 'POST',
    body: {
      email,
      amount,
      currency: 'GHS',
      reference,
      mobile_money: {
        phone,
        provider,
      },
      metadata,
    },
  });
}

async function verifyTransactionReference(reference) {
  const paystack = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
  const txStatus = paystack.data?.status;
  if (!paystack.status || txStatus !== 'success') {
    return { ok: false, paystack, status: txStatus };
  }

  const order = await ShopOrder.findOne({ paystackReference: reference });
  if (order) {
    const expectedKobo = Math.round(Number(order.totalAmount) * 100);
    const paidKobo = Number(paystack.data?.amount);
    if (Number.isFinite(expectedKobo) && Number.isFinite(paidKobo) && paidKobo !== expectedKobo) {
      return { ok: false, paystack, message: 'Payment amount does not match order total' };
    }
  }

  const paidOrder = await markOrderPaidByReference(reference);
  return { ok: true, order: paidOrder, paystack };
}

module.exports = {
  isPaystackConfigured,
  getPaystackKeyStatus,
  frontendBaseUrl,
  generatePaystackReference,
  isDuplicateReferenceError,
  paystackRequest,
  chargeMobileMoney,
  verifyWebhookSignature,
  markOrderPaidByReference,
  verifyTransactionReference,
};
