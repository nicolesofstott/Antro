document.addEventListener('DOMContentLoaded', function() {
  console.log("VR Gallery script initialized");
  
  // Initialize main VR Gallery object first
  window.VRGallery = {
    initialize: function() {
      console.log("VR Gallery initializing...");
      this.loadGalleryFromUrl();
    },
    
    loadGalleryFromUrl: function() {
      const urlParams = new URLSearchParams(window.location.search);
      const galleryName = urlParams.get('gallery');
      const frameStyle = urlParams.get('frameStyle') || 'gold';
      
      if (galleryName) {
        console.log(`Loading gallery: ${galleryName} with ${frameStyle} frames`);
        setTimeout(() => loadGallery(galleryName, frameStyle), 1000);
      }
    }
  };
  
  initializeGalleryUI();
  
  applyFixes();
});

// Initialize the Gallery UI
function initializeGalleryUI() {
  console.log("Initializing Gallery UI");
  
  loadGalleries();
  
  setupTabs();
  
  setupModalFunctionality();
}

//Set up tabs for gallery navigation
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      this.classList.add('active');
      
      const tabId = this.getAttribute('data-tab');
      const tabContent = document.getElementById(tabId);
      if (tabContent) {
        tabContent.classList.add('active');
      }
    });
  });
  
  console.log("Tabs initialized");
}

// Set up modal popup functionality
function setupModalFunctionality() {
  const createGalleryCard = document.getElementById('openCreateModal');
  const createGalleryModal = document.getElementById('createGalleryModal');
  const closeCreateModal = document.getElementById('closeCreateModal');
  const createBtn = document.getElementById('createBtn');
  
  if (!createGalleryCard || !createGalleryModal) {
    console.error("Modal elements not found!");
    return;
  }
  
  // Open modal when clicking create card
  createGalleryCard.addEventListener('click', function() {
    console.log("Opening create gallery modal");
    createGalleryModal.classList.remove('hidden');
    
    loadArtworkSelection();
  });
  
  // Close modal when clicking X
  if (closeCreateModal) {
    closeCreateModal.addEventListener('click', function() {
      createGalleryModal.classList.add('hidden');
    });
  }
  
  // Create gallery when clicking create button
  if (createBtn) {
    createBtn.addEventListener('click', function() {
      createNewGallery();
    });
  }
  
  // Set up artwork search functionality
  const artworkSearch = document.getElementById('artworkSearch');
  if (artworkSearch) {
    artworkSearch.addEventListener('input', function() {
      filterArtworks(this.value);
    });
  }
  
  console.log("Modal functionality initialized");
}

// Filter artworks based on search input
function filterArtworks(searchTerm) {
  const artworkItems = document.querySelectorAll('#artworkSelection .artwork-item');
  
  if (!artworkItems.length) return;
  
  const searchLower = searchTerm.toLowerCase().trim();
  
  artworkItems.forEach(item => {
    const title = item.querySelector('.artwork-title')?.textContent?.toLowerCase() || '';
    const artist = item.querySelector('.artwork-artist')?.textContent?.toLowerCase() || '';
    
    if (title.includes(searchLower) || artist.includes(searchLower) || searchLower === '') {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

// Load user's existing galleries and display them
async function loadGalleries() {
  console.log("Loading galleries");
  
  // Get gallery grids
  const myGalleriesGrid = document.querySelector('#my-galleries .gallery-grid');
  const exploreGrid = document.querySelector('#explore .gallery-grid');
  const savedGrid = document.querySelector('#saved .gallery-grid');
  
  if (!myGalleriesGrid) {
    console.error("Gallery grid not found!");
    return;
  }
  
  // Clear existing galleries except the create card
  const createCard = myGalleriesGrid.querySelector('.create-gallery-card');
  myGalleriesGrid.innerHTML = '';
  
  if (createCard) {
    myGalleriesGrid.appendChild(createCard);
  } else {
    const newCreateCard = document.createElement('div');
    newCreateCard.className = 'create-gallery-card';
    newCreateCard.id = 'openCreateModal';
    newCreateCard.innerHTML = '<span style="font-size: 3rem; color: var(--text-medium);">+</span>';
    myGalleriesGrid.appendChild(newCreateCard);
    
    newCreateCard.addEventListener('click', function() {
      document.getElementById('createGalleryModal').classList.remove('hidden');
      loadArtworkSelection();
    });
  }
  
  // Try to get galleries from GalleryData module
  let galleries = [];
  try {
    if (typeof GalleryData !== 'undefined' && GalleryData.getGalleries) {
      galleries = await GalleryData.getGalleries();
    } else {
      const galleriesData = localStorage.getItem("userGalleries");
      galleries = galleriesData ? JSON.parse(galleriesData) : [];
    }
  } catch (error) {
    console.error("Error loading galleries:", error);
    
    const galleriesData = localStorage.getItem("userGalleries");
    galleries = galleriesData ? JSON.parse(galleriesData) : [];
  }
  
  // If no galleries, create sample gallery
  if (galleries.length === 0) {
    if (typeof GalleryData !== 'undefined' && GalleryData.createSampleGallery) {
      await GalleryData.createSampleGallery();
      
      try {
        galleries = await GalleryData.getGalleries();
      } catch (error) {
        console.error("Error loading galleries after sample creation:", error);
      }
    } else {
      console.warn("GalleryData not available, cannot create sample gallery");
    }
  }
  
  displayGalleries(galleries, myGalleriesGrid);
  
  console.log(`Loaded ${galleries.length} galleries`);
}

// Display galleries in the specified grid
function displayGalleries(galleries, grid) {
  if (!galleries || !galleries.length) {
    console.log("No galleries to display");
    return;
  }
  
  galleries.forEach(gallery => {
    const galleryCard = document.createElement('div');
    galleryCard.className = 'gallery-card';
    
    // Create thumbnail if gallery has artworks
    let thumbnailHtml = '';
    if (gallery.artworks && gallery.artworks.length > 0) {
      const firstArtwork = gallery.artworks[0];
      let imageUrl = firstArtwork.url || firstArtwork.mainImageUrl || '../images/profileholder.png';
      
      if (!imageUrl.startsWith('http') && !imageUrl.startsWith('../')) {
        imageUrl = `../images/${imageUrl}`;
      }
      
      thumbnailHtml = `<img src="${imageUrl}" alt="${gallery.name}" style="width: 100%; height: 70%; object-fit: cover;">`;
    }
    
    galleryCard.innerHTML = `
      ${thumbnailHtml}
      <div class="gallery-title">${gallery.name}</div>
      <div class="gallery-info">${gallery.artworks?.length || 0} artwork${gallery.artworks?.length !== 1 ? 's' : ''}</div>
    `;

    galleryCard.addEventListener('click', function() {
      window.location.href = `creategallery.html?gallery=${encodeURIComponent(gallery.name)}&frameStyle=${encodeURIComponent(gallery.frameStyle || 'gold')}`;
    });
    
    grid.appendChild(galleryCard);
  });
}

// Load artwork selection for the create gallery modal
async function loadArtworkSelection() {
  const artworkGrid = document.getElementById('artworkSelection');
  
  if (!artworkGrid) {
    console.error("Artwork selection grid not found!");
    return;
  }
  
  artworkGrid.innerHTML = '<div class="loading">Loading your artworks...</div>';
  
  // Get user artworks from backend
  let userArtworks = [];
  
  try {
    if (typeof GalleryData !== 'undefined' && GalleryData.getUserArtworks) {
      userArtworks = await GalleryData.getUserArtworks();
    } else {
      throw new Error("GalleryData not available");
    }
  } catch (error) {
    console.error("Error loading artworks:", error);
    
    // Fallback to mock artworks
    userArtworks = [
      {
        id: 'mock1',
        title: 'Sunset Landscape',
        artist: 'Artist Name',
        url: '../images/profileholder.png',
        width: 120,
        height: 80
      },
      {
        id: 'mock2',
        title: 'Abstract Composition',
        artist: 'Artist Name',
        url: '../images/profileholder.png',
        width: 90,
        height: 120
      },
      {
        id: 'mock3',
        title: 'Portrait Study',
        artist: 'Artist Name',
        url: '../images/profileholder.png',
        width: 80,
        height: 100
      }
    ];
  }
  
  artworkGrid.innerHTML = '';
  
  // Display artworks
  if (userArtworks.length === 0) {
    artworkGrid.innerHTML = '<div class="no-artworks">No artworks found. Please add artworks to your profile first.</div>';
    return;
  }
  
  userArtworks.forEach(artwork => {
    const artworkItem = document.createElement('div');
    artworkItem.className = 'artwork-item';
    artworkItem.dataset.id = artwork.id || artwork._id;
    
    let imageUrl = artwork.url || artwork.mainImageUrl;
    
    if (!imageUrl || imageUrl === 'placeholder.png') {
      imageUrl = '../images/profileholder.png';
    }
    else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('../')) {
      imageUrl = `../images/${imageUrl}`;
    }
    
    artworkItem.innerHTML = `
      <img src="${imageUrl}" alt="${artwork.title || 'Untitled'}" style="width: 100%; height: auto;">
      <div class="artwork-info" style="padding: 5px; font-size: 10px; text-align: center;">
        <div class="artwork-title" style="font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${artwork.title || 'Untitled'}</div>
        <div class="artwork-artist" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${artwork.artist || 'Unknown Artist'}</div>
      </div>
    `;
    
    artworkItem.addEventListener('click', function() {
      this.classList.toggle('selected');
      console.log(`Artwork ${artwork.title} ${this.classList.contains('selected') ? 'selected' : 'unselected'}`);
    });
    
    artworkGrid.appendChild(artworkItem);
  });
  
  console.log(`Loaded ${userArtworks.length} artworks for selection`);
}

// Create a new gallery from modal form
async function createNewGallery() {
  const galleryName = document.getElementById('galleryName').value;
  const roomSize = document.getElementById('roomSize').value;
  const frameStyle = document.getElementById('frameStyle').value;
  
  if (!galleryName) {
    alert('Please enter a gallery name');
    return;
  }
  
  const selectedArtworkElements = document.querySelectorAll('#artworkSelection .artwork-item.selected');
  
  if (selectedArtworkElements.length === 0) {
    alert('Please select at least one artwork');
    return;
  }
  
  const selectedArtworkIds = Array.from(selectedArtworkElements).map(el => el.dataset.id);
  
  const createBtn = document.getElementById('createBtn');
  if (createBtn) {
    createBtn.textContent = "Creating...";
    createBtn.disabled = true;
  }
  
  try {
    if (typeof GalleryData !== 'undefined' && GalleryData.getUserArtworks && GalleryData.createGallery) {
      const allArtworks = await GalleryData.getUserArtworks();
      
      // Filter selected artworks
      const selectedArtworks = allArtworks.filter(artwork => 
        selectedArtworkIds.includes(artwork.id || artwork._id)
      );
      
      // Prepare gallery data for backend
      if (selectedArtworkIds.some(id => id.startsWith('mock'))) {
        await createGalleryLocal(selectedArtworks);
      } else {
        const galleryData = {
          name: galleryName,
          size: roomSize,
          frameStyle: frameStyle,
          artworks: selectedArtworks
        };
        
        await GalleryData.createGallery(galleryData);
        
        console.log(`Gallery "${galleryName}" created with ${selectedArtworks.length} artworks`);
        
        document.getElementById('createGalleryModal').classList.add('hidden');
        
        loadGalleries();
        
        if (confirm(`Gallery "${galleryName}" created successfully! Click OK to view it now.`)) {
          window.location.href = `creategallery.html?gallery=${encodeURIComponent(galleryName)}&frameStyle=${encodeURIComponent(frameStyle)}`;
        }
      }
    } else {
      await createGalleryLocal();
    }
  } catch (error) {
    console.error("Error creating gallery:", error);
    alert(`An error occurred while creating the gallery: ${error.message}`);
    
    await createGalleryLocal();
  } finally {
    if (createBtn) {
      createBtn.textContent = "Create Gallery";
      createBtn.disabled = false;
    }
  }
  
  // Local gallery creation helper function
  async function createGalleryLocal(selectedArtworks) {
    try {
      if (!selectedArtworks) {
        let allArtworks = [];
        
        if (typeof GalleryData !== 'undefined' && GalleryData.getUserArtworks) {
          allArtworks = await GalleryData.getUserArtworks();
        } else {
          // Fallback mock artworks
          allArtworks = [
            {
              id: 'mock1',
              title: 'Sunset Landscape',
              artist: 'Artist Name',
              url: '../images/profileholder.png',
              width: 120,
              height: 80
            },
            {
              id: 'mock2',
              title: 'Abstract Composition',
              artist: 'Artist Name',
              url: '../images/profileholder.png',
              width: 90,
              height: 120
            },
            {
              id: 'mock3',
              title: 'Portrait Study',
              artist: 'Artist Name',
              url: '../images/profileholder.png',
              width: 80,
              height: 100
            }
          ];
        }
        
        // Filter selected artworks
        selectedArtworks = allArtworks.filter(artwork => {
          const id = artwork.id || artwork._id;
          return selectedArtworkIds.includes(id);
        });
      }
      
      // Create gallery object
      const newGallery = {
        name: galleryName,
        size: roomSize,
        frameStyle: frameStyle,
        artworks: selectedArtworks,
        createdAt: new Date().toISOString()
      };
      
      const galleries = localStorage.getItem("userGalleries");
      const parsedGalleries = galleries ? JSON.parse(galleries) : [];

      if (parsedGalleries.some(g => g.name === galleryName)) {
        alert(`Gallery "${galleryName}" already exists. Please choose a different name.`);
        return;
      }
      
      parsedGalleries.push(newGallery);
      
      localStorage.setItem("userGalleries", JSON.stringify(parsedGalleries));
      
      console.log(`Gallery "${galleryName}" created locally with ${selectedArtworks.length} artworks`);
      
      document.getElementById('createGalleryModal').classList.add('hidden');
      
      loadGalleries();
      
      if (confirm(`Gallery "${galleryName}" created successfully! Click OK to view it now.`)) {
        window.location.href = `creategallery.html?gallery=${encodeURIComponent(galleryName)}&frameStyle=${encodeURIComponent(frameStyle)}`;
      }
    } catch (error) {
      console.error("Error creating gallery locally:", error);
      alert("An error occurred while creating the gallery. Please try again.");
    }
  }
}

// Make sure our functions are available globally
window.setupBackButton = setupBackButton;
window.loadGalleries = loadGalleries;
window.loadArtworkSelection = loadArtworkSelection;
window.createNewGallery = createNewGallery;

// Back button functionality for VR gallery
function setupBackButton() {
  const backButton = document.getElementById('backButton');
  if (backButton) {
    backButton.addEventListener('click', () => {
      window.location.href = 'VRgallery.html';
    });
    
    console.log('Back button initialized');
  }
}