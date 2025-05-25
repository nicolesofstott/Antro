const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Artwork = require('../models/artwork');
const VRGallery = require('../models/vrGallery');

// Search route to handle user, artwork, and gallery searches
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({ message: 'Query parameter q is required' });
    }

    // User search 
    const profileMatches = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } }
      ]
    }).select('username fullName displayName profilePic _id email');

    const formattedProfiles = profileMatches.map(profile => {
      const profileObj = profile.toObject();
      profileObj.isArtist = profile.email && profile.email.endsWith('@arts.ac.uk');
      
      delete profileObj.email;
      
      return profileObj;
    });

    // Populate and select user data for artworks
    const artworkMatches = await Artwork.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    })
    .populate('user', '_id username')
    .select('title mainImage description user _id dimensions');

    // Format the artwork responses
    const formattedArtworks = artworkMatches.map(artwork => {
      const art = artwork.toObject();
      if (!art.user || !art.user._id) {
        console.error('Artwork is missing user reference:', art._id);
      }
      
      return art;
    });

    // Search for galleries
    const galleryMatches = await VRGallery.find({
      $and: [
        { isPublic: true }, // Only show public galleries in search
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .populate('user', '_id username displayName')
    .select('name description size frameStyle user createdAt _id');

    const formattedGalleries = galleryMatches.map(gallery => {
      const galleryObj = gallery.toObject();
      
      if (gallery.artworks && gallery.artworks.length > 0 && gallery.artworks[0].url) {
        galleryObj.previewImageUrl = gallery.artworks[0].url;
      }
      
      galleryObj.artworkCount = gallery.artworks ? gallery.artworks.length : 0;
      
      return galleryObj;
    });

    res.json({ 
      profiles: formattedProfiles, 
      artworks: formattedArtworks,
      galleries: formattedGalleries
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Server Error', details: err.message });
  }
});

module.exports = router;