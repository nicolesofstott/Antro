const VRGallery = require('../models/vrGallery');
const mongoose = require('mongoose');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function errorResponse(res, status, message, err = null) {
  if (err) {
    console.error(`${message}:`, err);
  } else {
    console.error(message);
  }
  return res.status(status).json({ error: message });
}

// Response with saved status
function formatGalleryResponse(gallery, userId = null) {
  if (!gallery) return null;
  
  const galleryObj = gallery.toObject ? gallery.toObject() : gallery;

  if (userId) {
    galleryObj.isSaved = gallery.savedBy && 
      gallery.savedBy.some(id => id.toString() === userId.toString());
  }
  
  return galleryObj;
}

// Get all public galleries
exports.getAllPublicGalleries = async (req, res) => {
  try {
    const galleries = await VRGallery.find({ isPublic: true })
      .populate('user', 'username profilePicture')
      .sort({ createdAt: -1 });
    
    const formattedGalleries = galleries.map(gallery => 
      formatGalleryResponse(gallery, req.user ? req.user._id : null)
    );
    
    res.json(formattedGalleries);
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch public galleries', err);
  }
};

// Get galleries by user ID
exports.getGalleriesByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!isValidObjectId(userId)) {
      return errorResponse(res, 400, 'Invalid user ID');
    }
    
    const galleries = await VRGallery.find({ 
      user: userId,
      isPublic: true 
    }).sort({ createdAt: -1 });
    
    const formattedGalleries = galleries.map(gallery => 
      formatGalleryResponse(gallery, req.user ? req.user._id : null)
    );
    
    res.json(formattedGalleries);
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch user galleries', err);
  }
};

// Get gallery by ID
exports.getGalleryById = async (req, res) => {
  try {
    const galleryId = req.params.id;
    
    if (!isValidObjectId(galleryId)) {
      return errorResponse(res, 400, 'Invalid gallery ID');
    }
    
    const gallery = await VRGallery.findById(galleryId)
      .populate('user', 'username profilePicture')
      .populate('artworks.artworkId');
    
    if (!gallery) {
      return errorResponse(res, 404, 'Gallery not found');
    }
    
    if (!gallery.isPublic && 
        (!req.user || req.user._id.toString() !== gallery.user.toString())) {
      return errorResponse(res, 403, 'You do not have permission to view this gallery');
    }
    
    const formattedGallery = formatGalleryResponse(gallery, req.user ? req.user._id : null);
    
    res.json(formattedGallery);
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch gallery', err);
  }
};

// Get current user's galleries
exports.getUserGalleries = async (req, res) => {
  try {
    console.log('GET /api/galleries/mine - User authentication check');
    
    if (!req.user || !req.user._id) {
      return errorResponse(res, 401, 'Authentication required');
    }
    
    console.log(`Fetching galleries for user ${req.user._id}`);
    
    const galleries = await VRGallery.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    console.log(`Found ${galleries.length} galleries`);
    
    const formattedGalleries = galleries.map(gallery => 
      formatGalleryResponse(gallery, req.user._id)
    );
    
    res.json(formattedGalleries);
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch user galleries', err);
  }
};

// Create a new gallery
exports.createGallery = async (req, res) => {
  try {
    console.log('POST /api/galleries/create - Creating gallery');
    
    if (!req.user || !req.user._id) {
      return errorResponse(res, 401, 'Authentication required');
    }
    
    const { name, description, size, frameStyle, isPublic, artworks } = req.body;
    
    if (!name) {
      return errorResponse(res, 400, 'Gallery name is required');
    }
    
    console.log(`Creating gallery "${name}" for user ${req.user._id}`);
    
    const newGallery = new VRGallery({
      user: req.user._id,
      name,
      description: description || '',
      size: size || 'medium',
      frameStyle: frameStyle || 'gold',
      isPublic: isPublic !== undefined ? isPublic : true,
      artworks: artworks || [],
      savedBy: [] 
    });
    
    await newGallery.save();
    
    console.log(`Gallery "${name}" created with ID ${newGallery._id}`);
    
    res.status(201).json(formatGalleryResponse(newGallery, req.user._id));
  } catch (err) {
    return errorResponse(res, 500, 'Failed to create gallery', err);
  }
};

// Update gallery
exports.updateGallery = async (req, res) => {
  try {
    const galleryId = req.params.id;
    
    if (!isValidObjectId(galleryId)) {
      return errorResponse(res, 400, 'Invalid gallery ID');
    }
    
    const gallery = await VRGallery.findById(galleryId);
    
    if (!gallery) {
      return errorResponse(res, 404, 'Gallery not found');
    }
    
    if (gallery.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'You do not have permission to update this gallery');
    }
    
    const { name, description, size, frameStyle, isPublic, artworks } = req.body;
    
    if (name) gallery.name = name;
    if (description !== undefined) gallery.description = description;
    if (size) gallery.size = size;
    if (frameStyle) gallery.frameStyle = frameStyle;
    if (isPublic !== undefined) gallery.isPublic = isPublic;
    if (artworks) gallery.artworks = artworks;
    
    gallery.updatedAt = Date.now();
    
    await gallery.save();
    
    res.json(formatGalleryResponse(gallery, req.user._id));
  } catch (err) {
    return errorResponse(res, 500, 'Failed to update gallery', err);
  }
};

// Delete gallery
exports.deleteGallery = async (req, res) => {
  try {
    const galleryId = req.params.id;
    
    if (!isValidObjectId(galleryId)) {
      return errorResponse(res, 400, 'Invalid gallery ID');
    }
  
    const gallery = await VRGallery.findById(galleryId);
    
    if (!gallery) {
      return errorResponse(res, 404, 'Gallery not found');
    }
    
    if (gallery.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'You do not have permission to delete this gallery');
    }
    
    await VRGallery.findByIdAndDelete(galleryId);
    
    res.json({ message: 'Gallery deleted successfully' });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to delete gallery', err);
  }
};

// Get user's saved galleries
exports.getSavedGalleries = async (req, res) => {
  try {
    console.log('GET /api/galleries/saved - Fetching saved galleries');
    
    if (!req.user || !req.user._id) {
      return errorResponse(res, 401, 'Authentication required');
    }
    
    console.log(`Fetching saved galleries for user ${req.user._id}`);
    
    const savedGalleries = await VRGallery.find({ 
      savedBy: req.user._id 
    })
    .populate('user', 'username profilePicture')
    .sort({ createdAt: -1 });
    
    console.log(`Found ${savedGalleries.length} saved galleries`);
    
    const galleryData = savedGalleries.map(gallery => {
      const galleryObj = formatGalleryResponse(gallery, req.user._id);
      galleryObj.isSaved = true;
      return galleryObj;
    });
    
    res.json(galleryData);
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch saved galleries', err);
  }
};

// Save a gallery
exports.saveGallery = async (req, res) => {
  try {
    const galleryId = req.params.id;
    
    if (!isValidObjectId(galleryId)) {
      return errorResponse(res, 400, 'Invalid gallery ID');
    }
    
    console.log(`User ${req.user._id} saving gallery ${galleryId}`);
    
    // Find the gallery
    const gallery = await VRGallery.findById(galleryId);
    
    if (!gallery) {
      return errorResponse(res, 404, 'Gallery not found');
    }
    
    if (!gallery.savedBy) {
      gallery.savedBy = [];
    }
    
    // Check if user has already saved this gallery
    if (gallery.savedBy.some(id => id.toString() === req.user._id.toString())) {
      return res.json({ message: 'Gallery already saved', isSaved: true });
    }
    
    gallery.savedBy.push(req.user._id);
    await gallery.save();
    
    res.json({ message: 'Gallery saved successfully', isSaved: true });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to save gallery', err);
  }
};

// Unsave a gallery
exports.unsaveGallery = async (req, res) => {
  try {
    const galleryId = req.params.id;
    
    if (!isValidObjectId(galleryId)) {
      return errorResponse(res, 400, 'Invalid gallery ID');
    }
    
    console.log(`User ${req.user._id} unsaving gallery ${galleryId}`);
    
    // Find the gallery
    const gallery = await VRGallery.findById(galleryId);
    
    if (!gallery) {
      return errorResponse(res, 404, 'Gallery not found');
    }
    
    // Check if gallery has savedBy array if so remove
    if (!gallery.savedBy) {
      gallery.savedBy = [];
      await gallery.save();
      return res.json({ message: 'Gallery was not saved', isSaved: false });
    }
    
    gallery.savedBy = gallery.savedBy.filter(
      savedId => savedId.toString() !== req.user._id.toString()
    );
    
    await gallery.save();
    
    res.json({ message: 'Gallery unsaved successfully', isSaved: false });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to unsave gallery', err);
  }
};

//  Get gallery by name
exports.getGalleryByName = async (req, res) => {
  try {
    const galleryName = req.params.name;
    
    if (!galleryName) {
      return errorResponse(res, 400, 'Gallery name is required');
    }
    
    console.log(`Fetching gallery by name: ${galleryName}`);
    
    const gallery = await VRGallery.findOne({ name: galleryName })
      .populate('user', 'username profilePicture')
      .populate('artworks.artworkId');
    
    if (!gallery) {
      return errorResponse(res, 404, 'Gallery not found');
    }
    
    if (!gallery.isPublic && 
        (!req.user || req.user._id.toString() !== gallery.user.toString())) {
      return errorResponse(res, 403, 'You do not have permission to view this gallery');
    }
    
    const formattedGallery = formatGalleryResponse(gallery, req.user ? req.user._id : null);
    
    res.json(formattedGallery);
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch gallery by name', err);
  }
};