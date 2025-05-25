const mongoose = require('mongoose');

// Define the schema for uploaded files
const fileSchema = new mongoose.Schema({
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
  },

  // MIME type of the uploaded file
  mimeType: {
    type: String,
    required: false 
  },

  // File size in bytes
  fileSize: {
    type: Number,
    required: false 
  },

  // File extension for easier filtering
  fileExtension: {
    type: String,
    required: false 
  }
}, { 
  timestamps: true 
});

// Add a pre-save hook to extract file extension and MIME type
fileSchema.pre('save', function(next) {
  if (this.originalName) {
    const extension = this.originalName.split('.').pop().toLowerCase();
    this.fileExtension = extension;
  }
  next();
});

// Add virtual for file type description
fileSchema.virtual('fileTypeDescription').get(function() {
  if (!this.fileExtension) return 'Unknown';
  
  const typeMap = {
    'pdf': 'PDF Document',
    'docx': 'Word Document',
    'doc': 'Word Document',
    'png': 'PNG Image',
    'jpg': 'JPEG Image',
    'jpeg': 'JPEG Image'
  };
  
  return typeMap[this.fileExtension] || this.fileExtension.toUpperCase();
});

fileSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('File', fileSchema);