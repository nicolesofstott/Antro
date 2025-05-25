const User = require("../models/user");
const path = require("path");
const fs = require("fs");

// Handle profile picture upload
const uploadProfilePictureHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No profile image uploaded" });
    }
    
    console.log("Profile picture upload:", req.file);
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: req.file.filename },
      { new: true }
    ).select("username displayName fullName profilePic email about isVerifiedArtist");
    
    const profilePicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.user._id}/profiles/${req.file.filename}`;
    
    console.log("Profile picture URL:", profilePicUrl);
    
    res.status(200).json({ 
      message: "Profile picture uploaded successfully", 
      user: {
        ...updatedUser.toObject(),
        profilePicUrl
      }
    });
  } catch (err) {
    console.error("Profile picture upload error:", err);
    res.status(500).json({ error: "Failed to upload profile picture", details: err.message });
  }
};

// Remove profile picture
const removeProfilePictureHandler = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Delete existing profile pic
    if (user.profilePic) {
      const filePath = path.join(__dirname, '..', 'uploads', req.user._id.toString(), 'profiles', user.profilePic);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted profile image: ${filePath}`);
      }
    }
    
    // Update user to remove profile pic reference
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $unset: { profilePic: "" } },
      { new: true }
    ).select("username displayName fullName email about isVerifiedArtist");
    
    res.status(200).json({ 
      message: "Profile picture removed successfully", 
      user: updatedUser
    });
  } catch (err) {
    console.error("Profile picture removal error:", err);
    res.status(500).json({ error: "Failed to remove profile picture", details: err.message });
  }
};

// Update user profile info
const updateProfileHandler = async (req, res) => {
  try {
    const { displayName, fullName, about } = req.body;
    
    // Build update object with only provided fields
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (about !== undefined) updateData.about = about;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No update data provided" });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select("username displayName fullName email about profilePic isVerifiedArtist");
    
    // If user has profile pic, add the URL
    let profilePicUrl = null;
    if (updatedUser.profilePic) {
      profilePicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.user._id}/profiles/${updatedUser.profilePic}`;
    }
    
    res.status(200).json({ 
      message: "Profile updated successfully", 
      user: {
        ...updatedUser.toObject(),
        profilePicUrl
      }
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile", details: err.message });
  }
};

// Get current user profile
const getCurrentUserProfile = async (req, res) => {
  try {
    const userData = req.user.toObject();
    delete userData.password;
    
    if (userData.profilePic) {
      userData.profilePicUrl = `${req.protocol}://${req.get('host')}/uploads/${userData._id}/profiles/${userData.profilePic}`;
    }
    
    res.status(200).json(userData);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ error: "Failed to fetch profile", details: err.message });
  }
};

// Get public profile by user ID
const getPublicProfileById = async (req, res) => {
  try {
    const user = await User.findById(req.params.identifier)
      .select("username displayName fullName about profilePic isVerifiedArtist");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userObj = user.toObject();

    if (userObj.profilePic) {
      userObj.profilePicUrl = `${req.protocol}://${req.get('host')}/uploads/${userObj._id}/profiles/${userObj.profilePic}`;
    }

    res.status(200).json(userObj);
  } catch (err) {
    console.error("Error fetching public profile:", err);
    res.status(500).json({ error: "Failed to fetch public profile" });
  }
};

module.exports = {
  uploadProfilePictureHandler,
  removeProfilePictureHandler,
  updateProfileHandler,
  getCurrentUserProfile,
  getPublicProfileById
};