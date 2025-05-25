document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  
  // User logged in
  const checkLoggedInStatus = () => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData && window.location.href.includes("login.html")) {
      console.log("Already logged in, redirecting to profile");
      window.location.href = "../profile/profile.html";
      return true;
    }
    return false;
  };
  
  if (checkLoggedInStatus()) return;

  // Login
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      
      // Disable form during submission
      const submitButton = loginForm.querySelector("button[type=submit]");
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Logging in...";
      }

      try {
        const res = await fetch("http://localhost:5050/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || data.error || "Login failed");

        localStorage.clear();
        
        // Save token and user to localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        console.log("Login successful!");
        console.log("Token saved, length:", data.token.length);
        console.log("User data saved:", data.user ? `ID: ${data.user._id}` : "No user data");

        // Check token structure without exposing secret
        try {
          const tokenParts = data.token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log("Token payload:", payload);
          }
        } catch (e) {
          console.error("Error parsing token:", e);
        }

        alert("Login successful!");
        window.location.href = "../profile/profile.html";
      } catch (err) {
        console.error("Login error:", err);
        alert("Login failed: " + (err.message || "Please try again"));
      } finally {
        // Re-enable form
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Login";
        }
      }
    });
  }

  // Signup
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const displayName = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const username = document.querySelector("[name='username']").value;
      const password = document.getElementById("password").value;
      
      const submitButton = signupForm.querySelector("button[type=submit]");
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Creating account...";
      }

      try {
        const res = await fetch("http://localhost:5050/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            username, 
            email, 
            password,
            displayName
          }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || data.error || "Signup failed");

        alert("Account created successfully! You can now log in.");
        window.location.href = "login.html";
      } catch (err) {
        console.error("Signup error:", err);
        alert("Signup failed: " + (err.message || "Please try again"));
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Sign Up";
        }
      }
    });
  }
  
  // Logout functionality
  const logoutButton = document.getElementById("logout-btn");
  if (logoutButton) {
    logoutButton.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      console.log("Logged out successfully");
      alert("Logged out successfully");
      window.location.href = "../authentication/login.html";
    });
  }
  
  // Check authentication status
  window.isAuthenticated = function() {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    return !!(token && userData);
  };
  
  // Get current user
  window.getCurrentUser = function() {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  };
  
  // Helper function for authenticated API calls
  window.authFetch = async function(url, options = {}) {
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.warn("No authentication token available");
      if (confirm("Your session has expired. Please log in again.")) {
        window.location.href = "../authentication/login.html";
      }
      throw new Error("Authentication required");
    }
    
    const authOptions = {
      ...options,
      headers: {
        ...options.headers,
        "Authorization": `Bearer ${token}`
      }
    };
    
    return fetch(url, authOptions);
  };
});