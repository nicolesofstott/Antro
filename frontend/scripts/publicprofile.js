document.addEventListener("DOMContentLoaded", () => {
  const backendBase = "http://localhost:5050";

  // Extract user ID from the current URL
  let userId;
  const pathParts = window.location.pathname.split("/");
  userId = pathParts[pathParts.length - 1];
  console.log("Loading public profile for user ID:", userId);

  // Fetch main sections of profile
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
      console.log("Verified artist:", userData.isVerifiedArtist);

      // Populate profile fields
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

      // Artist status
      if (!userData.isVerifiedArtist) {
        console.log("Hiding artwork tab for non-artist");
        const artworkTabButton = document.querySelector('[data-tab="artwork-tab"]');
        if (artworkTabButton) artworkTabButton.style.display = "none";

        const cvTabButton = document.querySelector('[data-tab="cv-tab"]');
        if (cvTabButton) {
          cvTabButton.classList.add("active");
          const cvTab = document.getElementById("cv-tab");
          if (cvTab) cvTab.classList.add("active");
        }

        const artworkTab = document.getElementById("artwork-tab");
        if (artworkTab) artworkTab.classList.remove("active");

      } else {
        console.log("Activating artwork tab for artist");
        const artworkTabButton = document.querySelector('[data-tab="artwork-tab"]');
        if (artworkTabButton) {
          artworkTabButton.style.display = "block";
          artworkTabButton.classList.add("active");
        }

        const artworkTab = document.getElementById("artwork-tab");
        if (artworkTab) artworkTab.classList.add("active");

        ["cv-tab", "portfolio-tab"].forEach(id => {
          const tab = document.getElementById(id);
          const btn = document.querySelector(`[data-tab="${id}"]`);
          if (tab) tab.classList.remove("active");
          if (btn) btn.classList.remove("active");
        });
      }

      setupTabs(userData.isVerifiedArtist);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setupTabs(false);
    }
  }

  // Fetch user's artworks
  async function loadUserArtworks(userId) {
    try {
      console.log("Fetching artworks for:", userId);
      const response = await fetch(`${backendBase}/api/artworks/user/${userId}`);
      if (!response.ok) throw new Error(`Failed to load artworks: ${response.status}`);

      const artworks = await response.json();
      console.log("Artworks loaded:", artworks);

      const container = document.getElementById("art-preview");
      if (!container) return console.error("Art preview container missing");
      container.innerHTML = artworks.length ? "" : "<p>No artworks available.</p>";

      artworks.forEach(art => {
        const wrapper = document.createElement("div");
        wrapper.classList.add("art-item");
        wrapper.dataset.id = art._id;

        const img = document.createElement("img");
        img.src = art.mainImageUrl || art.mainImage;
        img.alt = art.title || "Artwork";
        img.onerror = () => {
          console.error("Fallback: failed to load image:", img.src);
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

  // Fetch CV and portfolio
  async function loadUserFiles(userId) {
    try {
      console.log("Fetching documents for:", userId);

      const cvUrl = `${backendBase}/uploads/${userId}/cv/1745770395566-9781315009650_previewpdf.pdf`;
      const portfolioUrl = `${backendBase}/uploads/${userId}/portfolio/1745770401242-Assessment_Brief_IU000121_Coding_Six_Computational_Communities_and_Professional_Platforms_2.pdf`;

      const cvSection = document.getElementById("resume-preview");
      if (cvSection) cvSection.innerHTML = `<iframe src="${cvUrl}" width="100%" height="600px" style="border: none;"></iframe>`;

      const portfolioSection = document.getElementById("portfolio-preview");
      if (portfolioSection) portfolioSection.innerHTML = `<iframe src="${portfolioUrl}" width="100%" height="600px" style="border: none;"></iframe>`;

      tryApiApproach(userId);
    } catch (error) {
      console.error("Error loading documents:", error);
      const cvSection = document.getElementById("resume-preview");
      const portfolioSection = document.getElementById("portfolio-preview");
      if (cvSection) cvSection.innerHTML = `<p>Error loading CV: ${error.message}</p>`;
      if (portfolioSection) portfolioSection.innerHTML = `<p>Error loading portfolio: ${error.message}</p>`;
    }
  }

  async function tryApiApproach(userId) {
    try {
      const response = await fetch(`${backendBase}/api/files/user/${userId}`);
      if (!response.ok) throw new Error(`Failed to load files: ${response.status}`);
      const data = await response.json();
      console.log("Fallback API file list:", data.files);
    } catch (error) {
      console.error("Fallback API error:", error);
    }
  }

  // Handle tab logic
  function setupTabs(isVerifiedArtist) {
    console.log("Configuring tab interface for artist:", isVerifiedArtist);
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    const style = document.createElement('style');
    style.textContent = `.tab-content { display: none; } .tab-content.active { display: block; }`;
    document.head.appendChild(style);

    tabButtons.forEach(button => {
      button.addEventListener("click", () => {
        tabButtons.forEach(btn => btn.classList.remove("active"));
        tabContents.forEach(tab => tab.classList.remove("active"));

        button.classList.add("active");
        const tab = document.getElementById(button.dataset.tab);
        if (tab) tab.classList.add("active");
        else console.error("Missing tab section:", button.dataset.tab);
      });
    });
  }

  // Launch modal viewer for clicked artwork
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
        images.forEach(src => {
          const modalImg = document.createElement("img");
          modalImg.src = src;
          modalImg.onerror = () => {
            console.error("Failed to load modal image:", src);
            modalImg.src = "../images/profileholder.png";
          };
          imagesContainer.appendChild(modalImg);
        });
      } catch (err) {
        console.error("Could not parse images:", err);
      }
    }

    modal.style.display = "flex";
    modal.classList.remove("hidden");
  }

  // Modal close button logic
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
});
