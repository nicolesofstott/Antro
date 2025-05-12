const selectedArtworks = [];
const backendBase = "http://localhost:5050"; 

function getGalleries() {
  const data = localStorage.getItem("userGalleries");
  return data ? JSON.parse(data) : [];
}

function saveGalleries(galleries) {
  localStorage.setItem("userGalleries", JSON.stringify(galleries));
}

function checkAuthentication() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  
  if (!token || !user) {
    console.log("User not authenticated");
    return false;
  }
  return true;
}

// Render My Galleries
function renderGalleries() {
  const galleryGrid = document.querySelector("#my-galleries .gallery-grid");
  galleryGrid.innerHTML = "";

  const createCard = document.createElement("div");
  createCard.className = "gallery-card create-new";
  createCard.textContent = "＋";
  createCard.addEventListener("click", openCreateModal);
  galleryGrid.appendChild(createCard);

  const galleries = getGalleries();
  galleries.forEach((gallery, index) => {
    const card = document.createElement("div");
    card.className = "gallery-card";
    card.innerHTML = `<h3>${gallery.name}</h3>`;

    card.addEventListener("click", () => {
      const url = `../Create gallery/creategallery.html?gallery=${encodeURIComponent(gallery.name)}&frameStyle=${encodeURIComponent(gallery.frameStyle || "gold")}`;
      window.location.href = url;
      
      console.log("Navigating to:", url);
      console.log("Gallery data:", gallery);
    });

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "delete-btn";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const updated = galleries.filter((_, i) => i !== index);
      saveGalleries(updated);
      renderGalleries();
    });
    card.appendChild(deleteBtn);

    galleryGrid.appendChild(card);
  });
}

// Fetch User Artworks
async function fetchUserArtworks() {
  try {
    if (!checkAuthentication()) {
      return [{
        _id: 'mock1',
        title: 'Sample Artwork 1',
        artist: 'You',
        url: '../images/profileholder.png',
        width: 100,
        height: 150
      }];
    }

    const token = localStorage.getItem("token");
    const response = await fetch(`${backendBase}/api/artworks/mine`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch artworks: ${response.status}`);
    }

    const artworks = await response.json();
    console.log("Fetched user artworks:", artworks);
    
    // Format the artworks for the gallery
    return artworks.map(art => ({
      _id: art._id,
      title: art.title || "Untitled",
      artist: localStorage.getItem("user") ? 
        JSON.parse(localStorage.getItem("user")).displayName || "You" : 
        "You",
      url: art.mainImageUrl || art.mainImage || "../images/profileholder.png",
      width: art.dimensions ? parseInt(art.dimensions.split('x')[0]) : 100,
      height: art.dimensions ? parseInt(art.dimensions.split('x')[1]) : 150
    }));
  } catch (err) {
    console.error("Error fetching user artworks:", err);
    return [];
  }
}

// Modal Functions
async function openCreateModal() {
  document.getElementById("createGalleryModal").style.display = "flex";
  
  const userArtworks = await fetchUserArtworks();
  
  window.artworkLibrary = userArtworks;
  
  selectedArtworks.length = 0;

  renderArtworkGrid();
}

document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("createGalleryModal").style.display = "none";
});

// Artwork Grid Rendering
function renderArtworkGrid() {
  const grid = document.getElementById("artworkSelection");
  const search = document.getElementById("artworkSearch").value.toLowerCase();
  grid.innerHTML = "";

  if (!window.artworkLibrary || window.artworkLibrary.length === 0) {
    grid.innerHTML = "<p>No artworks found. Upload artworks in your profile first!</p>";
    return;
  }

  window.artworkLibrary.forEach((art, index) => {
    const matchesSearch =
      art.title.toLowerCase().includes(search) ||
      art.artist.toLowerCase().includes(search);

    if (matchesSearch) {
      const artElement = document.createElement("div");
      artElement.className = "artwork-item";
      
      const img = document.createElement("img");
      img.src = art.url;
      img.alt = `${art.title} by ${art.artist}`;
      img.title = `${art.title} by ${art.artist}`;
      
      const info = document.createElement("div");
      info.className = "artwork-info";
      info.innerHTML = `
        <h4>${art.title}</h4>
        <p>${art.dimensions ? art.dimensions : `${art.width}x${art.height}`}</p>
      `;

      if (selectedArtworks.includes(index)) {
        artElement.classList.add("selected");
      }

      artElement.addEventListener("click", () => {
        if (selectedArtworks.includes(index)) {
          selectedArtworks.splice(selectedArtworks.indexOf(index), 1);
          artElement.classList.remove("selected");
        } else {
          selectedArtworks.push(index);
          artElement.classList.add("selected");
        }
      });

      artElement.appendChild(img);
      artElement.appendChild(info);
      grid.appendChild(artElement);
    }
  });
}

document.getElementById("artworkSearch").addEventListener("input", renderArtworkGrid);

// Create Gallery
document.getElementById("createBtn").addEventListener("click", () => {
  const name = document.getElementById("galleryName").value.trim();
  const size = document.getElementById("roomSize").value;
  const frameStyle = document.getElementById("frameStyle").value;

  if (!name) {
    alert("Please enter a gallery name.");
    return;
  }

  if (selectedArtworks.length === 0) {
    alert("Please select at least one artwork.");
    return;
  }

  const selected = selectedArtworks.map(i => ({
    title: window.artworkLibrary[i].title,
    artist: window.artworkLibrary[i].artist,
    url: window.artworkLibrary[i].url, // Use 'url' to match create.js expectations
    width: window.artworkLibrary[i].width || 100,
    height: window.artworkLibrary[i].height || 150
  }));  
  
  const newGallery = {
    name,
    size,
    frameStyle,
    artworks: selected
  };

  const galleries = getGalleries();
  galleries.push(newGallery);
  saveGalleries(galleries);

  console.log("Gallery created:", newGallery);
  console.log("All galleries:", galleries);

  // Reset
  document.getElementById("createGalleryModal").style.display = "none";
  document.getElementById("galleryName").value = "";
  selectedArtworks.length = 0;

  renderGalleries();
});

// Tabs Logic
document.querySelectorAll(".tab-button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));

    const tabName = button.dataset.tab;
    button.classList.add("active");
    document.getElementById(tabName).classList.add("active");
  });
});

// Explore Gallery Functionality
async function loadExploreGalleries() {
  const exploreGrid = document.getElementById("exploreGalleryGrid");
  exploreGrid.innerHTML = "<p>Loading galleries...</p>";
  
  try {
    const galleries = getGalleries();
    
    if (galleries.length === 0) {
      exploreGrid.innerHTML = "<p>No galleries found. Create one to get started!</p>";
      return;
    }
    
    exploreGrid.innerHTML = "";
    galleries.forEach(gallery => {
      const card = document.createElement("div");
      card.className = "gallery-card";
      
      // Get the first artwork image as a preview if available
      const previewImage = gallery.artworks && gallery.artworks.length > 0 ? 
        gallery.artworks[0].url : "../images/profileholder.png";
      
      card.innerHTML = `
        <div class="gallery-preview">
          <img src="${previewImage}" alt="${gallery.name}">
        </div>
        <h3>${gallery.name}</h3>
        <p>${gallery.artworks ? gallery.artworks.length : 0} artworks</p>
      `;
      
      card.addEventListener("click", () => {
        const url = `../Create gallery/creategallery.html?gallery=${encodeURIComponent(gallery.name)}&frameStyle=${encodeURIComponent(gallery.frameStyle || "gold")}`;
        window.location.href = url;
      });
      
      exploreGrid.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading explore galleries:", err);
    exploreGrid.innerHTML = "<p>Error loading galleries. Please try again later.</p>";
  }
}

document.querySelector('[data-tab="explore"]').addEventListener("click", loadExploreGalleries);

console.log("VRgallery.js initialized");
renderGalleries();

// Sample gallery for testing
if (getGalleries().length === 0) {
  console.log("No galleries found, adding a sample gallery");
  const sampleArtworks = [
    {
      title: "Sample Artwork 1",
      artist: "Artist Name",
      url: "../images/profileholder.png",
      width: 100,
      height: 150
    },
    {
      title: "Sample Artwork 2",
      artist: "Artist Name",
      url: "../images/profileholder.png", 
      width: 120,
      height: 180
    }
  ];
  
  const sampleGallery = {
    name: "Sample Gallery",
    size: "medium",
    frameStyle: "gold",
    artworks: sampleArtworks
  };
  
  const galleries = getGalleries();
  galleries.push(sampleGallery);
  saveGalleries(galleries);
  renderGalleries();
}