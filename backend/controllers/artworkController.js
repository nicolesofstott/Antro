const Artwork = require("../models/artwork");
const fs = require('fs');
const path = require('path');

// Upload Artwork
const uploadArtworkHandler = async (req, res) => {
  try {
    const { title, dimensions, description } = req.body;
    const userId = req.user._id;
    
    // Verify artist profile
    if (!req.user.email.endsWith('@arts.ac.uk')) {
      return res.status(403).json({ 
        error: "Only users with @arts.ac.uk email addresses can upload artwork",
        emailDomain: "restricted"
      });
    }
    
    // Make sure files exist
    if (!req.files || !req.files.mainImage || !req.files.mainImage.length) {
      return res.status(400).json({ error: "Main image is required" });
    }
    
    // Store only the relative path from uploads directory
    const mainImagePath = `uploads/${userId}/artworks/${req.files.mainImage[0].filename}`;
    
    let extraImagePaths = [];
    if (req.files.extraImages && req.files.extraImages.length) {
      extraImagePaths = req.files.extraImages.map(file => 
        `uploads/${userId}/artworks/${file.filename}`
      );
    }
    
    const newArtwork = new Artwork({
      user: userId,
      title,
      dimensions,
      description,
      mainImage: mainImagePath,
      extraImages: extraImagePaths,
    });

    await newArtwork.save();
    
    // Add full URLs for the frontend
    const baseUrl = `${req.protocol}://${req.get('host')}/`;
    const responseArtwork = {
      ...newArtwork.toObject(),
      mainImageUrl: baseUrl + mainImagePath,
      extraImageUrls: extraImagePaths.map(path => baseUrl + path)
    };

    res.status(201).json({
      message: "Artwork uploaded successfully",
      artwork: responseArtwork
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload artwork", details: error.message });
  }
};

// Get User Artworks
const getUserArtworks = async (req, res) => {
  try {
    const artworks = await Artwork.find({ user: req.user._id });
    
    const baseUrl = `${req.protocol}://${req.get('host')}/`;
    const artworksWithUrls = artworks.map(artwork => {
      const art = artwork.toObject();
      
      // Check mainImage is a valid path
      let mainImageUrl = '';
      if (art.mainImage) {
        mainImageUrl = art.mainImage.startsWith('uploads/') ? 
          baseUrl + art.mainImage : 
          baseUrl + 'uploads/' + art.mainImage;
      }
      
      const extraImageUrls = art.extraImages.map(imgPath => {
        return imgPath.startsWith('uploads/') ? 
          baseUrl + imgPath : 
          baseUrl + 'uploads/' + imgPath;
      });
      
      return {
        ...art,
        mainImageUrl,
        extraImageUrls
      };
    });
    
    res.json(artworksWithUrls);
  } catch (err) {
    console.error("Error fetching artworks:", err);
    res.status(500).json({ error: "Failed to fetch user artworks", details: err.message });
  }
};

// Get All Artworks
const getAllArtworks = async (req, res) => {
  try {
    const artworks = await Artwork.find().populate('user', '_id username');
    
    const baseUrl = `${req.protocol}://${req.get('host')}/`;
    const artworksWithUrls = artworks.map(artwork => {
      const art = artwork.toObject();
      
      // Check mainImage is a valid path
      let mainImageUrl = '';
      if (art.mainImage) {
        mainImageUrl = art.mainImage.startsWith('uploads/') ? 
          baseUrl + art.mainImage : 
          baseUrl + 'uploads/' + art.mainImage;
      }
      
      const extraImageUrls = art.extraImages.map(imgPath => {
        return imgPath.startsWith('uploads/') ? 
          baseUrl + imgPath : 
          baseUrl + 'uploads/' + imgPath;
      });
      
      return {
        ...art,
        mainImageUrl,
        extraImageUrls
      };
    });
    
    res.json(artworksWithUrls);
  } catch (err) {
    console.error("Error fetching all artworks:", err);
    res.status(500).json({ error: "Failed to fetch artworks", details: err.message });
  }
};

// Get Single Artwork
const getArtworkById = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id).populate('user', '_id username');
    if (!artwork) return res.status(404).json({ error: "Artwork not found" });
    
    const baseUrl = `${req.protocol}://${req.get('host')}/`;
    const art = artwork.toObject();

    // Check mainImage is a valid path
    let mainImageUrl = '';
    if (art.mainImage) {
      mainImageUrl = art.mainImage.startsWith('uploads/') ? 
        baseUrl + art.mainImage : 
        baseUrl + 'uploads/' + art.mainImage;
    }
    
    const extraImageUrls = art.extraImages.map(imgPath => {
      return imgPath.startsWith('uploads/') ? 
        baseUrl + imgPath : 
        baseUrl + 'uploads/' + imgPath;
    });
    
    const artworkWithUrls = {
      ...art,
      mainImageUrl,
      extraImageUrls
    };
    
    res.json(artworkWithUrls);
  } catch (err) {
    console.error("Error fetching artwork by ID:", err);
    res.status(500).json({ error: "Failed to fetch artwork", details: err.message });
  }
};

// Delete Artwork
const deleteArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ error: "Artwork not found" });

    if (artwork.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    // Delete the image files from the filesystem
    const basePath = path.join(__dirname, '..');
    
     if (fs.existsSync(path.join(basePath, artwork.mainImage))) {
      fs.unlinkSync(path.join(basePath, artwork.mainImage));
    }
   
    artwork.extraImages.forEach(imgPath => {
      const fullPath = path.join(basePath, imgPath);
      if (fs.existsSync(fullPath)) {
       fs.unlinkSync(fullPath);
  
      }
    });



    await Artwork.findByIdAndDelete(req.params.id);
    res.json({ message: "Artwork deleted successfully" });
  } catch (err) {
    console.error("Error deleting artwork:", err);
    res.status(500).json({ error: "Failed to delete artwork", details: err.message });
  }
};

module.exports = {
  uploadArtworkHandler,
  getUserArtworks,
  getAllArtworks,
  getArtworkById,
  deleteArtwork,
};