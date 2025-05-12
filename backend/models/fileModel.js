const mongoose = require('mongoose');

// Define the schema for uploaded files
const fileSchema = new mongoose.Schema({
  // Reference to the User who uploaded the file
  user: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',                          
    required: true                        
  },

  filename: {
    type: String,
    required: true
  },

  originalName: {
    type: String,
    required: true
  },

  path: {
    type: String,
    required: true
  },
  // Type of file, limited to either 'cv' or 'portfolio'
  type: {
    type: String,
    enum: ['cv', 'portfolio'], 
    required: true
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('File', fileSchema);
