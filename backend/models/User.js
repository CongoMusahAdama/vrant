const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    trim: true
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  avatar: {
    type: String,
    default: ''
  },
  addresses: [{
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'Ghana'
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    deliveryMethod: {
      type: String,
      enum: ['delivery', 'pickup'],
      default: 'delivery'
    },
    pickupStation: {
      type: String,
      trim: true
    }
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  /** Tokens issued before this moment are rejected (set whenever the password changes) */
  passwordChangedAt: Date,
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  /** Static shop catalog product IDs (src/data/products.ts) */
  wishlist: {
    type: [Number],
    default: []
  }
}, {
  timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  if (!this.isNew) {
    // 1s back-dated so the token issued right after this change stays valid
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
  next();
});

/** True if the JWT (iat in seconds) was issued before the last password change */
userSchema.methods.changedPasswordAfter = function(tokenIssuedAtSec) {
  if (!this.passwordChangedAt) return false;
  return tokenIssuedAtSec * 1000 < this.passwordChangedAt.getTime();
};

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
