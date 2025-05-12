const mongoose = require('mongoose');

// Define the schema for an Artwork document
const artworkSchema = new mongoose.Schema({
  // Reference to the User who uploaded the artwork (foreign key)
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',                         
    required: true                       
  },

  mainImage: { 
    type: String, 
    required: true 
  }, 

  extraImages: [String], 
  title: String,
  description: String,
  // Required dimensions field in the format "###x###"
  dimensions: {
    type: String,
    required: true,
    match: /^\d{1,3}x\d{1,3}$/
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Artwork', artworkSchema);
