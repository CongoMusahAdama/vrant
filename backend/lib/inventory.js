const Product = require('../models/Product');
const { catalogIdFromMongoId } = require('./catalogId');

async function findProductForOrderItem(item) {
  if (item.mongoProductId) {
    const product = await Product.findById(item.mongoProductId).select('_id name').lean();
    if (product) return product;
  }

  if (!item.productId) return null;

  // Legacy fallback for items saved without a Mongo id
  const products = await Product.find({ isActive: true }).select('_id name').lean();
  return products.find((p) => catalogIdFromMongoId(p._id) === Number(item.productId)) || null;
}

/**
 * Reduce product stock when a Paystack order is confirmed paid.
 * Uses atomic $inc so concurrent sales can't overwrite each other, then clamps at zero
 * and marks the product sold out.
 */
async function decrementStockForPaidOrder(order) {
  if (!order?.items?.length) return;

  for (const item of order.items) {
    const product = await findProductForOrderItem(item);
    if (!product) {
      console.warn(`[inventory] Product not found for order item: ${item.name}`);
      continue;
    }

    const quantity = Math.max(1, Number(item.quantity) || 1);

    // Decrement total and the matching size in one atomic update
    const sized = await Product.updateOne(
      { _id: product._id, 'sizes.name': item.size },
      { $inc: { stock: -quantity, 'sizes.$.stock': -quantity } }
    );
    if (sized.matchedCount === 0) {
      await Product.updateOne({ _id: product._id }, { $inc: { stock: -quantity } });
    }

    // Never leave negative size stock
    await Product.updateOne(
      { _id: product._id },
      { $set: { 'sizes.$[neg].stock': 0 } },
      { arrayFilters: [{ 'neg.stock': { $lt: 0 } }] }
    );

    // Sold out: clamp total to zero, zero every size, flag soldOut
    await Product.updateOne(
      { _id: product._id, stock: { $lte: 0 } },
      { $set: { stock: 0, soldOut: true, 'sizes.$[].stock': 0 } }
    );

    const after = await Product.findById(product._id).select('name stock soldOut').lean();
    console.log(
      `[inventory] ${after.name} stock updated — remaining: ${after.stock}${after.soldOut ? ' (sold out)' : ''}`
    );
  }
}

module.exports = { decrementStockForPaidOrder, findProductForOrderItem };
