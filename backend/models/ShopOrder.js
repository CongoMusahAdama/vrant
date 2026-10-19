const crypto = require('crypto');
const mongoose = require('mongoose');

const shopOrderItemSchema = new mongoose.Schema({
  productId: { type: Number, required: true },
  mongoProductId: { type: String, trim: true },
  name: { type: String, required: true },
  size: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: String, required: true },
  priceAmount: { type: Number, required: true },
  colorPreference: { type: String, trim: true },
}, { _id: false });

const shopOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [shopOrderItemSchema],
  shippingAddress: {
    fullName: String,
    phone: String,
    street: String,
    city: String,
    region: String,
    country: { type: String, default: 'Ghana' },
    deliveryMethod: {
      type: String,
      enum: ['delivery', 'pickup'],
      default: 'delivery',
    },
    pickupStation: String,
  },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  channel: {
    type: String,
    enum: ['whatsapp', 'paystack', 'web'],
    default: 'whatsapp',
  },
  paystackReference: {
    type: String,
    trim: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  /** Prevents double stock deduction when webhook and verify both run */
  stockDeducted: {
    type: Boolean,
    default: false,
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    note: {
      type: String,
      trim: true,
    },
  }],
}, {
  timestamps: true,
});

shopOrderSchema.index({ customer: 1, createdAt: -1 });
shopOrderSchema.index({ status: 1, createdAt: -1 });
shopOrderSchema.index({ paystackReference: 1 });
// orderNumber is already indexed by `unique: true` above

shopOrderSchema.pre('validate', function generateOrderNumber(next) {
  if (!this.orderNumber) {
    // Time-based prefix keeps numbers sortable; random suffix prevents same-millisecond clashes
    const time = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();
    this.orderNumber = `VRT-${time}-${random}`;
  }
  next();
});

module.exports = mongoose.model('ShopOrder', shopOrderSchema);
