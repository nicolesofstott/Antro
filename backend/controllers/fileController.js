const File = require("../models/fileModel");
const fs = require('fs');
const path = require('path');

// Unified file upload handler
const uploadFileHandler = async (req, res) => {
  try {
    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    } : 'No file');
    console.log('User:', req.user ? req.user._id : 'No user');

    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileType = req.body.type;
    console.log('File type from body:', fileType);
    
    if (!fileType) {
      console.error('No file type specified in request body');
      return res.status(400).json({ error: "File type not specified" });
    }
    
    if (!['cv', 'portfolio'].includes(fileType)) {
      console.error('Invalid file type:', fileType);
      return res.status(400).json({ error: "Invalid file type. Must be 'cv' or 'portfolio'" });
    }
    
    // Ensure the uploaded file is in the expected format
    const tempFilePath = req.file.path;
    const userId = req.user._id.toString();
    
    const targetDir = path.join('uploads', userId, fileType);
    const targetFilePath = path.join(targetDir, req.file.filename);
    
    const relativePath = `uploads/${userId}/${fileType}/${req.file.filename}`;
    
    console.log('Target directory:', targetDir);
    console.log('Target file path:', targetFilePath);
    console.log('Relative path for database:', relativePath);
    console.log('Full resolved path:', path.resolve(targetFilePath));
    
    // Create target directory if it doesn't exist
    fs.mkdirSync(targetDir, { recursive: true });
    
    try {
      fs.renameSync(tempFilePath, targetFilePath);
      console.log(`File moved from ${tempFilePath} to ${targetFilePath}`);
      
      if (!fs.existsSync(targetFilePath)) {
        throw new Error('File was not moved successfully');
      }
      console.log('File move verified successfully');
    } catch (moveError) {
      console.error('Error moving file:', moveError);
      return res.status(500).json({ error: "Failed to move uploaded file" });
    }
    
    const existingFile = await File.findOne({ 
      user: req.user._id, 
      type: fileType 
    });
    
    if (existingFile) {
      console.log(`Replacing existing ${fileType} file:`, existingFile._id);
      
      // Delete the old file from filesystem if it exists
      if (existingFile.path) {
        try {
          const oldFilePath = path.resolve(existingFile.path);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log('Deleted old file:', oldFilePath);
          }
        } catch (deleteError) {
          console.warn('Could not delete old file:', deleteError.message);
        }
      }
      
      await File.findByIdAndDelete(existingFile._id);
    }
    
    // Save file record to database with consistent path
    const file = new File({
      user: req.user._id,
      type: fileType,
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: relativePath,
      mimeType: req.file.mimetype,
      fileSize: req.file.size
    });
    
    await file.save();
    console.log('File saved to database with ID:', file._id);
    console.log('Stored path in database:', file.path);
    
    // Construct URL that matches the static middleware
    const fileUrl = `${req.protocol}://${req.get('host')}/${relativePath}`;
    console.log('Constructed file URL:', fileUrl);
    
    res.status(200).json({ 
      message: `${fileType.toUpperCase()} uploaded successfully`, 
      file: {
        ...file.toObject(),
        url: fileUrl
      }
    });
  } catch (err) {
    console.error("=== FILE UPLOAD ERROR ===");
    console.error("Error details:", err);
    console.error("Stack trace:", err.stack);
    
    if (req.file && req.file.path) {
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log('Cleaned up temp file:', req.file.path);
        }
      } catch (cleanupError) {
        console.warn('Could not clean up temp file:', cleanupError.message);
      }
    }
    
    res.status(500).json({ error: "Failed to upload file", details: err.message });
  }
};

// CV Upload Handler
const uploadCVHandler = async (req, res) => {
  console.log('CV Handler called - setting type to cv');
  req.body.type = 'cv';
  return uploadFileHandler(req, res);
};

// Portfolio Upload Handler
const uploadPortfolioHandler = async (req, res) => {
  console.log('Portfolio Handler called - setting type to portfolio');
  req.body.type = 'portfolio';
  return uploadFileHandler(req, res);
};

// Get all uploaded files for authenticated user
const getFiles = async (req, res) => {
  try {
    console.log('Getting files for authenticated user:', req.user._id);
    const files = await File.find({ user: req.user._id });
    console.log(`Found ${files.length} files`);
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const filesWithUrls = files.map(file => {
      const fileObj = file.toObject();
      
      // Consistent URL construction
      let fileUrl = null;
      if (fileObj.path) {
        if (fileObj.path.startsWith('uploads/')) {
          fileUrl = `${baseUrl}/${fileObj.path}`;
        } else {
          fileUrl = `${baseUrl}/uploads/${fileObj.path}`;
        }
      } else if (fileObj.filename) {
        fileUrl = `${baseUrl}/uploads/${req.user._id}/${fileObj.type}/${fileObj.filename}`;
      }
      
      console.log(`File ${fileObj._id}: ${fileObj.originalName} -> ${fileUrl}`);
      
      return {
        ...fileObj,
        url: fileUrl
      };
    });
    
    res.status(200).json(filesWithUrls);
  } catch (err) {
    console.error("Error fetching files for authenticated user:", err);
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
    
    if (files.length === 0) {
      return res.status(200).json({ files: [] });
    }
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const filesWithUrls = files.map(file => {
      const fileObj = file.toObject();
      
      // Consistent URL construction that matches static serving
      let fileUrl = null;
      let verifiedPath = null;
      
      if (fileObj.path) {
        if (fileObj.path.startsWith('uploads/')) {
          verifiedPath = fileObj.path;
          fileUrl = `${baseUrl}/${fileObj.path}`;
        } else if (fileObj.path.startsWith('/uploads/')) {
          verifiedPath = fileObj.path.substring(1);
          fileUrl = `${baseUrl}${fileObj.path}`;
        } else {
          verifiedPath = `uploads/${userId}/${fileObj.type}/${fileObj.path}`;
          fileUrl = `${baseUrl}/${verifiedPath}`;
        }
      } else if (fileObj.filename) {
        verifiedPath = `uploads/${userId}/${fileObj.type}/${fileObj.filename}`;
        fileUrl = `${baseUrl}/${verifiedPath}`;
        console.log(`Constructed path for file ${fileObj._id}: ${verifiedPath}`);
      }
      
      console.log(`User ${userId} file ${fileObj._id}: ${fileObj.originalName} -> ${fileUrl}`);
      
      // Verify file exists on filesystem
      if (verifiedPath) {
        const fullPath = path.resolve(verifiedPath);
        const exists = fs.existsSync(fullPath);
        console.log(`File exists on filesystem: ${exists} (${fullPath})`);
        
        if (!exists) {
          const alternatePaths = [
            `uploads/${userId}/${fileObj.type}/${fileObj.filename}`,
            `uploads/${fileObj.type}/${fileObj.filename}`,
            `files/${userId}/${fileObj.type}/${fileObj.filename}`
          ];
          
          for (const altPath of alternatePaths) {
            const altFullPath = path.resolve(altPath);
            if (fs.existsSync(altFullPath)) {
              console.log(`Found file at alternative path: ${altFullPath}`);
              verifiedPath = altPath;
              fileUrl = `${baseUrl}/${altPath}`;
              break;
            }
          }
        }
      }
      
      return {
        ...fileObj,
        url: fileUrl,
        path: verifiedPath,
        exists: verifiedPath ? fs.existsSync(path.resolve(verifiedPath)) : false
      };
    });
    
    res.status(200).json({ files: filesWithUrls });
  } catch (err) {
    console.error(`Error fetching files for user ${req.params.userId}:`, err);
    res.status(500).json({ error: 'Failed to retrieve files', details: err.message });
  }
};

// Delete a File
const deleteFile = async (req, res) => {
  try {
    console.log('Delete request for file:', req.params.id);
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    if (file.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    // Delete the file from filesystem
    if (file.path) {
      try {
        let filePath;
        
        // Handle the consistent path format
        if (file.path.startsWith('uploads/')) {
          filePath = path.resolve(file.path);
        } else if (path.isAbsolute(file.path)) {
          filePath = file.path;
        } else {
          filePath = path.resolve('uploads', file.path);
        }
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Deleted file from filesystem:', filePath);
        } else {
          console.warn('File not found on filesystem:', filePath);
        }
      } catch (deleteError) {
        console.warn('Could not delete file from filesystem:', deleteError.message);
      }
    }
    
    await File.findByIdAndDelete(req.params.id);
    console.log('File deleted from database:', req.params.id);
    res.status(200).json({ message: "File deleted successfully" });
  } catch (err) {
    console.error("Error deleting file:", err);
    res.status(500).json({ error: "Failed to delete file", details: err.message });
  }
};

// Create missing database records for existing files
const createMissingFileRecords = async (req, res) => {
  try {
    console.log('Creating Missing File Records');
    
    const uploadsDir = path.resolve('uploads');
    let createdCount = 0;
    
    // Scan the uploads directory for files without database records
    function scanUserDirectory(userDir, userId) {
      const userPath = path.join(uploadsDir, userDir);
      if (!fs.existsSync(userPath)) return;
      
      console.log(`Scanning user directory: ${userDir}`);
      
      ['cv', 'portfolio'].forEach(type => {
        const typeDir = path.join(userPath, type);
        if (!fs.existsSync(typeDir)) return;
        
        const files = fs.readdirSync(typeDir);
        files.forEach(async (filename) => {
          const filePath = path.join(typeDir, filename);
          const stat = fs.statSync(filePath);
          
          if (stat.isFile() && !filename.startsWith('.')) {
            const existingRecord = await File.findOne({
              user: userId,
              filename: filename,
              type: type
            });
            
            if (!existingRecord) {
              console.log(`Creating record for: ${filename}`);
              
              const relativePath = `uploads/${userId}/${type}/${filename}`;
              
              const newFile = new File({
                user: userId,
                type: type,
                filename: filename,
                originalName: filename.replace(/^\d+-/, ''), 
                path: relativePath,
                mimeType: filename.endsWith('.pdf') ? 'application/pdf' : 
                         filename.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                         filename.endsWith('.png') ? 'image/png' : 'application/octet-stream',
                fileSize: stat.size
              });
              
              await newFile.save();
              createdCount++;
              console.log(`✓ Created database record for ${filename}`);
            }
          }
        });
      });
    }
    
    // Scan all user directories
    const userDirs = fs.readdirSync(uploadsDir);
    for (const userDir of userDirs) {
      if (userDir.length === 24) {
        scanUserDirectory(userDir, userDir);
      }
    }
    
    console.log(`Created ${createdCount} missing file records`);
    res.status(200).json({ 
      message: `Created ${createdCount} missing file records`,
      createdCount
    });
  } catch (err) {
    console.error('Error creating missing file records:', err);
    res.status(500).json({ error: 'Failed to create missing file records', details: err.message });
  }
};

module.exports = {
  uploadFileHandler,
  uploadCVHandler,
  uploadPortfolioHandler,
  getFiles,
  getFilesByUserId,
  deleteFile,
  createMissingFileRecords
};