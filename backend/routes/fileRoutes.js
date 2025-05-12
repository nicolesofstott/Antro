const express = require('express');
const router = express.Router();
const File = require('../models/fileModel');
const authMiddleware = require('../middleware/authMiddleware');
const fileController = require('../controllers/fileController');

// Get all files for current user
router.get('/', authMiddleware, fileController.getFiles);

// Upload CV
router.post('/uploadCV', authMiddleware, fileController.uploadCVHandler);

// Upload Portfolio
router.post('/uploadPortfolio', authMiddleware, fileController.uploadPortfolioHandler);

// Delete a file
router.delete('/:id', authMiddleware, fileController.deleteFile);

// Get files for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Getting files for user ID: ${userId}`);
    
    const files = await File.find({ user: userId });
    console.log(`Found ${files.length} files for user ${userId}`);

    const filesWithUrls = files.map(file => {
      const fileObj = file.toObject();
      
      let filePath = fileObj.path;
      if (!filePath) {
        if (fileObj.filename) {
          filePath = `uploads/${userId}/${fileObj.type}/${fileObj.filename}`;
          console.log(`Constructed path for file ${fileObj._id}: ${filePath}`);
        }
      }
      
      // Create the URL 
      let fileUrl = null;
      if (filePath) {
        fileUrl = `${req.protocol}://${req.get('host')}/${filePath}`;
        console.log(`URL for file ${fileObj._id}: ${fileUrl}`);
      }
      
      console.log(`Processing file: ${fileObj._id}, type: ${fileObj.type}, URL: ${fileUrl}`);
      
      return {
        ...fileObj,
        url: fileUrl
      };
    });
    
    console.log('Sending files response:', { files: filesWithUrls });
    
    res.status(200).json({ files: filesWithUrls });
  } catch (err) {
    console.error(`Error fetching files for user ${req.params.userId}:`, err);
    res.status(500).json({ error: 'Failed to retrieve files', details: err.message });
  }
});

module.exports = router;