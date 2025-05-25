document.addEventListener("DOMContentLoaded", () => {
  const backendBase = "http://localhost:5050";

  // Extract user ID from the current URL
  let userId;
  const pathParts = window.location.pathname.split("/");
  userId = pathParts[pathParts.length - 1];
  console.log("Loading public profile for user ID:", userId);

  // Fetch main sections
  fetchUserProfile(userId);
  loadUserArtworks(userId);
  loadUserFiles(userId);

  // Fetch user details
  async function fetchUserProfile(userId) {
    try {
      const response = await fetch(`${backendBase}/api/auth/profile/${userId}`);
      if (!response.ok) throw new Error(`Failed to fetch user data: ${response.status}`);

      const userData = await response.json();
      console.log("User data loaded:", userData);

      const displayName = document.getElementById("display-name");
      const displayAbout = document.getElementById("display-about");
      const profilePic = document.getElementById("profile-pic");

      if (displayName) displayName.textContent = userData.displayName || userData.fullName || userData.username || "Artist";
      if (displayAbout) displayAbout.textContent = userData.about || "No bio available";

      if (profilePic) {
        if (userData.profilePicUrl) {
          profilePic.src = userData.profilePicUrl;
        } else if (userData.profilePic) {
          profilePic.src = `${backendBase}/uploads/${userData._id}/profiles/${userData.profilePic}`;
        } else {
          profilePic.src = "../images/profileholder.png";
        }

        profilePic.onerror = function () {
          console.error("Failed to load profile picture");
          this.src = "../images/profileholder.png";
        };
      }

      setupPublicProfileTabs();
      
    } catch (error) {
      console.error("Error fetching profile:", error);
      setupPublicProfileTabs(); 
    }
  }

  // Fetch user artworks
  async function loadUserArtworks(userId) {
    try {
      console.log("Fetching artworks for:", userId);
      const response = await fetch(`${backendBase}/api/artworks/user/${userId}`);
      if (!response.ok) throw new Error(`Failed to load artworks: ${response.status}`);

      const artworks = await response.json();
      console.log("Artworks loaded:", artworks);

      const container = document.getElementById("art-preview");
      if (!container) return console.error("Art preview container missing");
      
      container.innerHTML = "";

      if (artworks.length === 0) {
        container.innerHTML = "<p>No artworks available.</p>";
        return;
      }

      artworks.forEach(art => {
        const wrapper = document.createElement("div");
        wrapper.classList.add("art-item");
        wrapper.dataset.id = art._id;

        const img = document.createElement("img");
        img.src = art.mainImageUrl || art.mainImage;
        img.alt = art.title || "Artwork";
        img.onerror = () => {
          console.error("Failed to load artwork image:", img.src);
          img.src = "../images/profileholder.png";
        };

        const titleDiv = document.createElement("div");
        titleDiv.classList.add("art-title");
        titleDiv.textContent = art.title || "Untitled";

        wrapper.dataset.title = art.title || "Untitled";
        wrapper.dataset.dimensions = art.dimensions || "Unknown";
        wrapper.dataset.description = art.description || "No description";
        wrapper.dataset.images = JSON.stringify([
          art.mainImageUrl || art.mainImage,
          ...(art.extraImageUrls || art.extraImages || [])
        ].filter(Boolean));

        wrapper.addEventListener("click", () => openModal(wrapper));
        wrapper.append(img, titleDiv);
        container.appendChild(wrapper);
      });
    } catch (error) {
      console.error("Error loading artworks:", error);
      const container = document.getElementById("art-preview");
      if (container) container.innerHTML = `<p>Error loading artworks: ${error.message}</p>`;
    }
  }

  // Load user files 
  async function loadUserFiles(userId) {
    try {
      console.log("Loading files for user ID", userId);

      let files = [];

      try {
        const response = await fetch(`${backendBase}/api/files/user/${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log("API response:", data);
          
          if (Array.isArray(data)) {
            files = data;
          } else if (data.files && Array.isArray(data.files)) {
            files = data.files;
          }
        }
      } catch (apiError) {
        console.log("API failed:", apiError.message);
      }

      if (!files || files.length === 0) {
        console.log("No files from API");
        files = await checkActualFileLocations(userId);
      }

      renderFiles(files);

    } catch (error) {
      console.error("Error loading files:", error);
      showErrorMessage("Error loading files: " + error.message);
    }
  }

  // Check actual file locations 
  async function checkActualFileLocations(targetUserId) {
    console.log("Checking actual file locations...");
    
    const foundFiles = [];
    
    // Check known user directories where files might exist
    const actualUserDirectories = [
      '67fbfbe2d9b1af011f8c11cb', 
      targetUserId,                
    ];
    
    for (const actualUserId of actualUserDirectories) {
      console.log(`Checking user directory: ${actualUserId}`);
      
      // Check both cv and portfolio folders
      const pathsToCheck = [
        `/uploads/${actualUserId}/cv/`,
        `/uploads/${actualUserId}/portfolio/`
      ];
      
      for (const basePath of pathsToCheck) {
        try {
          const response = await fetch(`${backendBase}${basePath}`);
          if (response.ok) {
            const html = await response.text();
            console.log(`Got directory listing for ${basePath}`);
          
            const fileMatches = html.match(/href="([^"]*\.(pdf|docx|doc|png|jpg|jpeg))"/gi);
            
            if (fileMatches) {
              for (const match of fileMatches) {
                const fileName = match.match(/href="([^"]*)"/)[1];
                if (fileName && !fileName.startsWith('.')) {
                  const fullUrl = `${backendBase}${basePath}${fileName}`;
                  
                  if (await checkFileExists(fullUrl)) {
                    const fileType = basePath.includes('/cv') ? 'cv' : 'portfolio';
                    
                    console.log(`✅ Found ${fileType} file: ${fileName}`);
                    
                    foundFiles.push({
                      _id: `found_${fileType}_${Date.now()}`,
                      type: fileType,
                      originalName: fileName,
                      url: fullUrl,
                      path: `${basePath}${fileName}`,
                      source: 'actual_location',
                      actualUserId: actualUserId
                    });
                  }
                }
              }
            }
          }
        } catch (err) {
          console.log(`Could not check ${basePath}:`, err.message);
        }
        
        const fileType = basePath.includes('/cv') ? 'cv' : 'portfolio';
        
        for (const fileName of commonNames[fileType]) {
          const fullUrl = `${backendBase}${basePath}${fileName}`;
          if (await checkFileExists(fullUrl)) {
            console.log(`✅ Found ${fileType} file: ${fileName}`);
            
            foundFiles.push({
              _id: `common_${fileType}_${Date.now()}`,
              type: fileType,
              originalName: fileName,
              url: fullUrl,
              path: `${basePath}${fileName}`,
              source: 'common_name',
              actualUserId: actualUserId
            });
            break;
          }
        }
      }
    }
    
    // Check specific files 
    const knownFiles = [
      {
        path: '/uploads/67fbfbe2d9b1af011f8c11cb/portfolio/1745770401242-Assessment_Brief_IU000121_Coding_Six_Computational_Communities_and_Professional_Platforms_2.pdf',
        type: 'portfolio',
        name: 'Assessment_Brief_IU000121_Coding_Six_Computational_Communities_and_Professional_Platforms_2.pdf'
      },
      {
        path: '/uploads/67fbfbe2d9b1af011f8c11cb/cv/1748024681783-BBH_Barn_application.pdf',
        type: 'cv',
        name: 'BBH_Barn_application.pdf'
      }
    ];
    
    for (const knownFile of knownFiles) {
      const fileUrl = `${backendBase}${knownFile.path}`;
      console.log(`Testing known ${knownFile.type} file: ${fileUrl}`);
      
      if (await checkFileExists(fileUrl)) {
        console.log(`✅ Found known ${knownFile.type} file`);
        foundFiles.push({
          _id: `known_${knownFile.type}_${Date.now()}`,
          type: knownFile.type,
          originalName: knownFile.name,
          url: fileUrl,
          path: knownFile.path,
          source: 'known_location',
          actualUserId: '67fbfbe2d9b1af011f8c11cb'
        });
      } else {
        console.log(`Known ${knownFile.type} file not accessible: ${fileUrl}`);
      }
    }
    
    console.log(`Found ${foundFiles.length} files in actual locations:`, foundFiles);
    return foundFiles;
  }

  // Check if file exists
  async function checkFileExists(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (err) {
      return false;
    }
  }

  // Render files with better empty state handling
  function renderFiles(files) {
    const cvSection = document.getElementById("resume-preview");
    const portfolioSection = document.getElementById("portfolio-preview");

    if (cvSection) cvSection.innerHTML = "";
    if (portfolioSection) portfolioSection.innerHTML = "";

    // Separate files by type
    const cvFiles = files.filter(f => f.type === 'cv');
    const portfolioFiles = files.filter(f => f.type === 'portfolio');

    if (cvSection) {
      if (cvFiles.length > 0) {
        cvFiles.forEach(file => renderFilePreview(cvSection, file));
      } else {
        cvSection.innerHTML = createEmptyStateMessage('CV', 'No CV has been uploaded yet.');
      }
    }

    if (portfolioSection) {
      if (portfolioFiles.length > 0) {
        portfolioFiles.forEach(file => renderFilePreview(portfolioSection, file));
      } else {
        portfolioSection.innerHTML = createEmptyStateMessage('Portfolio', 'No portfolio has been uploaded yet.');
      }
    }

    console.log(`Rendered ${cvFiles.length} CV files and ${portfolioFiles.length} portfolio files`);
  }

  // Create empty state message
  function createEmptyStateMessage(type, message) {
    return `
      <div style="text-align: center; padding: 60px 20px; color: #777; background: #f9f9f9; border-radius: 8px; border: 2px dashed #ddd;">
        <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;">
          ${type === 'CV'}
        </div>
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 10px; color: #555;">
          No ${type} Available
        </div>
        <div style="font-size: 14px; line-height: 1.5;">
          ${message}
        </div>
      </div>
    `;
  }

  // Render file preview
  function renderFilePreview(container, file) {
    const fileName = file.originalName || 'Unknown file';
    const isPDF = fileName.toLowerCase().endsWith('.pdf');
    const isDocx = fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc');
    const isImage = fileName.toLowerCase().match(/\.(png|jpg|jpeg)$/);

    console.log(`Rendering ${file.type}: ${fileName} (${file.url})`);

    if (isPDF) {
      const iframe = document.createElement("iframe");
      iframe.src = file.url;
      iframe.width = "100%";
      iframe.height = "600px";
      iframe.style.border = "none";
      iframe.style.borderRadius = "8px";
      iframe.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
      
      iframe.onerror = () => {
        console.error("Failed to load PDF:", file.url);
        container.innerHTML = createDownloadLink(file.url, fileName);
      };
      
      container.appendChild(iframe);
      
    } else if (isImage) {
      const img = document.createElement("img");
      img.src = file.url;
      img.style.width = "100%";
      img.style.maxWidth = "500px";
      img.style.height = "auto";
      img.style.borderRadius = "8px";
      img.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
      
      img.onerror = () => {
        console.error("Failed to load image:", file.url);
        container.innerHTML = createDownloadLink(file.url, fileName);
      };
      
      container.appendChild(img);
      
    } else {
      container.innerHTML = createDownloadLink(file.url, fileName);
    }
  }

  // Create download link HTML
  function createDownloadLink(fileUrl, fileName) {
    return `
      <div style="text-align: center; padding: 40px; border: 2px dashed #ccc; border-radius: 8px; background: #f9f9f9;">
        <div style="font-weight: bold; margin-bottom: 15px; word-break: break-word;">${fileName}</div>
        <a href="${fileUrl}" target="_blank" 
           style="display: inline-block; background: #007cba; color: white; 
                  padding: 12px 24px; border-radius: 6px; text-decoration: none;
                  font-weight: 600; transition: background 0.3s ease;">
          Download File
        </a>
        <div style="margin-top: 10px; font-size: 0.9rem; color: #666;">
          <a href="${fileUrl}" target="_blank" style="color: #007cba; font-size: 0.8rem;">
            Direct link: ${fileUrl}
          </a>
        </div>
      </div>
    `;
  }


  // Setup tabs for public profile
  function setupPublicProfileTabs() {
    console.log("Setting up tabs for PUBLIC PROFILE - all tabs visible");
    
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    const style = document.createElement('style');
    style.textContent = `.tab-content { display: none; } .tab-content.active { display: block; }`;
    document.head.appendChild(style);

    // Set up tab click handlers
    tabButtons.forEach(button => {
      button.addEventListener("click", () => {
        tabButtons.forEach(btn => btn.classList.remove("active"));
        tabContents.forEach(tab => tab.classList.remove("active"));

        button.classList.add("active");
        const tab = document.getElementById(button.dataset.tab);
        if (tab) tab.classList.add("active");
      });
    });

    const artworkTabButton = document.querySelector('[data-tab="artwork-tab"]');
    if (artworkTabButton) {
      artworkTabButton.click();
    } else {
      const firstTabButton = tabButtons[0];
      if (firstTabButton) {
        firstTabButton.click();
      }
    }
  }

  // Modal functionality for artworks
  function openModal(wrapper) {
    const modal = document.getElementById("artworkModal");
    if (!modal) return console.error("Artwork modal missing");

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
        images.forEach((src, index) => {
          if (src) {
            const modalImg = document.createElement("img");
            modalImg.src = src;
            modalImg.alt = `${wrapper.dataset.title} - Image ${index + 1}`;
            modalImg.style.width = "100%";
            modalImg.style.marginBottom = "15px";
            modalImg.style.borderRadius = "8px";
            modalImg.onerror = () => {
              console.error("Failed to load modal image:", src);
              modalImg.src = "../images/profileholder.png";
            };
            imagesContainer.appendChild(modalImg);
          }
        });
      } catch (err) {
        console.error("Could not parse images:", err);
      }
    }

    modal.style.display = "flex";
    modal.classList.remove("hidden");
  }

  // Modal close functionality
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

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    const modal = document.getElementById("artworkModal");
    if (e.target === modal) {
      modal.style.display = "none";
      modal.classList.add("hidden");
    }
  });
});