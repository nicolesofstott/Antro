// Profile-specific authentication
const backendBase = "http://localhost:5050";

// User authentication functions
function getAuthData() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");
  
  if (!user || !token) {
    return null;
  }
  
  return { user, token };
}

// Debug authentication info
function debugAuth() {
  console.group("Authentication Debug Info");
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  console.log("Token exists:", token ? "Yes" : "No");
  console.log("Token first 10 chars:", token ? token.substring(0, 10) + "..." : "N/A");
  console.log("User in localStorage:", user);
  console.log("User ID:", user?._id || "Missing");
  console.log("Current location:", window.location.href);
  console.groupEnd();
}

// Token validation function
async function validateToken() {
  console.log("Validating token...");
  const token = localStorage.getItem("token");
  
  try {
    const response = await fetch(`${backendBase}/api/profile/me`, {
      headers: { 
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      console.log("✓ Token is valid");
      const userData = await response.json();
      localStorage.setItem("user", JSON.stringify(userData));
      return true;
    } else {
      console.error("✗ Token validation failed:", response.status);
      alert("Your session has expired. Please log in again.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "../authentication/login.html";
      return false;
    }
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
}

// Additional token verification
async function refreshToken() {
  try {
    const freshToken = localStorage.getItem("token");

    if (!freshToken) {
      return false;
    }

    const response = await fetch(`${backendBase}/api/profile/me`, {
      headers: { 
        "Authorization": `Bearer ${freshToken}`
      }
    });

    if (response.ok) {
      console.log("Token is still valid");
      const userData = await response.json();
      localStorage.setItem("user", JSON.stringify(userData));
      return true;
    } else {
      console.warn("Token is invalid or expired");
      return false;
    }
  } catch (error) {
    console.error("Error checking token:", error);
    return false;
  }
}

// Logout functionality
function setupLogout() {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      alert("You have been logged out successfully.");
      window.location.href = "../authentication/login.html";
    });
  }
}

export { getAuthData, debugAuth, validateToken, refreshToken, setupLogout, backendBase };