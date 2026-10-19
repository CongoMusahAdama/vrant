const crypto = require('crypto');
const mongoose = require('mongoose');

/** Workflow a custom design request moves through */
const CUSTOM_REQUEST_STATUSES = ['new', 'reviewing', 'quoted', 'in_progress', 'completed', 'declined'];

/** What the customer wants made */
const GARMENT_TYPES = ['two_piece_set', 'shirt', 'kaftan', 'smock', 'trousers', 'jeans', 'footwear', 'other'];

const customRequestSchema = new mongoose.Schema(
  {
    reference: { type: String, unique: true },
    /** Set when the customer was signed in */
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    email: { type: String, trim: true, lowercase: true, maxlength: 120 },
    garmentType: { type: String, enum: GARMENT_TYPES, required: true },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    /** Measurements, size or fit notes */
    sizing: { type: String, trim: true, maxlength: 600 },
    fabricPreference: { type: String, trim: true, maxlength: 200 },
    budget: { type: String, trim: true, maxlength: 80 },
    neededBy: { type: Date },
    /** Reference images / sketches uploaded by the customer */
    images: { type: [String], default: [] },
    status: { type: String, enum: CUSTOM_REQUEST_STATUSES, default: 'new' },
    /** Private notes for the VRANT team (price quoted, fabric sourced, etc.) */
    adminNotes: { type: String, trim: true, maxlength: 2000, default: '' },
  },
  { timestamps: true }
);

customRequestSchema.index({ status: 1, createdAt: -1 });
customRequestSchema.index({ createdAt: -1 });

customRequestSchema.pre('validate', function generateReference(next) {
  if (!this.reference) {
    const time = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();
    this.reference = `CD-${time}-${random}`;
  }
  next();
});

module.exports = mongoose.model('CustomRequest', customRequestSchema);
module.exports.CUSTOM_REQUEST_STATUSES = CUSTOM_REQUEST_STATUSES;
module.exports.GARMENT_TYPES = GARMENT_TYPES;
