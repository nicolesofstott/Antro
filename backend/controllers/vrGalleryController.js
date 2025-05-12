const VRGallery = require("../models/vrGallery");

// Create VR Gallery
const createGallery = async (req, res) => {
  try {
    const { name, description, size, frameStyle, artworks, isPublic } = req.body;
    const userId = req.user._id;
    
    // Basic validation
    if (!name) {
      return res.status(400).json({ error: "Gallery name is required" });
    }
    
    if (!artworks || !Array.isArray(artworks) || artworks.length === 0) {
      return res.status(400).json({ error: "At least one artwork is required" });
    }
    
    // Create the gallery
    const newGallery = new VRGallery({
      user: userId,
      name,
      description: description || "",
      size: size || "medium",
      frameStyle: frameStyle || "gold",
      isPublic: isPublic !== undefined ? isPublic : true,
      artworks: artworks
    });
    
    await newGallery.save();
    
    res.status(201).json({
      message: "VR Gallery created successfully",
      gallery: newGallery
    });
  } catch (error) {
    console.error("Error creating VR Gallery:", error);
    res.status(500).json({ error: "Failed to create VR Gallery", details: error.message });
  }
};

// Get all public galleries
const getAllPublicGalleries = async (req, res) => {
  try {
    const galleries = await VRGallery.find({ isPublic: true })
      .populate('user', '_id username displayName')
      .sort({ createdAt: -1 });
    
    res.json(galleries);
  } catch (error) {
    console.error("Error fetching public galleries:", error);
    res.status(500).json({ error: "Failed to fetch galleries", details: error.message });
  }
};

// Get user's galleries
const getUserGalleries = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const galleries = await VRGallery.find({ user: userId })
      .sort({ updatedAt: -1 });
    
    res.json(galleries);
  } catch (error) {
    console.error("Error fetching user galleries:", error);
    res.status(500).json({ error: "Failed to fetch galleries", details: error.message });
  }
};

// Get gallery by ID
const getGalleryById = async (req, res) => {
  try {
    const galleryId = req.params.id;
    
    const gallery = await VRGallery.findById(galleryId)
      .populate('user', '_id username displayName');
    
    if (!gallery) {
      return res.status(404).json({ error: "Gallery not found" });
    }
    
    // Check if gallery is private and not owned by the requesting user
    if (!gallery.isPublic && gallery.user._id.toString() !== req.user?._id?.toString()) {
      return res.status(403).json({ error: "You don't have permission to view this gallery" });
    }
    
    res.json(gallery);
  } catch (error) {
    console.error("Error fetching gallery:", error);
    res.status(500).json({ error: "Failed to fetch gallery", details: error.message });
  }
};

// Update gallery
const updateGallery = async (req, res) => {
  try {
    const galleryId = req.params.id;
    const { name, description, size, frameStyle, artworks, isPublic } = req.body;
    const userId = req.user._id;
    
    // Find gallery
    const gallery = await VRGallery.findById(galleryId);
    
    if (!gallery) {
      return res.status(404).json({ error: "Gallery not found" });
    }
    
    // Check if the user is the owner
    if (gallery.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You don't have permission to update this gallery" });
    }
    
    // Update fields
    if (name) gallery.name = name;
    if (description !== undefined) gallery.description = description;
    if (size) gallery.size = size;
    if (frameStyle) gallery.frameStyle = frameStyle;
    if (isPublic !== undefined) gallery.isPublic = isPublic;
    if (artworks && Array.isArray(artworks) && artworks.length > 0) {
      gallery.artworks = artworks;
    }
    
    gallery.updatedAt = Date.now();
    
    await gallery.save();
    
    res.json({
      message: "Gallery updated successfully",
      gallery
    });
  } catch (error) {
    console.error("Error updating gallery:", error);
    res.status(500).json({ error: "Failed to update gallery", details: error.message });
  }
};

// Delete gallery
const deleteGallery = async (req, res) => {
  try {
    const galleryId = req.params.id;
    const userId = req.user._id;
    
    // Find the gallery
    const gallery = await VRGallery.findById(galleryId);
    
    if (!gallery) {
      return res.status(404).json({ error: "Gallery not found" });
    }
    
    // Check if the user is the owner
    if (gallery.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You don't have permission to delete this gallery" });
    }
    
    await VRGallery.findByIdAndDelete(galleryId);
    
    res.json({ message: "Gallery deleted successfully" });
  } catch (error) {
    console.error("Error deleting gallery:", error);
    res.status(500).json({ error: "Failed to delete gallery", details: error.message });
  }
};

// Get galleries by user ID
const getGalleriesByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Show private galleries too if viewing own profile
    const isOwnProfile = req.user && req.user._id.toString() === userId;
    
    let query = { user: userId };
    if (!isOwnProfile) {
      query.isPublic = true;
    }
    
    const galleries = await VRGallery.find(query)
      .sort({ updatedAt: -1 });
    
    res.json(galleries);
  } catch (error) {
    console.error("Error fetching user galleries:", error);
    res.status(500).json({ error: "Failed to fetch galleries", details: error.message });
  }
};

module.exports = {
  createGallery,
  getAllPublicGalleries,
  getUserGalleries,
  getGalleryById,
  updateGallery,
  deleteGallery,
  getGalleriesByUserId
};