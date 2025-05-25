const mongoose = require('mongoose');

// Define the schema for a User document
const userSchema = new mongoose.Schema({
  name: String, 

  email: { 
    type: String, 
    required: true,
    unique: true
  },

  username: { 
    type: String, 
    required: true, 
    unique: true 
  },

  password: {
    type: String,
    required: true
  },

  isVerifiedArtist: { 
    type: Boolean, 
    default: false 
  },
  
  displayName: String,  
  fullName: String,    
  about: String,       
  profilePic: String,   
  
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
