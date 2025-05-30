const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { uploadArtwork } = require('../middleware/uploadMiddleware');
const artworkController = require('../controllers/artworkController');

// Use the uploadArtwork middleware
router.post('/upload', authMiddleware, uploadArtwork, artworkController.uploadArtworkHandler);
router.get('/mine', authMiddleware, artworkController.getUserArtworks);
router.get('/', artworkController.getAllArtworks);
router.get('/:id', artworkController.getArtworkById);
router.delete('/:id', authMiddleware, artworkController.deleteArtwork);

// Get artworks by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Fetching artworks for user: ${userId}`);
    
    const Artwork = require('../models/artwork');
    
    // Validate userId format
    const artworks = await Artwork.find({ user: userId })
      .populate('user', 'username displayName fullName email');
    
    console.log(`Found ${artworks.length} artworks`);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const artworksWithUrls = artworks.map(artwork => {
      const art = artwork.toObject();
      
      // Ensure mainImage is a valid path
      let mainImageUrl = '';
      if (art.mainImage) {
        mainImageUrl = art.mainImage.startsWith('http') ? 
          art.mainImage : 
          `${baseUrl}/${art.mainImage}`;
      }
      
      // Process extra images
      const extraImageUrls = Array.isArray(art.extraImages) ? 
        art.extraImages.map(imgPath => {
          return imgPath.startsWith('http') ? 
            imgPath : 
            `${baseUrl}/${imgPath}`;
        }) : [];
      
      let width = 100;
      let height = 100;
      
      if (art.dimensions && typeof art.dimensions === 'string') {
        const dimensionMatch = art.dimensions.match(/^(\d{1,3})x(\d{1,3})$/);
        if (dimensionMatch) {
          const parsedWidth = parseInt(dimensionMatch[1], 10);
          const parsedHeight = parseInt(dimensionMatch[2], 10);
          
          if (parsedWidth > 0 && parsedHeight > 0) {
            width = parsedWidth;
            height = parsedHeight;
          }
        }
      }
      
      let artistName = 'Unknown Artist';
      if (art.user && typeof art.user === 'object') {
        artistName = art.user.displayName || 
                   art.user.fullName || 
                   art.user.username || 
                   'Unknown Artist';
      }
      
      return {
        ...art,
        mainImageUrl,
        extraImageUrls,
        width,
        height,
        artist: artistName 
      };
    });
    
    res.json(artworksWithUrls);
  } catch (err) {
    console.error("Error fetching artworks by user ID:", err);
    res.status(500).json({ 
      error: "Failed to fetch user artworks", 
      details: err.message,
      userId: req.params.userId
    });
  }
});

module.exports = router;