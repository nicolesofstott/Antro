const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'image/png',
  'image/jpeg',
  'image/jpg'
];

// Storage configuration for generic file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!req.user || !req.user._id) {
      return cb(new Error('User not authenticated or user ID missing'));
    }
    
    // Determine file type from request body
    const fileType = req.body.type;
    if (!fileType || !['cv', 'portfolio'].includes(fileType)) {
      return cb(new Error('Valid file type (cv or portfolio) must be specified'));
    }
    
    // Create the final destination directory structure
    const userFolder = path.join('uploads', req.user._id.toString(), fileType);
    
    fs.mkdirSync(userFolder, { recursive: true });
    
    console.log(`Storing ${fileType} file directly in: ${userFolder}`);
    
    cb(null, userFolder);
  },
  filename: function (req, file, cb) {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = Date.now() + '-' + cleanName;
    console.log(`Generated filename: ${uniqueName}`);
    cb(null, uniqueName);
  }
});

// Generic file upload middleware 
const uploadFile = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    console.log('File filter check:', {
      mimetype: file.mimetype,
      originalname: file.originalname,
      requestBodyType: req.body.type
    });
    
    if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const allowedExtensions = 'PDF, DOCX, DOC, PNG, JPEG';
      cb(new Error(`Only ${allowedExtensions} files are allowed`));
    }
  }
}).single('file');

// CV upload middleware 
const uploadCV = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      if (!req.user || !req.user._id) {
        return cb(new Error('User not authenticated or user ID missing'));
      }
      
      const userFolder = path.join('uploads', req.user._id.toString(), 'cv');
      fs.mkdirSync(userFolder, { recursive: true });
      console.log(`CV destination: ${userFolder}`);
      cb(null, userFolder);
    },
    filename: function (req, file, cb) {
      const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueName = Date.now() + '-' + cleanName;
      cb(null, uniqueName);
    }
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, DOC, PNG, JPEG files are allowed'));
    }
  }
}).single('file');

// Portfolio upload middleware 
const uploadPortfolio = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      if (!req.user || !req.user._id) {
        return cb(new Error('User not authenticated or user ID missing'));
      }
      
      const userFolder = path.join('uploads', req.user._id.toString(), 'portfolio');
      fs.mkdirSync(userFolder, { recursive: true });
      console.log(`Portfolio destination: ${userFolder}`);
      cb(null, userFolder);
    },
    filename: function (req, file, cb) {
      const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueName = Date.now() + '-' + cleanName;
      cb(null, uniqueName);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, DOC, PNG, JPEG files are allowed'));
    }
  }
}).single('file');

// Artwork upload middleware 
const uploadArtwork = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      if (!req.user || !req.user._id) {
        return cb(new Error('User not authenticated or user ID missing'));
      }
      
      const userFolder = path.join('uploads', req.user._id.toString(), 'artworks');
      fs.mkdirSync(userFolder, { recursive: true });
      cb(null, userFolder);
    },
    filename: function (req, file, cb) {
      const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueName = Date.now() + '-' + cleanName;
      cb(null, uniqueName);
    }
  }),
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
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      if (!req.user || !req.user._id) {
        return cb(new Error('User not authenticated or user ID missing'));
      }
      
      const userFolder = path.join('uploads', req.user._id.toString(), 'profiles');
      fs.mkdirSync(userFolder, { recursive: true });
      cb(null, userFolder);
    },
    filename: function (req, file, cb) {
      const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueName = Date.now() + '-' + cleanName;
      cb(null, uniqueName);
    }
  }),
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
  uploadFile,
  uploadArtwork,
  uploadProfilePic,
  ALLOWED_FILE_TYPES
};