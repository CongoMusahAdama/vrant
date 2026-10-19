const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
    trim: true,
    maxlength: [100, 'Product name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a product description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a product price'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Please provide a product category'],
    lowercase: true,
    trim: true,
  },
  images: {
    front: {
      type: String,
      required: [true, 'Front image is required']
    },
    back: {
      type: String,
      required: [true, 'Back image is required']
    },
    additional: [String]
  },
  /** Customer-facing labels under gallery thumbnails (e.g. Black, White) */
  imageLabels: {
    front: { type: String, default: '' },
    back: { type: String, default: '' },
    additional: [String],
  },
  sizes: [{
    name: {
      type: String,
      required: true,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size', '28', '30', '32', '34', '36', '38', '39', '40', '41', '42', '43', '44', '45', '46']
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative']
    }
  }],
  colors: [{
    name: String,
    code: String
  }],
  stock: {
    type: Number,
    required: [true, 'Please provide stock quantity'],
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  soldOut: {
    type: Boolean,
    default: false,
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isNewArrival: {
    type: Boolean,
    default: false
  },
  /** Short bullet points shown on the product page */
  details: [{ type: String, trim: true, maxlength: 200 }],
  tags: [String],
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: [500, 'Review comment cannot be more than 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative']
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Virtual for total stock across all sizes
productSchema.virtual('totalStock').get(function() {
  if (this.sizes && this.sizes.length > 0) {
    return this.sizes.reduce((total, size) => total + size.stock, 0);
  }
  return this.stock;
});

// Index for search functionality
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  category: 'text',
  tags: 'text'
});
productSchema.index({ isActive: 1, category: 1, createdAt: -1 });
productSchema.index({ isActive: 1, isFeatured: 1, createdAt: -1 });
productSchema.index({ isActive: 1, createdAt: -1 });

// Pre-save middleware to generate SKU if not provided
productSchema.pre('save', function(next) {
  if (!this.sku) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.sku = `VRANT-${this.category.toUpperCase()}-${timestamp}-${random}`;
  }
  next();
});

// Static method to get products by category
productSchema.statics.getByCategory = function(category) {
  return this.find({ 
    category: category.toLowerCase(),
    isActive: true 
  }).sort({ createdAt: -1 });
};

// Static method to get featured products
productSchema.statics.getFeatured = function() {
  return this.find({ 
    isFeatured: true,
    isActive: true 
  }).sort({ createdAt: -1 });
};

// Static method to get new arrivals
productSchema.statics.getNewArrivals = function(limit = 10) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return this.find({ 
    createdAt: { $gte: thirtyDaysAgo },
    isActive: true 
  }).sort({ createdAt: -1 }).limit(limit);
};

// Instance method to add review
productSchema.methods.addReview = function(userId, rating, comment) {
  const review = {
    user: userId,
    rating,
    comment
  };
  
  this.reviews.push(review);
  
  // Update average rating
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.ratings.average = totalRating / this.reviews.length;
  this.ratings.count = this.reviews.length;
  
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);
