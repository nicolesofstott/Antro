document.addEventListener('DOMContentLoaded', function() {
  console.log("VR Gallery script initialized");
  
  window.VRGallery = {
    initialize: function() {
      console.log("VR Gallery initializing...");
      this.loadGalleryFromUrl();
    },
    
    loadGalleryFromUrl: function() {
      const urlParams = new URLSearchParams(window.location.search);
      const galleryId = urlParams.get('galleryId');
      const galleryName = urlParams.get('gallery');
      const frameStyle = urlParams.get('frameStyle') || 'gold';
      
      if (galleryId) {
        console.log(`Loading gallery with ID: ${galleryId} with ${frameStyle} frames`);
        setTimeout(() => {
          if (typeof window.loadGalleryById === 'function') {
            window.loadGalleryById(galleryId, frameStyle);
          } else if (typeof window.loadGallery === 'function') {
            window.loadGallery(galleryId, frameStyle);
          } else {
            console.error('Gallery loading functions not available');
          }
        }, 1000);
      } else if (galleryName) {
        console.log(`Loading gallery by name: ${galleryName} with ${frameStyle} frames`);
        setTimeout(() => {
          if (typeof window.loadGallery === 'function') {
            window.loadGallery(galleryName, frameStyle);
          } else {
            console.error('loadGallery function not available');
          }
        }, 1000);
      } else {
        console.error("Gallery ID or name is missing in URL");
        if (typeof window.showGalleryError === 'function') {
          window.showGalleryError("Gallery ID or name is missing in URL");
        }
      }
    }
  };
  
  initializeGalleryUI();
});

// Initialise the gallery UI components
function initializeGalleryUI() {
  console.log("Initializing Gallery UI");
  
  setupTabs();
  setupModalFunctionality();
  setupSearchFunctionality();
  
  loadGalleries();
}

// Set up tabs for gallery navigation
function setupTabs() {
  console.log("Setting up tabs...");
  
  let tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  console.log(`Found ${tabButtons.length} tab buttons and ${tabContents.length} tab contents`);
  
  tabButtons.forEach(button => {
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
  });
  
  tabButtons = document.querySelectorAll('.tab-button');
  
  // Add click handlers to the fresh buttons
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      console.log(`Tab clicked: ${this.textContent.trim()}, data-tab: ${tabId}`);
      
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
        console.log(`Removed active class from: ${btn.textContent.trim()}`);
      });
      
      tabContents.forEach(content => content.classList.remove('active'));
      
      this.classList.add('active');
      console.log(`Added active class to: ${this.textContent.trim()}`);
      
      // Find and activate the corresponding tab content
      const tabContent = document.getElementById(tabId);
      
      if (tabContent) {
        console.log(`Activating tab content: ${tabId}`);
        tabContent.classList.add('active');
 
        if (tabId === 'saved') {
          loadSavedGalleries();
        } else if (tabId === 'explore') {
          refreshExploreGalleries();
        }
      } else {
        console.error(`Tab content not found for id: ${tabId}`);
      }
    });
  });
  
  console.log("Tabs initialized successfully");
  
  // Ensure the initial active tab is correctly set
  const activeTab = document.querySelector('.tab-button.active');
  if (activeTab) {
    console.log(`Initial active tab: ${activeTab.textContent.trim()}`);
    const tabId = activeTab.getAttribute('data-tab');
    const tabContent = document.getElementById(tabId);
    
    if (tabContent) {
      tabContent.classList.add('active');
    }
  }
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

  createGalleryCard.addEventListener('click', function() {
    console.log("Opening create gallery modal");
    createGalleryModal.classList.remove('hidden');
    
    loadArtworkSelection();
  });
  
  // Close modal
  if (closeCreateModal) {
    closeCreateModal.addEventListener('click', function() {
      createGalleryModal.classList.add('hidden');
    });
  }
  
  // Create gallery 
  if (createBtn) {
    const newCreateBtn = createBtn.cloneNode(true);
    createBtn.parentNode.replaceChild(newCreateBtn, createBtn);
    
    newCreateBtn.addEventListener('click', function() {
      createNewGallery();
    });
  }
  
  // Artwork search functionality
  const artworkSearch = document.getElementById('artworkSearch');
  if (artworkSearch) {
    artworkSearch.addEventListener('input', function() {
      filterArtworks(this.value);
    });
  }
  
  console.log("Modal functionality initialized");
}

// Filter artworks 
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

// Search functionality for explore tab
function setupSearchFunctionality() {
  const exploreSearch = document.getElementById('exploreSearch');
  if (exploreSearch) {
    exploreSearch.addEventListener('input', function() {
      filterGalleries(this.value);
    });
  }
}

// Filter galleries 
function filterGalleries(searchTerm) {
  const galleryCards = document.querySelectorAll('#explore .gallery-card');
  
  if (!galleryCards.length) return;
  
  const searchLower = searchTerm.toLowerCase().trim();
  
  galleryCards.forEach(card => {
    const title = card.querySelector('.gallery-title')?.textContent?.toLowerCase() || '';
    const artist = card.querySelector('.gallery-info')?.textContent?.toLowerCase() || '';
    
    if (title.includes(searchLower) || artist.includes(searchLower) || searchLower === '') {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// Load galleries 
async function loadGalleries() {
  console.log("Loading galleries");
  
  const myGalleriesGrid = document.querySelector('#my-galleries .gallery-grid');
  const exploreGrid = document.querySelector('#explore .gallery-grid');
  
  if (!myGalleriesGrid) {
    console.error("My galleries grid not found!");
    return;
  }
  
  // Clear existing galleries except the create card
  const createCard = document.createElement('div');
  createCard.className = 'create-gallery-card';
  createCard.id = 'openCreateModal';
  createCard.innerHTML = '<span style="font-size: 3rem; color: var(--text-medium);">+</span>';
  
  myGalleriesGrid.innerHTML = '';
  myGalleriesGrid.appendChild(createCard);
  
  createCard.addEventListener('click', function() {
    const modal = document.getElementById('createGalleryModal');
    if (modal) {
      modal.classList.remove('hidden');
      loadArtworkSelection();
    }
  });
  
  // Try to get galleries from GalleryData module
  let galleries = [];
  try {
    if (typeof GalleryData !== 'undefined' && GalleryData.getGalleries) {
      galleries = await GalleryData.getGalleries();
      console.log(`Loaded ${galleries.length} galleries from API`);
    } else {
      const galleriesData = localStorage.getItem("userGalleries");
      galleries = galleriesData ? JSON.parse(galleriesData) : [];
      console.log(`Loaded ${galleries.length} galleries from localStorage`);
    }
  } catch (error) {
    console.error("Error loading galleries:", error);
    
    const galleriesData = localStorage.getItem("userGalleries");
    galleries = galleriesData ? JSON.parse(galleriesData) : [];
  }
  
  if (galleries.length > 0) {
    displayGalleries(galleries, myGalleriesGrid, 'my-galleries');
  } else {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'no-galleries';
    emptyMessage.textContent = 'No galleries found. Create your first gallery with the + button.';
    myGalleriesGrid.appendChild(emptyMessage);
  }
  
  if (exploreGrid) {
    refreshExploreGalleries();
  }
  
  console.log(`Completed loading ${galleries.length} galleries`);
}

// Refresh the explore galleries tab
async function refreshExploreGalleries() {
  const exploreGrid = document.querySelector('#explore .gallery-grid');
  if (!exploreGrid) return;
  
  exploreGrid.innerHTML = '<div class="loading">Loading galleries...</div>';
  
  try {
    let exploreGalleries = [];
    
    if (typeof GalleryData !== 'undefined' && GalleryData.getExploreGalleries) {
      exploreGalleries = await GalleryData.getExploreGalleries();
    } else {
      const galleriesData = localStorage.getItem("userGalleries");
      exploreGalleries = galleriesData ? JSON.parse(galleriesData) : [];
    }
    
    exploreGrid.innerHTML = '';
    
    if (exploreGalleries.length === 0) {
      exploreGrid.innerHTML = '<div class="no-galleries">No galleries found.</div>';
      return;
    }
    
    displayGalleries(exploreGalleries, exploreGrid, 'explore');
  } catch (error) {
    console.error("Error loading explore galleries:", error);
    exploreGrid.innerHTML = '<div class="error">Error loading galleries. Please try again.</div>';
  }
}

// Display galleries in the specified grid
async function displayGalleries(galleries, grid, tabType = 'explore') {
  if (!galleries || !galleries.length) {
    console.log(`No galleries to display for ${tabType}`);
    grid.innerHTML = grid.innerHTML || '<div class="no-galleries">No galleries found.</div>';
    return;
  }
  
  if (tabType === 'my-galleries') {
    const createCard = grid.querySelector('.create-gallery-card');
    grid.innerHTML = '';
    
    if (createCard) {
      grid.appendChild(createCard);
    }
  } else {
    grid.innerHTML = '';
  }

  // Get saved galleries list to check save status
  let savedGalleryIds = [];
  try {
    if (typeof GalleryData !== 'undefined' && GalleryData.getSavedGalleries) {
      const savedGalleries = await GalleryData.getSavedGalleries();
      savedGalleryIds = savedGalleries.map(g => g._id || g.id);
    } else {
      savedGalleryIds = JSON.parse(localStorage.getItem('savedGalleries') || '[]');
    }
  } catch (error) {
    console.error("Error getting saved galleries:", error);
    savedGalleryIds = JSON.parse(localStorage.getItem('savedGalleries') || '[]');
  }
  
  galleries.forEach(gallery => {
    const galleryId = gallery._id || gallery.id;
    if (!galleryId) {
      console.warn("Gallery has no ID, skipping:", gallery);
      return;
    }
    
    const galleryCard = document.createElement('div');
    galleryCard.className = 'gallery-card';
    galleryCard.dataset.id = galleryId;
    
    // Create thumbnail if gallery has artworks
    let thumbnailHtml = '';
    if (gallery.artworks && gallery.artworks.length > 0) {
      const firstArtwork = gallery.artworks[0];
      let imageUrl = firstArtwork.url || firstArtwork.mainImageUrl || '../images/profileholder.png';
      
      if (!imageUrl.startsWith('http') && !imageUrl.startsWith('../')) {
        imageUrl = `../images/${imageUrl}`;
      }
      
      thumbnailHtml = `<img src="${imageUrl}" alt="${gallery.name}" style="width: 100%; height: 70%; object-fit: cover;">`;
    } else {
      thumbnailHtml = `<img src="../images/profileholder.png" alt="${gallery.name}" style="width: 100%; height: 70%; object-fit: cover;">`;
    }
    
    // Add buttons based on tab type
    let buttonsHtml = '';
    
    // Add save button if in explore tab
    if (tabType === 'explore') {
      const isSaved = savedGalleryIds.includes(galleryId);
      const saveText = isSaved ? 'SAVED' : 'SAVE';
      const saveClass = isSaved ? 'saved' : '';
      buttonsHtml += `<button class="save-btn ${saveClass}" title="${isSaved ? 'Unsave' : 'Save'} gallery" data-id="${galleryId}">${saveText}</button>`;
    }
    
    // Add delete button if in my galleries tab
    if (tabType === 'my-galleries') {
      buttonsHtml += `<button class="delete-btn" title="Delete gallery" data-id="${galleryId}">&times;</button>`;
    }
    
    galleryCard.innerHTML = `
      ${thumbnailHtml}
      <div class="gallery-title">${gallery.name || 'Untitled Gallery'}</div>
      <div class="gallery-info">${gallery.artworks?.length || 0} artwork${gallery.artworks?.length !== 1 ? 's' : ''}</div>
      ${buttonsHtml}
    `;

    galleryCard.addEventListener('click', function(e) {
      if (e.target.classList.contains('save-btn') || e.target.classList.contains('delete-btn')) {
        e.stopPropagation();
        
        if (e.target.classList.contains('save-btn')) {
          toggleSaveGallery(galleryId, e.target);
        } else if (e.target.classList.contains('delete-btn')) {
          deleteGallery(galleryId);
        }
        return;
      }
      
      window.location.href = `creategallery.html?galleryId=${encodeURIComponent(galleryId)}&frameStyle=${encodeURIComponent(gallery.frameStyle || 'gold')}`;
    });
    
    grid.appendChild(galleryCard);
  });
  
  // Add event listeners for buttons
  document.querySelectorAll('.save-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleSaveGallery(this.dataset.id, this);
    });
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      deleteGallery(this.dataset.id);
    });
  });
}

// Delete a gallery
async function deleteGallery(galleryId) {
  if (!galleryId) {
    console.error("No gallery ID provided");
    return;
  }
  
  if (!confirm("Are you sure you want to delete this gallery? This cannot be undone.")) {
    return;
  }
  
  try {
    console.log(`Deleting gallery: ${galleryId}`);
    
    if (typeof GalleryData !== 'undefined' && GalleryData.deleteGallery) {
      await GalleryData.deleteGallery(galleryId);
      
      const galleryCard = document.querySelector(`.gallery-card[data-id="${galleryId}"]`);
      if (galleryCard) {
        galleryCard.remove();
      }
      
      alert("Gallery deleted successfully");
      
      loadGalleries();
    } else {
      const galleriesData = localStorage.getItem("userGalleries");
      if (galleriesData) {
        let galleries = JSON.parse(galleriesData);
        const initialCount = galleries.length;
        
        galleries = galleries.filter(gallery => {
          const id = gallery.id || gallery._id;
          return id !== galleryId;
        });
        
        if (galleries.length < initialCount) {
          localStorage.setItem("userGalleries", JSON.stringify(galleries));

          try {
            const savedData = localStorage.getItem("savedGalleries");
            if (savedData) {
              let saved = JSON.parse(savedData);
              saved = saved.filter(id => id !== galleryId);
              localStorage.setItem("savedGalleries", JSON.stringify(saved));
            }
          } catch (e) {
            console.error("Error updating saved galleries:", e);
          }
          
          alert("Gallery deleted successfully");
          loadGalleries();
        } else {
          alert("Gallery not found");
        }
      } else {
        alert("No galleries found");
      }
    }
  } catch (error) {
    console.error("Error deleting gallery:", error);
    alert(`Failed to delete gallery: ${error.message}`);
  }
}

// ToggleSaveGallery function 
async function toggleSaveGallery(galleryId, buttonElement) {
  if (!galleryId) {
    console.error("Gallery ID is missing");
    return;
  }
  
  try {
    const isSaved = buttonElement.classList.contains('saved');
    const action = isSaved ? 'unsave' : 'save';
    
    console.log(`${action} gallery ${galleryId}`);
    
    buttonElement.disabled = true;
    buttonElement.textContent = action === 'save' ? 'SAVING...' : 'UNSAVING...';
    
    if (typeof GalleryData !== 'undefined') {
      if (action === 'save') {
        await GalleryData.saveGallery(galleryId);
      } else {
        await GalleryData.unsaveGallery(galleryId);
      }
    } else {
      const savedGalleries = localStorage.getItem('savedGalleries') || '[]';
      const saved = JSON.parse(savedGalleries);
      
      if (action === 'save') {
        if (!saved.includes(galleryId)) {
          saved.push(galleryId);
        }
      } else {
        const index = saved.indexOf(galleryId);
        if (index > -1) {
          saved.splice(index, 1);
        }
      }
      
      localStorage.setItem('savedGalleries', JSON.stringify(saved));
    }

    // Update the button state and text
    buttonElement.classList.toggle('saved');
    const newIsSaved = buttonElement.classList.contains('saved');
    buttonElement.textContent = newIsSaved ? 'SAVED' : 'SAVE';
    buttonElement.title = newIsSaved ? 'Unsave gallery' : 'Save gallery';

    buttonElement.disabled = false;
    
    const savedTab = document.getElementById('saved');
    if (savedTab && savedTab.classList.contains('active')) {
      loadSavedGalleries();
    }
    
  } catch (error) {
    console.error(`Error ${buttonElement.classList.contains('saved') ? 'unsaving' : 'saving'} gallery:`, error);
    alert(`Error ${buttonElement.classList.contains('saved') ? 'unsaving' : 'saving'} gallery. Please try again.`);
    
    buttonElement.disabled = false;
    buttonElement.textContent = buttonElement.classList.contains('saved') ? 'SAVED' : 'SAVE';
  }
}

// Load saved galleries tab
async function loadSavedGalleries() {
  console.log("Loading saved galleries");
  
  const savedGrid = document.querySelector('#saved .gallery-grid');
  
  if (!savedGrid) {
    console.error("Saved galleries grid not found!");
    return;
  }
  
  // Clear existing galleries
  savedGrid.innerHTML = '<div class="loading">Loading saved galleries...</div>';
  
  try {
    let savedGalleries = [];
    
    if (typeof GalleryData !== 'undefined' && GalleryData.getSavedGalleries) {
      savedGalleries = await GalleryData.getSavedGalleries();
    } else {
      // Fallback for local testing
      const savedIds = JSON.parse(localStorage.getItem('savedGalleries') || '[]');
      const allGalleries = JSON.parse(localStorage.getItem('userGalleries') || '[]');
      savedGalleries = allGalleries.filter(g => savedIds.includes(g.id || g._id));
    }
    
    savedGrid.innerHTML = '';
    
    if (savedGalleries.length === 0) {
      savedGrid.innerHTML = '<div class="no-galleries">No saved galleries found.</div>';
      return;
    }
    
    // Display saved galleries
    displayGalleries(savedGalleries, savedGrid, 'saved');
    
  } catch (error) {
    console.error("Error loading saved galleries:", error);
    savedGrid.innerHTML = '<div class="error">Error loading saved galleries. Please try again.</div>';
  }
}

// Load artwork selection
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
    const token = localStorage.getItem('token');
    
    const response = await fetch('/api/artworks/mine', {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    
    if (response.ok) {
      userArtworks = await response.json();
      console.log("Artworks loaded from API:", userArtworks);
    } else {
      throw new Error(`Failed to fetch artworks: ${response.status}`);
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
        height: 80,
        dimensions: '120x80'
      },
      {
        id: 'mock2',
        title: 'Abstract Composition',
        artist: 'Artist Name',
        url: '../images/profileholder.png',
        width: 90,
        height: 120,
        dimensions: '90x120'
      },
      {
        id: 'mock3',
        title: 'Portrait Study',
        artist: 'Artist Name',
        url: '../images/profileholder.png',
        width: 80,
        height: 100,
        dimensions: '80x100'
      }
    ];
  }
  
  artworkGrid.innerHTML = '';
  
  if (userArtworks.length === 0) {
    artworkGrid.innerHTML = '<div class="no-artworks">No artworks found. Please add artworks to your profile first.</div>';
    return;
  }
  
  // Get current user info for artist name
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserName = currentUser.username || currentUser.displayName || currentUser.fullName || 'Unknown Artist';
  
  userArtworks.forEach(artwork => {
    const artworkItem = document.createElement('div');
    artworkItem.className = 'artwork-item';
    artworkItem.dataset.id = artwork.id || artwork._id;
    
    let artistName = 'Unknown Artist';
    
    if (artwork.user) {
      if (typeof artwork.user === 'object') {
        artistName = artwork.user.username || artwork.user.displayName || artwork.user.fullName || 'Unknown Artist';
      } else if (typeof artwork.user === 'string') {
        // If user is just an ID, use current user's name since it's their artwork
        artistName = currentUserName;
      }
    } else {
      artistName = currentUserName;
    }
    
    if (artistName === 'Unknown Artist' && artwork.artist) {
      artistName = artwork.artist;
    }
    
    // Get artwork title with fallback
    const artworkTitle = artwork.title || 'Untitled';
    
    let width = 100;
    let height = 100;
    let dimensionsText = '100x100cm';
    
    if (artwork.dimensions && typeof artwork.dimensions === 'string') {
      const dimensionMatch = artwork.dimensions.match(/^(\d+)x(\d+)$/);
      if (dimensionMatch) {
        width = parseInt(dimensionMatch[1], 10);
        height = parseInt(dimensionMatch[2], 10);
        dimensionsText = `${width}x${height}cm`;
      }
    } 
    else if (artwork.width && artwork.height) {
      width = parseInt(artwork.width, 10) || 100;
      height = parseInt(artwork.height, 10) || 100;
      dimensionsText = `${width}x${height}cm`;
    }
    
    let imageUrl = null;
    
    // Check all possible image URL fields
    if (artwork.mainImageUrl) {
      imageUrl = artwork.mainImageUrl;
    } else if (artwork.mainImage) {
      imageUrl = artwork.mainImage.startsWith('http') ? 
                artwork.mainImage : 
                `/${artwork.mainImage}`;
    } else if (artwork.url) {
      imageUrl = artwork.url;
    } else if (Array.isArray(artwork.extraImageUrls) && artwork.extraImageUrls.length > 0) {
      imageUrl = artwork.extraImageUrls[0];
    } else if (Array.isArray(artwork.extraImages) && artwork.extraImages.length > 0) {
      imageUrl = artwork.extraImages[0].startsWith('http') ? 
                artwork.extraImages[0] : 
                `/${artwork.extraImages[0]}`;
    }
    
    // Use placeholder if no valid image found
    if (!imageUrl) {
      imageUrl = '../images/profileholder.png';
      console.warn(`No image URL found for artwork: ${artworkTitle}`);
    }
    
    if (imageUrl.startsWith('uploads/')) {
      imageUrl = `/${imageUrl}`;
    }
    
    console.log(`Artwork: ${artworkTitle}, Artist: ${artistName}, Dimensions: ${dimensionsText}, Image: ${imageUrl}`);
    
    // Store all the artwork data as attributes
    artworkItem.dataset.title = artworkTitle;
    artworkItem.dataset.artist = artistName;
    artworkItem.dataset.width = width.toString();
    artworkItem.dataset.height = height.toString();
    artworkItem.dataset.dimensions = artwork.dimensions || `${width}x${height}`;
    artworkItem.dataset.imageUrl = imageUrl;
    
    artworkItem.innerHTML = `
      <img src="${imageUrl}" alt="${artworkTitle}" style="width: 100%; height: auto;">
      <div class="artwork-info" style="padding: 5px; font-size: 10px; text-align: center;">
        <div class="artwork-title" style="font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${artworkTitle}</div>
        <div class="artwork-artist" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${artistName}</div>
        <div class="artwork-dimensions" style="font-size: 8px; color: #666;">${dimensionsText}</div>
      </div>
    `;
    
    const img = artworkItem.querySelector('img');
    img.onerror = function() {
      console.warn(`Failed to load image: ${imageUrl}`);
      this.src = '../images/profileholder.png';
    };
    
    artworkItem.addEventListener('click', function() {
      this.classList.toggle('selected');
      console.log(`Artwork ${artworkTitle} ${this.classList.contains('selected') ? 'selected' : 'unselected'}`);
    });
    
    artworkGrid.appendChild(artworkItem);
  });
  
  console.log(`Loaded ${userArtworks.length} artworks for selection`);
}

// Create a new gallery with selected artworks
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
  
  const createBtn = document.getElementById('createBtn');
  if (createBtn) {
    createBtn.textContent = "Creating...";
    createBtn.disabled = true;
  }
  
  try {
    // Prepare selected artworks with proper data structure
    const selectedArtworks = Array.from(selectedArtworkElements).map(element => {
      const artworkData = {
        id: element.dataset.id,
        _id: element.dataset.id, // Ensure both id formats are available
        title: element.dataset.title || element.querySelector('.artwork-title')?.textContent || 'Untitled',
        artist: element.dataset.artist || element.querySelector('.artwork-artist')?.textContent || 'Unknown Artist',
        dimensions: element.dataset.dimensions || '100x100',
        width: parseInt(element.dataset.width) || 100,
        height: parseInt(element.dataset.height) || 100,
        url: element.dataset.imageUrl || element.querySelector('img')?.src || '../images/profileholder.png',
        mainImageUrl: element.dataset.imageUrl || element.querySelector('img')?.src || '../images/profileholder.png'
      };
      
      console.log('Extracted artwork data:', artworkData);
      return artworkData;
    });
    
    console.log(`Selected ${selectedArtworks.length} artworks for gallery with proper data`);
    
    // Prepare gallery data for backend with properly structured artworks
    const galleryData = {
      name: galleryName,
      description: `Gallery created with ${selectedArtworks.length} artworks`,
      size: roomSize,
      frameStyle: frameStyle,
      isPublic: true,
      artworks: selectedArtworks.map(artwork => {
        // Ensure each artwork has the necessary fields with proper data
        return {
          artworkId: artwork.id || artwork._id,
          title: artwork.title,
          artist: artwork.artist,
          url: artwork.url || artwork.mainImageUrl,
          width: artwork.width,
          height: artwork.height,
          dimensions: artwork.dimensions,
          position: {
            x: Math.random() * 4 - 2, 
            y: 1.5,
            z: -2
          },
          rotation: { x: 0, y: 0, z: 0 }
        };
      })
    };
    
    console.log("Gallery data prepared with proper artwork info:", galleryData);
    
    // Create gallery either by API or localStorage
    let createdGallery = null;
    
    try {
      const token = localStorage.getItem('token');
      const galleryResponse = await fetch('/api/galleries/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(galleryData)
      });
      
      if (galleryResponse.ok) {
        createdGallery = await galleryResponse.json();
        console.log(`Gallery "${galleryName}" created successfully via API:`, createdGallery);
      } else {
        const errorText = await galleryResponse.text();
        console.error(`API error: ${galleryResponse.status} - ${errorText}`);
        throw new Error(`Failed to create gallery: ${galleryResponse.status}`);
      }
    } catch (apiError) {
      console.error("API error creating gallery:", apiError);
      createdGallery = await createGalleryLocal(galleryData);
    }
    
    // If we have a created gallery (from either source), proceed
    if (createdGallery) {
      document.getElementById('createGalleryModal').classList.add('hidden');
      
      loadGalleries();
      
      if (confirm(`Gallery "${galleryName}" created successfully! Click OK to view it now.`)) {
        const galleryId = createdGallery._id || createdGallery.id;
        window.location.href = `creategallery.html?galleryId=${encodeURIComponent(galleryId)}&frameStyle=${encodeURIComponent(frameStyle)}`;
      }
    }
  } catch (error) {
    console.error("Error creating gallery:", error);
    alert(`An error occurred while creating the gallery: ${error.message}`);
  } finally {
    if (createBtn) {
      createBtn.textContent = "Create Gallery";
      createBtn.disabled = false;
    }
  }
  
  // Local gallery creation helper function
  async function createGalleryLocal(galleryData) {
    console.log("Creating gallery locally with proper data:", galleryData);
    
    try {
      const newGallery = {
        id: 'local_' + Date.now(),
        name: galleryData.name,
        description: galleryData.description,
        size: galleryData.size,
        frameStyle: galleryData.frameStyle,
        isPublic: galleryData.isPublic,
        artworks: galleryData.artworks, 
        createdAt: new Date().toISOString()
      };
      
      const galleries = localStorage.getItem("userGalleries");
      const parsedGalleries = galleries ? JSON.parse(galleries) : [];

      if (parsedGalleries.some(g => g.name === galleryData.name)) {
        alert(`Gallery "${galleryData.name}" already exists. Please choose a different name.`);
        return null;
      }
      
      parsedGalleries.push(newGallery);
      localStorage.setItem("userGalleries", JSON.stringify(parsedGalleries));
      
      console.log(`Gallery "${galleryData.name}" created locally with proper artwork data:`, newGallery);
      
      return newGallery;
    } catch (error) {
      console.error("Error creating gallery locally:", error);
      alert("An error occurred while creating the gallery locally. Please try again.");
      return null;
    }
  }
}

window.loadGalleries = loadGalleries;
window.loadArtworkSelection = loadArtworkSelection;
window.createNewGallery = createNewGallery;
window.loadSavedGalleries = loadSavedGalleries;
window.toggleSaveGallery = toggleSaveGallery;
window.refreshExploreGalleries = refreshExploreGalleries;
window.deleteGallery = deleteGallery;