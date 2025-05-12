const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/user");
const mongoose = require("mongoose");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/change-password", authMiddleware, authController.changePassword);
router.put("/update-username", authMiddleware, authController.updateUsername);
router.post("/delete-account", authMiddleware, authController.deleteAccount);

// Unified profile route that handles both username and ID lookup
router.get("/profile/:identifier", async (req, res) => {
  const identifier = req.params.identifier;
  
  try {
    let user;
    
    // Check if the identifier is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      user = await User.findById(identifier).select("username displayName fullName email about profilePic");
    } else {
      user = await User.findOne({ username: identifier }).select("username displayName fullName email about profilePic");
    }
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

router.post("/test-endpoint", (req, res) => {
  console.log("Test endpoint hit");
  res.status(200).json({ message: "Test endpoint working" });
});

router.post("/delete-account", authMiddleware, authController.deleteAccount);

console.log("Auth routes initialized:");
router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`  ${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`);
  }
});

module.exports = router;