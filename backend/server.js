const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(express.json());

// Uploads directory check
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create user directory structure if needed
app.use((req, res, next) => {
  if (!req.url.includes('/api/artworks/upload') && 
      !req.url.includes('/api/files/upload') &&
      !req.url.includes('/api/profile/upload-profile-pic')) {
    return next();
  }

  if (req.user && req.user._id) {
    const userDir = path.join(uploadsDir, req.user._id.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
      
      // Create subdirectories
      ['profiles', 'artworks', 'cv', 'portfolio'].forEach(subDir => {
        const subDirPath = path.join(userDir, subDir);
        if (!fs.existsSync(subDirPath)) {
          fs.mkdirSync(subDirPath, { recursive: true });
        }
      });
    }
  }
  next();
});

// Profiles directory check
const profilesDir = path.join(uploadsDir, 'profiles');
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

// Artworks directory check
const artworksDir = path.join(uploadsDir, 'artworks');
if (!fs.existsSync(artworksDir)) {
  fs.mkdirSync(artworksDir, { recursive: true });
}

// Default profile image
const defaultProfilePath = path.join(profilesDir, 'default-profile.png');
if (!fs.existsSync(defaultProfilePath)) {
  try {
    fs.writeFileSync(defaultProfilePath, '');
    console.log('Created placeholder for default profile image');
    console.log('NOTE: You need to manually replace this with a real image');
  } catch (err) {
    console.error('Could not create default profile image placeholder:', err.message);
  }
}

// Default artwork image
const defaultArtworkPath = path.join(artworksDir, 'default-artwork.png');
if (!fs.existsSync(defaultArtworkPath)) {
  try {
    fs.writeFileSync(defaultArtworkPath, '');
    console.log('Created placeholder for default artwork image');
    console.log('NOTE: You need to manually replace this with a real image');
  } catch (err) {
    console.error('Could not create default artwork image placeholder:', err.message);
  }
}

app.use('/uploads', express.static(uploadsDir));
console.log('Uploads directory:', uploadsDir);

app.use(express.static(path.join(__dirname, '../frontend')));

const authRoutes = require('./routes/authRoutes');
const artworkRoutes = require('./routes/artworkRoutes');
const fileRoutes = require('./routes/fileRoutes');
const searchRoutes = require('./routes/searchRoutes');
const profileRoutes = require('./routes/profileRoutes');
const vrGalleryRoutes = require('./routes/vrGalleryRoutes');
const opportunityRoutes = require('./routes/opportunityRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/files', fileRoutes);
app.use('/api', searchRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/galleries', vrGalleryRoutes);
app.use('/api/opportunities', opportunityRoutes);

// Serve any HTML files directly from frontend directory
app.get('/*.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', req.path));
});

// Serve profile page
app.get('/profile.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/profile/profile.html'));
});

// Serve homepage 
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve public profile page
app.get('/profile/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/profile/publicProfile.html'));
});

// Serve artwork detail page
app.get('/artwork/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/artwork.html'));
});

// Route for the VR gallery
app.get('/gallery/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/creategallery.html'));
});

app.use((req, res) => {
  console.log('404 Not Found:', req.originalUrl);
  res.status(404).send("Route not found");
});

app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);

  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    return res.status(400).json({
      error: 'File upload error',
      details: err.message,
      code: err.code
    });
  } else if (err) {
    console.error('Server error:', err);
    return res.status(500).json({
      error: 'Server error',
      details: err.message
    });
  }

  next(err);
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });