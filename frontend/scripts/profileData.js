// User profile data management
import { safeGetElement } from './profileUtils.js';
import { backendBase } from './profileAuth.js';

// Fetch Current User
async function fetchCurrentUser() {
  try {
    console.log("Fetching current user profile...");
    const freshToken = localStorage.getItem("token");
    
    if (!freshToken) {
      throw new Error("Authentication token missing");
    }
    
    const response = await fetch(`${backendBase}/api/profile/me`, {
      headers: {
        "Authorization": `Bearer ${freshToken}`
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Authentication failed");
      }
      throw new Error(`Failed to fetch user profile: ${response.status}`);
    }

    const userData = await response.json();
    console.log("Current user data:", userData);

    localStorage.setItem("user", JSON.stringify(userData));

    updateUserInterface(userData);

    return userData;
  } catch (err) {
    console.error("Error fetching user profile:", err);
    
    if (err.message === "Authentication failed" || err.message === "Authentication token missing") {
      alert("Your session has expired. Please log in again.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "../authentication/login.html";
    }
    
    return null;
  }
}

// Update user interface with profile data
function updateUserInterface(userData) {
  const profilePic = safeGetElement("profile-pic");
  const displayName = safeGetElement("display-name");
  const displayAbout = safeGetElement("display-about");

  if (displayName) {
    displayName.textContent = userData.displayName || userData.fullName || userData.username || "Your Name";
  }
  
  if (displayAbout) {
    displayAbout.textContent = userData.about || userData.email || "No bio available";
  }

  // Set profile picture
  if (profilePic) {
    if (userData.profilePicUrl) {
      profilePic.src = userData.profilePicUrl;
    } else if (userData.profilePic) {
      profilePic.src = `${backendBase}/uploads/${userData._id}/profiles/${userData.profilePic}`;
    } else {
      profilePic.src = "../images/profileholder.png";
    }

    profilePic.onerror = function() {
      console.error("Failed to load profile picture");
      this.src = "../images/profileholder.png";
    };
  }

  // Handle non-artist users
  const isArtsEmail = userData.email && userData.email.endsWith('@arts.ac.uk');
  const isVerifiedArtist = userData.isVerifiedArtist || isArtsEmail;
  
  if (!isVerifiedArtist) {
    const artworkTabButton = document.querySelector('[data-tab="artwork-tab"]');
    if (artworkTabButton) {
      artworkTabButton.style.display = "none";
    }
    
    // Switch to CV tab programmatically
    if (window.tabSystem) {
      window.tabSystem.activateTab("cv-tab");
    } else {
      const cvTabButton = document.querySelector('[data-tab="cv-tab"]');
      if (cvTabButton) {
        cvTabButton.click();
      }
    }
  }
}

export {
  fetchCurrentUser,
  updateUserInterface
};