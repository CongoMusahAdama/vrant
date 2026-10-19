const ShopOrder = require('../models/ShopOrder');

const REUSE_WINDOW_MS = 30 * 60 * 1000;

function itemsFingerprint(items) {
  return (items || [])
    .map(
      (item) =>
        `${item.productId}:${item.size}:${item.quantity}:${item.priceAmount}:${item.colorPreference || ''}`
    )
    .sort()
    .join('|');
}

function reuseWindowStart() {
  return new Date(Date.now() - REUSE_WINDOW_MS);
}

/**
 * Reuse a recent unpaid Paystack order for the same cart instead of creating duplicates.
 */
async function findReusablePaystackOrder(customerId, pricing) {
  const fingerprint = itemsFingerprint(pricing.items);
  const candidates = await ShopOrder.find({
    customer: customerId,
    channel: 'paystack',
    paymentStatus: 'pending',
    status: 'pending',
    totalAmount: pricing.totalAmount,
    createdAt: { $gte: reuseWindowStart() },
  })
    .sort({ createdAt: -1 })
    .limit(10);

  return candidates.find((order) => itemsFingerprint(order.items) === fingerprint) || null;
}

/** Cancel other abandoned Paystack attempts for the same cart. */
async function cancelSupersededPaystackOrders(customerId, pricing, keepOrderId) {
  const fingerprint = itemsFingerprint(pricing.items);
  const candidates = await ShopOrder.find({
    customer: customerId,
    channel: 'paystack',
    paymentStatus: 'pending',
    status: 'pending',
    totalAmount: pricing.totalAmount,
    createdAt: { $gte: reuseWindowStart() },
    _id: { $ne: keepOrderId },
  });

  const stale = candidates.filter((order) => itemsFingerprint(order.items) === fingerprint);
  if (!stale.length) return;

  await Promise.all(
    stale.map(async (order) => {
      order.status = 'cancelled';
      order.paymentStatus = 'failed';
      order.statusHistory.push({
        status: 'cancelled',
        changedAt: new Date(),
        note: 'Superseded by a newer checkout attempt',
      });
      await order.save();
    })
  );
}

module.exports = {
  itemsFingerprint,
  findReusablePaystackOrder,
  cancelSupersededPaystackOrders,
};
