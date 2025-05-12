const mongoose = require('mongoose');

// Define the schema for a VR Gallery
const vrGallerySchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',                          
    required: true                     
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    trim: true,
    default: ''
  },

  size: {
    type: String,
    enum: ['small', 'medium', 'large'],
    default: 'medium'
  },

  frameStyle: {
    type: String,
    enum: ['gold', 'black', 'white', 'natural'],
    default: 'gold'
  },

  isPublic: {
    type: Boolean,
    default: true
  },

  artworks: [{
    artworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artwork'
    },

    title: String,
    artist: String,
    url: String,
    width: Number,
    height: Number,

    position: {
      x: Number,
      y: Number,
      z: Number
    },

    rotation: {
      x: Number,
      y: Number,
      z: Number
    }
  }],

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

vrGallerySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('VRGallery', vrGallerySchema);
