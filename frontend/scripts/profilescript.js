// Main profile page entry point
import { debugAuth, validateToken, setupLogout, refreshToken } from './profileAuth.js';
import { setupTabSystem, setupModalClose } from './profileUtils.js';
import { loadUserArtworks, setupArtworkUpload } from './artworkManager.js';
import { setupFileUploads, loadUserFiles } from './fileManager.js';
import { fetchCurrentUser } from './profileData.js';

// Main initialisation function
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Initializing profile page...");
  
  debugAuth();
  
  // Get user info and token
  const authData = localStorage.getItem("token") && localStorage.getItem("user");
  if (!authData) {
    alert("Please log in to view your profile.");
    window.location.href = "../authentication/login.html";
    return;
  }

  const isValid = await validateToken();
  if (!isValid) {
    return; 
  }

  // Setup functionalities
  setupLogout();

  window.tabSystem = setupTabSystem();
  
  setupModalClose();

  setupArtworkUpload();

  setupFileUploads();

  await fetchCurrentUser();
  
  await loadUserFiles();
  
  await loadUserArtworks();

  // Check token validity when window regains focus
  window.addEventListener("focus", async () => {
    console.log("Window focused - checking token validity");
    const isValid = await refreshToken();
    if (!isValid) {
      console.warn("Token is no longer valid after window focus");
    }
  });
  
  console.log("Profile page initialization complete");
});

