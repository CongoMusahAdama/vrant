const mongoose = require('mongoose');

const galleryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  caption: {
    type: String,
    trim: true,
    maxlength: 300,
  },
  category: {
    type: String,
    enum: ['lookbook', 'sets', 'shirts', 'jeans', 'footwear', 'accessories'],
    default: 'lookbook',
    lowercase: true,
  },
  image: {
    type: String,
    required: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('GalleryItem', galleryItemSchema);
