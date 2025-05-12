const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage config helper
const getStorage = (folder) =>
  multer.diskStorage({
    destination: function (req, file, cb) {
      if (!req.user || !req.user._id) {
        return cb(new Error('User not authenticated or user ID missing'));
      }
      
      const userFolder = path.join('uploads', req.user._id.toString(), folder);
      
      // Create the directory if it doesn't exist
      fs.mkdirSync(userFolder, { recursive: true });
      
      console.log(`Storing file in: ${userFolder}`);
      
      cb(null, userFolder);
    },
    filename: function (req, file, cb) {
      const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
      const uniqueName = Date.now() + '-' + cleanName;
      console.log(`Generated filename: ${uniqueName}`);
      cb(null, uniqueName);
    },
  });
  
// CV upload middleware
const uploadCV = multer({
  storage: getStorage('cv'),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for CV uploads'));
    }
  }
}).single('cv');

// Portfolio upload middleware
const uploadPortfolio = multer({
  storage: getStorage('portfolio'),
  limits: { fileSize: 50 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for portfolio uploads'));
    }
  }
}).single('portfolio');

// Artwork upload middleware
const uploadArtwork = multer({
  storage: getStorage('artworks'),
  limits: { fileSize: 20 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed for artwork uploads'));
    }
  }
}).fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'extraImages', maxCount: 8 },
]);

// Profile picture upload middleware
const uploadProfilePic = multer({
  storage: getStorage('profiles'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed for profile pictures'));
    }
  }
}).single('profilePic');

module.exports = {
  uploadCV,
  uploadPortfolio,
  uploadArtwork,
  uploadProfilePic
};