const mongoose = require('mongoose');

// Define the schema for opportunities
const savedOpportunitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  opportunity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity',
    required: true
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index to ensure a user can't save the same opportunity twice
savedOpportunitySchema.index({ user: 1, opportunity: 1 }, { unique: true });

module.exports = mongoose.model('SavedOpportunity', savedOpportunitySchema);