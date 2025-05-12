// fileController.js
const File = require("../models/fileModel");

// CV Upload Handler
const uploadCVHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No CV file uploaded" });
    }
    
    const file = new File({
      user: req.user._id,
      type: "cv",
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: `uploads/${req.user._id}/cv/${req.file.filename}`
    });
    await file.save();
    
    const fileUrl = `${req.protocol}://${req.get('host')}/${file.path}`;
    
    res.status(200).json({ 
      message: "CV uploaded successfully", 
      file: {
        ...file.toObject(),
        url: fileUrl
      }
    });
  } catch (err) {
    console.error("CV upload error:", err);
    res.status(500).json({ error: "Failed to upload CV", details: err.message });
  }
};

// Portfolio Upload Handler
const uploadPortfolioHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No portfolio file uploaded" });
    }
    
    const file = new File({
      user: req.user._id,
      type: "portfolio",
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: `uploads/${req.user._id}/portfolio/${req.file.filename}`
    });
    await file.save();
    
    const fileUrl = `${req.protocol}://${req.get('host')}/${file.path}`;
    
    res.status(200).json({ 
      message: "Portfolio uploaded successfully", 
      file: {
        ...file.toObject(),
        url: fileUrl
      }
    });
  } catch (err) {
    console.error("Portfolio upload error:", err);
    res.status(500).json({ error: "Failed to upload Portfolio", details: err.message });
  }
};

// Get all uploaded files and add URLs
const getFiles = async (req, res) => {
  try {
    const files = await File.find({ user: req.user._id });
    
    const filesWithUrls = files.map(file => {
      const fileUrl = `${req.protocol}://${req.get('host')}/${file.path}`;
      return {
        ...file.toObject(),
        url: fileUrl
      };
    });
    
    res.status(200).json(filesWithUrls);
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ error: 'Failed to retrieve files', details: err.message });
  }
};

// Get files for a specific user
const getFilesByUserId = async (req, res) => {
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
      
      let fileUrl = null;
      if (filePath) {
        if (filePath.startsWith('uploads/')) {
          fileUrl = `${req.protocol}://${req.get('host')}/${filePath}`;
        } else {
          fileUrl = `${req.protocol}://${req.get('host')}/uploads/${filePath}`;
        }
        console.log(`URL for file ${fileObj._id}: ${fileUrl}`);
      }
      
      return {
        ...fileObj,
        url: fileUrl
      };
    });
    
    res.status(200).json(filesWithUrls);
  } catch (err) {
    console.error(`Error fetching files for user ${req.params.userId}:`, err);
    res.status(500).json({ error: 'Failed to retrieve files', details: err.message });
  }
};

// Delete a File
const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Check ownership
    if (file.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    await File.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "File deleted successfully" });
  } catch (err) {
    console.error("Error deleting file:", err);
    res.status(500).json({ error: "Failed to delete file", details: err.message });
  }
};

module.exports = {
  uploadCVHandler,
  uploadPortfolioHandler,
  getFiles,
  getFilesByUserId,
  deleteFile
};