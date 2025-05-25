const Opportunity = require('../models/opportunity');
const SavedOpportunity = require('../models/savedOpportunities');

// Controller for managing opportunities
exports.createOpportunity = async (req, res) => {
  try {
    const { title, type, location, description, price } = req.body;

    const opportunity = new Opportunity({
      title,
      type,
      location,
      description,
      price,
      createdBy: req.user._id
    });

    await opportunity.save();
    res.status(201).json(opportunity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all opportunities
exports.getAllOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.find().populate('createdBy', 'name email');
    res.status(200).json(opportunities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single opportunity by ID
exports.deleteOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ error: 'Not found' });

    if (!opportunity.createdBy.equals(req.user._id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await opportunity.deleteOne();
    
    // Also remove this opportunity from all users' saved lists
    await SavedOpportunity.deleteMany({ opportunity: req.params.id });
    
    res.status(200).json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Save an opportunity to the user's saved list
exports.saveOpportunity = async (req, res) => {
  try {
    const { opportunityId } = req.body;
    const userId = req.user._id;

    // Check if opportunity exists
    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    // Check if already saved
    const existingSave = await SavedOpportunity.findOne({
      user: userId,
      opportunity: opportunityId
    });

    if (existingSave) {
      return res.status(400).json({ error: 'Opportunity already saved' });
    }

    // Create new saved opportunity
    const savedOpportunity = new SavedOpportunity({
      user: userId,
      opportunity: opportunityId
    });

    await savedOpportunity.save();
    res.status(201).json({ message: 'Opportunity saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Unsave an opportunity from the user's saved list
exports.unsaveOpportunity = async (req, res) => {
  try {
    const opportunityId = req.params.id;
    const userId = req.user._id;

    const result = await SavedOpportunity.findOneAndDelete({
      user: userId,
      opportunity: opportunityId
    });

    if (!result) {
      return res.status(404).json({ error: 'Saved opportunity not found' });
    }

    res.status(200).json({ message: 'Opportunity removed from saved list' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all saved opportunities for the user
exports.getSavedOpportunities = async (req, res) => {
  try {
    const userId = req.user._id;

    const savedOpportunities = await SavedOpportunity.find({ user: userId })
      .populate({
        path: 'opportunity',
        populate: {
          path: 'createdBy',
          select: 'name email'
        }
      })
      .sort({ savedAt: -1 });

    res.status(200).json(savedOpportunities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};