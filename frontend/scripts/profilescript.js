document.addEventListener("DOMContentLoaded", () => {
  const backendBase = "http://localhost:5050"; 
  
  // Debug for authentication info
  console.group("Authentication Debug Info");
  const debugToken = localStorage.getItem("token");
  const debugUser = JSON.parse(localStorage.getItem("user") || "{}");
  console.log("Token exists:", debugToken ? "Yes" : "No");
  console.log("Token first 10 chars:", debugToken ? debugToken.substring(0, 10) + "..." : "N/A");
  console.log("User in localStorage:", debugUser);
  console.log("User ID:", debugUser?._id || "Missing");
  console.log("Current location:", window.location.href);
  console.groupEnd();

  // Get user info and token
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  if (!user || !token) {
    alert("Please log in to view your profile.");
    window.location.href = "../authentication/login.html";
    return;
  }

  // Token validation function
  async function validateToken() {
    console.log("Validating token...");
    
    try {
      const response = await fetch(`${backendBase}/api/profile/me`, {
        headers: { 
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        console.log("✓ Token is valid");
        // Update the user data in localStorage with fresh data
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

  validateToken();

  console.log("User data:", user);
  console.log("Using backend:", backendBase);

  // Profile elements
  const profilePic = document.getElementById("profile-pic");
  const displayName = document.getElementById("display-name");
  const displayAbout = document.getElementById("display-about");

  fetchCurrentUser();

  // Logout functionality
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      alert("You have been logged out successfully.");
      window.location.href = "../authentication/login.html";
    });
  }

  // Tab system
  console.log("Setting up tabs");
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");
  
  tabContents.forEach((tab, index) => {
    if (index === 0) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });
  
  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      console.log(`Tab clicked: ${button.dataset.tab}`);
      
      tabButtons.forEach(btn => btn.classList.remove("active"));
      tabContents.forEach(content => content.classList.remove("active"));
      
      // Add active class to clicked button and corresponding content
      button.classList.add("active");
      const tabContent = document.getElementById(button.dataset.tab);
      if (tabContent) {
        tabContent.classList.add("active");
        localStorage.setItem("activeProfileTab", button.dataset.tab);
      } else {
        console.error(`Tab content not found: ${button.dataset.tab}`);
      }
    });
  });
  
  // Activate tab by default
  const savedTab = localStorage.getItem("activeProfileTab");
  if (savedTab && document.getElementById(savedTab)) {
    const savedTabButton = document.querySelector(`[data-tab="${savedTab}"]`);
    if (savedTabButton) {
      savedTabButton.click();
    } else {
      console.warn(`Saved tab button not found: ${savedTab}`);
      tabButtons[0]?.click(); 
    }
  } else {
    tabButtons[0]?.click(); 
  }

  // Artwork Upload
  const uploadForm = document.getElementById("artwork-upload-form");
  const toggleArtForm = document.getElementById("toggle-art-form");
  
  if (toggleArtForm) {
    toggleArtForm.addEventListener("click", () => {
      const artUploadForm = document.getElementById("art-upload-form");
      if (artUploadForm) {
        artUploadForm.classList.toggle("hidden");
      }
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(uploadForm);

      // Verify token is still valid
      const freshToken = localStorage.getItem("token");
      if (!freshToken) {
        alert("Your session has expired. Please log in again.");
        window.location.href = "../authentication/login.html";
        return;
      }

      for (let pair of formData.entries()) {
        console.log(`Form data: ${pair[0]}: ${pair[1]}`);
      }

      // Verify dimensins format
      const dimensions = formData.get('dimensions');
      if (dimensions && !/^\d{1,3}x\d{1,3}$/.test(dimensions)) {
        alert("Dimensions must be in format: widthxheight (e.g., 100x200)");
        return;
      }

      // Larger files
      try {
        const extraImagesField = uploadForm.querySelector('input[name="extraImages"]');
        const hasMultipleFiles = extraImagesField && extraImagesField.files && extraImagesField.files.length > 3;
        
        if (hasMultipleFiles) {
          alert("Uploading multiple files. This may take a moment...");
        }
        
        console.log("Sending artwork upload request...");
        console.log("Using authorization token:", freshToken ? freshToken.substring(0, 10) + "..." : "MISSING");
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000);
        
        try {
          const res = await fetch(`${backendBase}/api/artworks/upload`, {
            method: "POST",
            headers: { 
              Authorization: `Bearer ${freshToken}`
            },
            body: formData,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          let responseText;
          let responseReadSuccess = false;
          
          try {
            responseText = await res.text();
            responseReadSuccess = true;
            console.log("Upload response text:", responseText);
          } catch (e) {
            console.error("Failed to read response text:", e);
            if (hasMultipleFiles) {
              console.log("Multiple files uploaded, waiting to verify success...");
              await new Promise(resolve => setTimeout(resolve, 2000));
              responseReadSuccess = false;
            } else {
              throw new Error("Failed to read server response");
            }
          }
          
          if (responseReadSuccess && !res.ok) {
            let errorMessage = "Upload failed";
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorData.message || "Upload failed";
            } catch (e) {
              console.error("Failed to parse error response:", e);
            }

            if (res.status === 401 || res.status === 403) {
              alert("Your session has expired. Please log in again.");
              window.location.href = "../authentication/login.html";
              return;
            }
            
            throw new Error(errorMessage);
          }

          alert("Upload successful!");
          uploadForm.reset();
          const artUploadForm = document.getElementById("art-upload-form");
          if (artUploadForm) {
            artUploadForm.classList.add("hidden");
          }
          await loadUserArtworks();
          
        } catch (fetchError) {
          clearTimeout(timeoutId);
          
          // Check if it's an abort error (timeout)
          if (fetchError.name === 'AbortError') {
            console.log("Request timed out, but upload might still be processing...");
            alert("The request timed out, but your upload may still be processing. We'll check if it was successful.");
            
            await new Promise(resolve => setTimeout(resolve, 3000));
            await loadUserArtworks();
          } else {
            throw fetchError;
          }
        }
      } catch (err) {
        console.error("Upload error:", err);
        alert(`Failed to upload artwork: ${err.message}`);
      }
    });
  }

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

      // Update localStorage
      localStorage.setItem("user", JSON.stringify(userData));

      // User info
      displayName.textContent = userData.displayName || userData.fullName || userData.username || "Your Name";
      displayAbout.textContent = userData.about || userData.email || "No bio available";

      // Set profile picture
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

  // Non-artist users
  if (!userData.isVerifiedArtisqt) {
    const artworkTabButton = document.querySelector('[data-tab="artwork-tab"]');
    if (artworkTabButton) {
      artworkTabButton.style.display = "none";
    }
    
    const cvTabButton = document.querySelector('[data-tab="cv-tab"]');
    if (cvTabButton) {
      cvTabButton.classList.add("active");
      const cvTab = document.getElementById("cv-tab");
      if (cvTab) cvTab.classList.add("active");
    }
    
    const artworkTab = document.getElementById("artwork-tab");
    if (artworkTab) {
      artworkTab.classList.remove("active");
    }
  }

    } catch (err) {
      console.error("Error fetching user profile:", err);
      
      if (err.message === "Authentication failed" || err.message === "Authentication token missing") {
        alert("Your session has expired. Please log in again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "../authentication/login.html";
      }
    }
  }

  // Load user artworks
  async function loadUserArtworks() {
    try {
      console.log("Loading user artworks...");
      const freshToken = localStorage.getItem("token");
      
      if (!freshToken) {
        throw new Error("Authentication token missing");
      }
      
      const res = await fetch(`${backendBase}/api/artworks/mine`, {
        headers: { Authorization: `Bearer ${freshToken}` }
      });
      
      let responseText;
      try {
        responseText = await res.text();
        console.log("Artworks response text:", responseText);
      } catch (e) {
        console.error("Failed to read artworks response:", e);
      }
  
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Authentication failed");
        }
        
        let errorMessage = "Failed to load artworks";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || "Failed to load artworks";
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        throw new Error(errorMessage);
      }
  
      let artworks;
      try {
        artworks = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse artworks JSON:", e);
        throw new Error("Invalid response format");
      }
      
      console.log("Loaded artworks:", artworks);
  
      const container = document.getElementById("art-preview");
      if (!container) {
        console.error("Art preview container not found");
        return;
      }
  
      container.innerHTML = "";
  
      if (artworks.length === 0) {
        container.innerHTML = "<p>No artworks found. Upload some artwork to get started!</p>";
        return;
      }
      
      // Image handling
      artworks.forEach((art) => {
        console.log("Processing artwork:", art);
        
        let mainImageUrl;
        if (art.mainImageUrl) {
          mainImageUrl = art.mainImageUrl;
        } else if (art.mainImage) {
          mainImageUrl = art.mainImage.startsWith('http') 
            ? art.mainImage 
            : `${backendBase}/${art.mainImage}`;
        } else {
          mainImageUrl = "../images/profileholder.png"; 
        }
        
        console.log("Main image URL:", mainImageUrl);
        
        let extraImageUrls = [];
        if (art.extraImageUrls && Array.isArray(art.extraImageUrls)) {
          extraImageUrls = art.extraImageUrls;
        } else if (art.extraImages && Array.isArray(art.extraImages)) {
          extraImageUrls = art.extraImages.map(img => 
            img.startsWith('http') ? img : `${backendBase}/${img}`
          );
        }
  
        console.log("Extra image URLs:", extraImageUrls);
  
        renderArtPreview("art-preview", {
          ...art,
          mainImage: mainImageUrl,
          extraImages: extraImageUrls
        });
      });
    } catch (err) {
      console.error("Error loading artworks:", err);
      
      if (err.message === "Authentication failed" || err.message === "Authentication token missing") {
        alert("Your session has expired. Please log in again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "../authentication/login.html";
        return;
      }
      
      const container = document.getElementById("art-preview");
      if (container) {
        container.innerHTML = `<p>Error loading artworks: ${err.message}</p>`;
      }
    }
  }  

  // Open modal for artwork preview
  function renderArtPreview(containerId, artwork) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container not found: ${containerId}`);
      return;
    }
    
    const wrapper = document.createElement("div");
    wrapper.classList.add("art-item");
    wrapper.dataset.id = artwork._id;

    const img = document.createElement("img");
    img.src = artwork.mainImage;
    img.alt = artwork.title || "Artwork";
    img.onerror = () => {
      console.error(`Failed to load image: ${artwork.mainImage}`);
      img.src = "../images/profileholder.png"; // Fallback image
    };

    const titleDiv = document.createElement("div");
    titleDiv.classList.add("art-title");
    titleDiv.textContent = artwork.title || "Untitled";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`Are you sure you want to delete "${artwork.title || 'Untitled'}"?`)) {
        deleteArtwork(artwork._id, wrapper);
      }
    };

    wrapper.dataset.title = artwork.title || "Untitled";
    wrapper.dataset.dimensions = artwork.dimensions || "Unknown";
    wrapper.dataset.description = artwork.description || "No description";
    
    const allImages = [artwork.mainImage, ...(artwork.extraImages || [])].filter(Boolean);
    wrapper.dataset.images = JSON.stringify(allImages);

    wrapper.addEventListener("click", () => openModal(wrapper));
    wrapper.appendChild(img);
    wrapper.appendChild(titleDiv);
    wrapper.appendChild(deleteBtn);
    container.appendChild(wrapper);
  }

  async function deleteArtwork(artworkId, wrapperElement) {
    if (!artworkId) {
      console.error("No artwork ID provided for deletion");
      return;
    }
    
    const freshToken = localStorage.getItem("token");
    if (!freshToken) {
      alert("Your session has expired. Please log in again.");
      window.location.href = "../authentication/login.html";
      return;
    }
    
    try {
      console.log(`Deleting artwork: ${artworkId}`);
      const res = await fetch(`${backendBase}/api/artworks/${artworkId}`, {
        method: "DELETE",
        headers: { 
          Authorization: `Bearer ${freshToken}`
        }
      });
      
      let responseText;
      try {
        responseText = await res.text();
        console.log("Delete response:", responseText);
      } catch (e) {
        console.error("Failed to read delete response:", e);
      }
      
      if (res.ok) {
        wrapperElement.remove();
        alert("Artwork deleted successfully");
      } else {
        if (res.status === 401 || res.status === 403) {
          alert("Your session has expired. Please log in again.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "../authentication/login.html";
          return;
        }
        
        let errorMessage = `Failed to delete artwork. Status: ${res.status}`;
        try {
          if (responseText) {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          }
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        alert(errorMessage);
      }
    } catch (err) {
      console.error("Error deleting artwork:", err);
      alert(`Failed to delete artwork: ${err.message}`);
    }
  }

  // CV and Portfolio Upload
  const resumeUpload = document.getElementById("resume-upload");
  if (resumeUpload) {
    resumeUpload.addEventListener("change", async function() {
      const file = this.files[0];
      if (!file) return;
      
      const freshToken = localStorage.getItem("token");
      if (!freshToken) {
        alert("Your session has expired. Please log in again.");
        window.location.href = "../authentication/login.html";
        return;
      }
      
      const formData = new FormData();
      formData.append("cv", file);
      
      try {
        console.log("Uploading CV file:", file.name);
        console.log("File size:", file.size, "bytes");
        console.log("Using authorization token:", freshToken ? freshToken.substring(0, 10) + "..." : "MISSING");
        
        const res = await fetch(`${backendBase}/api/files/uploadCV`, {
          method: "POST",
          headers: { Authorization: `Bearer ${freshToken}` },
          body: formData
        });
        
        let responseText;
        try {
          responseText = await res.text();
          console.log("CV upload response text:", responseText);
        } catch (e) {
          console.error("Failed to read CV upload response:", e);
        }
        
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            alert("Your session has expired. Please log in again.");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "../authentication/login.html";
            return;
          }
          
          let errorMessage = "Upload failed";
          try {
            if (responseText) {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorData.message || errorMessage;
            }
          } catch (e) {
            console.error("Failed to parse error response:", e);
          }
          throw new Error(errorMessage);
        }
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error("Failed to parse CV upload JSON:", e);
          throw new Error("Invalid response format");
        }
        
        console.log("CV upload response:", data);
        
        // Construct the file URL
        let fileUrl;
        if (data.file.url) {
          fileUrl = data.file.url;
        } else if (data.file.path) {
          fileUrl = `${backendBase}/${data.file.path}`;
        } else {
          throw new Error("File URL not available in response");
        }
        
        console.log("CV URL:", fileUrl);
        renderPDFPreview("resume-preview", fileUrl, data.file._id);
        
        // CV tab
        const cvTabButton = document.querySelector('[data-tab="cv-tab"]');
        if (cvTabButton) cvTabButton.click();
        
        // Reset file input
        this.value = '';
      } catch (err) {
        console.error("CV upload error:", err);
        alert(`Failed to upload CV: ${err.message}`);
        this.value = '';
      }
    });
  }

  // Portfolio Upload
  const portfolioUpload = document.getElementById("portfolio-upload");
  if (portfolioUpload) {
    portfolioUpload.addEventListener("change", async function() {
      const file = this.files[0];
      if (!file) return;
      
      const freshToken = localStorage.getItem("token");
      if (!freshToken) {
        alert("Your session has expired. Please log in again.");
        window.location.href = "../authentication/login.html";
        return;
      }
      
      const formData = new FormData();
      formData.append("portfolio", file);
      
      try {
        console.log("Uploading portfolio file:", file.name);
        console.log("File size:", file.size, "bytes");
        console.log("Using authorization token:", freshToken ? freshToken.substring(0, 10) + "..." : "MISSING");
        
        const res = await fetch(`${backendBase}/api/files/uploadPortfolio`, {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${freshToken}`
          },
          body: formData
        });
        
        let responseText;
        try {
          responseText = await res.text();
          console.log("Portfolio upload response text:", responseText);
        } catch (e) {
          console.error("Failed to read portfolio upload response:", e);
        }
        
        if (!res.ok) {
          // Handle authentication errors
          if (res.status === 401 || res.status === 403) {
            alert("Your session has expired. Please log in again.");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "../authentication/login.html";
            return;
          }
          
          let errorMessage = "Upload failed";
          try {
            if (responseText) {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorData.message || errorMessage;
            }
          } catch (e) {
            console.error("Failed to parse error response:", e);
          }
          throw new Error(errorMessage);
        }
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error("Failed to parse portfolio upload JSON:", e);
          throw new Error("Invalid response format");
        }
        
        console.log("Portfolio upload response:", data);
        
        // Construct the file URL
        let fileUrl;
        if (data.file.url) {
          fileUrl = data.file.url;
        } else if (data.file.path) {
          fileUrl = `${backendBase}/${data.file.path}`;
        } else {
          throw new Error("File URL not available in response");
        }
        
        console.log("Portfolio URL:", fileUrl);
        renderPDFPreview("portfolio-preview", fileUrl, data.file._id);
        
        // Switch to the portfolio tab
        const portfolioTabButton = document.querySelector('[data-tab="portfolio-tab"]');
        if (portfolioTabButton) portfolioTabButton.click();
        
        // Reset the file input
        this.value = '';
      } catch (err) {
        console.error("Portfolio upload error:", err);
        alert(`Failed to upload portfolio: ${err.message}`);
        // Reset the file input on error too
        this.value = '';
      }
    });
  }

  // Render PDF preview
  function renderPDFPreview(containerId, fileUrl, fileId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container not found: ${containerId}`);
      return;
    }
    
    // Clear any existing preview items if this is a new upload
    const existingItems = container.querySelectorAll(".pdf-item");
    if (existingItems.length > 0) {
      existingItems.forEach(item => item.remove());
    }
    
    const wrapper = document.createElement("div");
    wrapper.classList.add("pdf-item");
    wrapper.dataset.id = fileId;

    const embed = document.createElement("embed");
    embed.src = fileUrl;
    embed.type = "application/pdf";
    embed.width = "100%";
    embed.height = "500px";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm("Are you sure you want to delete this file?")) {
        deleteFile(fileId, wrapper);
      }
    };

    wrapper.appendChild(embed);
    wrapper.appendChild(deleteBtn);
    container.appendChild(wrapper);
  }

  // Delete file function
  async function deleteFile(fileId, wrapperElement) {
    if (!fileId) {
      console.error("No file ID provided for deletion");
      return;
    }
    
    const freshToken = localStorage.getItem("token");
    if (!freshToken) {
      alert("Your session has expired. Please log in again.");
      window.location.href = "../authentication/login.html";
      return;
    }
    
    try {
      console.log(`Deleting file: ${fileId}`);
      const res = await fetch(`${backendBase}/api/files/${fileId}`, {
        method: "DELETE",
        headers: { 
          Authorization: `Bearer ${freshToken}`
        }
      });

      let responseText;
      try {
        responseText = await res.text();
        console.log("Delete file response:", responseText);
      } catch (e) {
        console.error("Failed to read delete file response:", e);
      }
      
      if (res.ok) {
        wrapperElement.remove();
        alert("File deleted successfully");
      } else {
        // Handle authentication errors
        if (res.status === 401 || res.status === 403) {
          alert("Your session has expired. Please log in again.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "../authentication/login.html";
          return;
        }
        
        let errorMessage = `Failed to delete file. Status: ${res.status}`;
        try {
          if (responseText) {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          }
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        alert(errorMessage);
      }
    } catch (err) {
      console.error("Error deleting file:", err);
      alert(`Failed to delete file: ${err.message}`);
    }
  }

  // Modal for artwork preview
  function openModal(wrapper) {
    const modal = document.getElementById("artworkModal");
    if (!modal) {
      console.error("Modal not found");
      return;
    }
    
    const modalTitle = document.getElementById("modalTitle");
    const modalDimensions = document.getElementById("modalDimensions");
    const modalDescription = document.getElementById("modalDescription");
    const imagesContainer = document.getElementById("modalImages");
    
    if (modalTitle) modalTitle.textContent = wrapper.dataset.title;
    if (modalDimensions) modalDimensions.textContent = `Dimensions: ${wrapper.dataset.dimensions}`;
    if (modalDescription) modalDescription.textContent = wrapper.dataset.description;

    if (imagesContainer) {
      imagesContainer.innerHTML = "";

      try {
        const images = JSON.parse(wrapper.dataset.images);
        if (Array.isArray(images)) {
          images.forEach((src) => {
            if (!src) return;
            const modalImg = document.createElement("img");
            modalImg.src = src;
            modalImg.onerror = () => {
              console.error(`Failed to load modal image: ${src}`);
              modalImg.src = "../images/profileholder.png"; // Fallback image
            };
            imagesContainer.appendChild(modalImg);
          });
        } else {
          console.error("Images data is not an array:", images);
        }
      } catch (err) {
        console.error("Error parsing image data:", err, wrapper.dataset.images);
      }
    }

    modal.style.display = "flex";
    modal.classList.remove("hidden");
  }

  const closeModalBtn = document.getElementById("closeModalBtn");
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      const modal = document.getElementById("artworkModal");
      if (modal) {
        modal.style.display = "none";
        modal.classList.add("hidden");
      }
    });
  }

  // Load Files
  loadUserFiles();
  loadUserArtworks();

// Load user files
async function loadUserFiles() {
    try {
      console.log("Loading user files...");
      const freshToken = localStorage.getItem("token");
      
      if (!freshToken) {
        throw new Error("Authentication token missing");
      }
      
      const res = await fetch(`${backendBase}/api/files`, {
        headers: { Authorization: `Bearer ${freshToken}` }
      });
      
      let responseText;
      try {
        responseText = await res.text();
        console.log("Files response text:", responseText);
      } catch (e) {
        console.error("Failed to read files response:", e);
      }
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Authentication failed");
        }
        
        let errorMessage = "Failed to load files";
        try {
          if (responseText) {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          }
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        throw new Error(errorMessage);
      }

      let files;
      try {
        files = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse files JSON:", e);
        throw new Error("Invalid response format");
      }
      
      console.log("Loaded files:", files);
      
      if (!files || files.length === 0) {
        console.log("No files found");
        return;
      }

      // Clear existing PDF previews
      document.getElementById("resume-preview").innerHTML = "";
      document.getElementById("portfolio-preview").innerHTML = "";

      files.forEach(file => {
        if (!file.path && !file.url) {
          console.warn("File missing path and url:", file);
          return;
        }
        
        // Construct the file URL 
        let fileUrl;
        if (file.url) {
          fileUrl = file.url;
        } else if (file.path) {
          fileUrl = `${backendBase}/${file.path}`;
        } else {
          console.warn("File missing path and url:", file);
          return;
        }
        
        console.log(`Rendering file: ${file.type}, URL: ${fileUrl}`);
        
        if (file.type === "cv") {
          renderPDFPreview("resume-preview", fileUrl, file._id);
        } else if (file.type === "portfolio") {
          renderPDFPreview("portfolio-preview", fileUrl, file._id);
        }
      });      
    } catch (err) {
      console.error("Error loading files:", err);
      
      if (err.message === "Authentication failed" || err.message === "Authentication token missing") {
        alert("Your session has expired. Please log in again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "../authentication/login.html";
      }
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
  
  
  window.addEventListener("focus", async () => {
    console.log("Window focused - checking token validity");
    const isValid = await refreshToken();
    if (!isValid) {
      console.warn("Token is no longer valid after window focus");
    }
  });
});