const Product = require('../models/Product');
const { catalogIdFromMongoId } = require('./catalogId');

async function buildCatalogPriceMap() {
  const products = await Product.find({ isActive: true }).select('_id name price stock soldOut');
  const byCatalogId = new Map();

  for (const product of products) {
    const catalogId = catalogIdFromMongoId(product._id);
    byCatalogId.set(catalogId, {
      mongoId: product._id.toString(),
      name: product.name,
      price: product.price,
      stock: product.soldOut ? 0 : product.stock,
    });
  }

  return byCatalogId;
}

/**
 * Validate checkout items and compute authoritative server total.
 * @returns {{ ok: true, items: object[], totalAmount: number } | { ok: false, message: string }}
 */
async function validateOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, message: 'Order must include at least one item' };
  }

  const priceMap = await buildCatalogPriceMap();
  let totalAmount = 0;
  const normalized = [];

  for (const raw of items) {
    const productId = Number(raw.productId);
    const quantity = Number(raw.quantity);
    const size = String(raw.size || '').trim();

    if (!Number.isFinite(productId) || productId <= 0) {
      return { ok: false, message: 'Invalid product in order' };
    }
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
      return { ok: false, message: 'Invalid quantity in order' };
    }
    if (!size) {
      return { ok: false, message: 'Size is required for each item' };
    }

    const catalog = priceMap.get(productId);
    if (!catalog) {
      return { ok: false, message: 'One or more products are no longer available' };
    }
    if (catalog.stock < quantity) {
      return { ok: false, message: `${catalog.name} is out of stock or quantity exceeds available stock` };
    }

    const unitPrice = catalog.price;
    totalAmount += unitPrice * quantity;

    normalized.push({
      productId,
      mongoProductId: catalog.mongoId,
      name: catalog.name,
      size,
      quantity,
      price: `₵${Math.round(unitPrice).toLocaleString('en-GH')}`,
      priceAmount: unitPrice,
      colorPreference: raw.colorPreference ? String(raw.colorPreference).trim() : undefined,
    });
  }

  return { ok: true, items: normalized, totalAmount: Math.round(totalAmount * 100) / 100 };
}

function totalsMatch(serverTotal, clientTotal) {
  const server = Math.round(Number(serverTotal) * 100);
  const client = Math.round(Number(clientTotal) * 100);
  return server === client;
}

module.exports = { validateOrderItems, totalsMatch, buildCatalogPriceMap };
