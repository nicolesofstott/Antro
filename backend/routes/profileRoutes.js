const express = require('express');
const router = express.Router();
const User = require('../models/user');
const authMiddleware = require('../middleware/authMiddleware');
const profileController = require('../controllers/profileController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Get the user ID from the authenticated request
    const userId = req.user._id.toString();
    
    // Create user-specific directories if they don't exist
    const userDir = path.join(__dirname, '../uploads', userId);
    const profilesDir = path.join(userDir, 'profiles');
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
    }
    
    cb(null, profilesDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, 'profile-pic-' + uniqueSuffix + fileExt);
  }
});

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

// Get current user's profile 
router.get('/me', authMiddleware, profileController.getCurrentUserProfile);

router.post('/upload-profile-pic', authMiddleware, upload.single('profilePic'), async (req, res) => {
  try {
    console.log('Processing profile picture upload');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Get current user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If user already has a profile pic, delete the old one
    if (user.profilePic) {
      const oldFilePath = path.join(__dirname, '../uploads', user._id.toString(), 'profiles', user.profilePic);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
          console.log(`Deleted old profile picture: ${oldFilePath}`);
        } catch (err) {
          console.error(`Error deleting old profile picture: ${err.message}`);
        }
      }
    }
    
    user.profilePic = req.file.filename;
    
    // Create a URL
    const profilePicUrl = `${req.protocol}://${req.get('host')}/uploads/${user._id}/profiles/${req.file.filename}`;
    user.profilePicUrl = profilePicUrl;
    
    await user.save();
    
    console.log(`Profile picture uploaded successfully for user ${user._id}`);
    console.log(`Profile picture URL: ${profilePicUrl}`);
    
    res.json({ 
      message: 'Profile picture uploaded successfully',
      user: {
        profilePic: user.profilePic,
        profilePicUrl: user.profilePicUrl
      }
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ error: 'Error uploading profile picture', details: error.message });
  }
});

// Remove profile picture endpoint
router.delete('/remove-profile-pic', authMiddleware, async (req, res) => {
  try {
    console.log('Processing profile picture removal');
    
    // Get current user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If user has a profile pic, delete it
    if (user.profilePic) {
      const filePath = path.join(__dirname, '../uploads', user._id.toString(), 'profiles', user.profilePic);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted profile picture: ${filePath}`);
        } catch (err) {
          console.error(`Error deleting profile picture: ${err.message}`);
        }
      }
      
      // Update user document
      user.profilePic = undefined;
      user.profilePicUrl = undefined;
      await user.save();
      
      console.log(`Profile picture removed for user ${user._id}`);
    } else {
      console.log(`No profile picture to remove for user ${user._id}`);
    }
    
    res.json({ message: 'Profile picture removed successfully', user });
  } catch (error) {
    console.error('Error removing profile picture:', error);
    res.status(500).json({ error: 'Error removing profile picture', details: error.message });
  }
});

// Update profile information
router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { displayName, fullName, about } = req.body;
    
    // Update the user profile
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        displayName, 
        fullName, 
        about 
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Error updating profile', details: error.message });
  }
});

// Get user by ID
router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Find user but exclude sensitive information
    const user = await User.findById(userId)
      .select('username displayName fullName email about profilePic')
      .lean();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Add profile pic URL if one exists
    if (user.profilePic) {
      user.profilePicUrl = `${req.protocol}://${req.get('host')}/uploads/${userId}/profiles/${user.profilePic}`;
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;