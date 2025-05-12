const User = require("../models/user");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register
exports.register = async (req, res) => {
  const { username, email, password, displayName } = req.body;

  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: "Email already in use" });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: "Username already taken" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      displayName,
      isVerifiedArtist: email.endsWith("@arts.ac.uk"),
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Include profile pic URL in response
    res.status(201).json({
      token,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.displayName,
        isVerifiedArtist: newUser.isVerifiedArtist,
        profilePic: newUser.profilePic,
        profilePicUrl: newUser.profilePic ? 
          `${req.protocol}://${req.get('host')}/uploads/${newUser._id}/profiles/${newUser.profilePic}` : 
          null
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Include profile pic URL in response
    res.status(200).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        fullName: user.fullName,
        about: user.about,
        isVerifiedArtist: user.isVerifiedArtist,
        profilePic: user.profilePic,
        profilePicUrl: user.profilePic ? 
          `${req.protocol}://${req.get('host')}/uploads/${user._id}/profiles/${user.profilePic}` : 
          null
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id || req.user._id;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: "Current password incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update username
exports.updateUsername = async (req, res) => {
  const { newUsername } = req.body;
  const userId = req.user.id || req.user._id; 

  try {
    const existingUser = await User.findOne({ username: newUsername });
    if (existingUser && existingUser._id.toString() !== userId.toString()) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username: newUsername },
      { new: true }
    ).select("username");

    res.status(200).json({ message: "Username updated", username: updatedUser.username });
  } catch (error) {
    console.error("Username update error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get public profile
exports.getUserProfile = async (req, res) => {
  const { username } = req.params;
  
  try {
    let user;
    
    if (mongoose.Types.ObjectId.isValid(username)) {
      // If it looks like a valid MongoDB ID, try to find by ID
      user = await User.findById(username).select("username displayName fullName email about profilePic");
    } else {
      // Otherwise try to find by username
      user = await User.findOne({ username }).select("username displayName fullName email about profilePic");
    }
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = user.toObject();
    if (userData.profilePic) {
      userData.profilePicUrl = `${req.protocol}://${req.get('host')}/uploads/${user._id}/profiles/${userData.profilePic}`;
    }

    res.status(200).json(userData);
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  const userId = req.user._id;
  const { password } = req.body;

  try {
    // Find user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    // Delete all user's artworks
    const Artwork = require("../models/artwork");
    const artworks = await Artwork.find({ user: userId });
    
    // Delete artwork files from filesystem
    const fs = require('fs');
    const path = require('path');
    const basePath = path.join(__dirname, '..');
    
    for (const artwork of artworks) {
      // Delete main image
      if (artwork.mainImage) {
        const mainImagePath = path.join(basePath, artwork.mainImage);
        if (fs.existsSync(mainImagePath)) {
          try {
            fs.unlinkSync(mainImagePath);
          } catch (err) {
            console.error(`Error deleting artwork image: ${err.message}`);
          }
        }
      }
      
      // Delete extra images
      if (artwork.extraImages && artwork.extraImages.length) {
        for (const imgPath of artwork.extraImages) {
          const fullPath = path.join(basePath, imgPath);
          if (fs.existsSync(fullPath)) {
            try {
              fs.unlinkSync(fullPath);
            } catch (err) {
              console.error(`Error deleting extra image: ${err.message}`);
            }
          }
        }
      }
    }
    
    // Delete artworks from database
    await Artwork.deleteMany({ user: userId });
    
    // Delete user's files (CV, portfolio)
    const File = require("../models/fileModel");
    
    // Delete file documents from database
    await File.deleteMany({ user: userId });
    
    // Delete user's profile picture
    if (user.profilePic) {
      const profilePicPath = path.join(basePath, 'uploads', userId.toString(), 'profiles', user.profilePic);
      if (fs.existsSync(profilePicPath)) {
        try {
          fs.unlinkSync(profilePicPath);
        } catch (err) {
          console.error(`Error deleting profile picture: ${err.message}`);
        }
      }
    }
    
    // Delete user's directories
    const userDir = path.join(basePath, 'uploads', userId.toString());
    
    function deleteFolderRecursive(folderPath) {
      if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file) => {
          const curPath = path.join(folderPath, file);
          if (fs.lstatSync(curPath).isDirectory()) {
            deleteFolderRecursive(curPath);
          } else {
            try {
              fs.unlinkSync(curPath);
            } catch (err) {
              console.error(`Error deleting file ${curPath}: ${err.message}`);
            }
          }
        });
        
        // Now delete the empty directory
        try {
          fs.rmdirSync(folderPath);
        } catch (err) {
          console.error(`Error removing directory ${folderPath}: ${err.message}`);
        }
      }
    }
    
    // Delete user's directory
    try {
      deleteFolderRecursive(userDir);
    } catch (err) {
      console.error(`Error deleting user directory: ${err.message}`);
    }
    
    // Delete the user
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Account successfully deleted" });
  } catch (error) {
    console.error("Account deletion error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
};