const searchBox = document.getElementById('searchBox');
const searchResults = document.getElementById('searchResults');
const searchClearBtn = document.querySelector('.search-clear-btn');
const searchLoading = document.querySelector('.search-loading');
const artworkModal = document.getElementById('artwork-modal');
const modalLoading = document.querySelector('.modal-loading');
const artworkDetails = document.querySelector('.artwork-details');
const closeModalBtn = document.querySelector('.close-modal');

let timeout = null;
let lastQuery = '';
let cachedResults = {};

const API_BASE_URL = 'http://localhost:5050'; 

document.addEventListener('DOMContentLoaded', () => {
  initializeModalListeners();
});

// Search input event listener
searchBox.addEventListener('input', () => {
  clearTimeout(timeout);
  
  const query = searchBox.value.trim();
  
  // Clear button
  searchClearBtn.style.display = query.length > 0 ? 'block' : 'none';
  
  // Close results if empty
  if (query.length === 0) {
    searchResults.innerHTML = '';
    searchResults.style.display = 'none';
    searchLoading.style.display = 'none';
    return;
  }
  
  // Show loading indicator for searches
  if (query.length >= 2) {
    searchLoading.style.display = 'block';
  }

  if (cachedResults[query]) {
    displayResults(cachedResults[query]);
    searchLoading.style.display = 'none';
    return;
  }

  timeout = setTimeout(() => {
    performSearch(query);
  }, 300); 
});

// Clear search function
searchClearBtn.addEventListener('click', () => {
  searchBox.value = '';
  searchResults.innerHTML = '';
  searchResults.style.display = 'none';
  searchClearBtn.style.display = 'none';
  searchBox.focus();
});

// Perform the actual search
async function performSearch(query) {
  if (query.length < 2) {
    searchLoading.style.display = 'none';
    searchResults.innerHTML = '';
    searchResults.style.display = 'none';
    return;
  }
  
  lastQuery = query;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Search results:', data);

    cachedResults[query] = data;
    
    // Display the results
    displayResults(data);
  } catch (error) {
    console.error("Error fetching search results:", error);
    searchResults.innerHTML = `
      <div class="error-message">
        <p>Error connecting to search service</p>
        <button class="retry-button">Retry</button>
      </div>
    `;
    searchResults.style.display = 'block';
    
    // Retry functionality
    document.querySelector('.retry-button')?.addEventListener('click', () => {
      performSearch(query);
    });
  } finally {
    searchLoading.style.display = 'none';
  }
}

// Display search results
function displayResults(data) {
  // Handle empty results
  if (data.profiles.length === 0 && data.artworks.length === 0 && data.galleries.length === 0) {
    searchResults.innerHTML = '<div class="no-results">No matches found</div>';
    searchResults.style.display = 'block';
    return;
  }

  let html = '';
  
  // Add section headers if there are results
  if (data.profiles.length > 0) {
    html += '<div class="result-section-header">Artists</div>';
    
    // Sort profiles 
    const artistProfiles = data.profiles.filter(profile => profile.isArtist);
    const regularProfiles = data.profiles.filter(profile => !profile.isArtist);
    
    // First artist profiles
    artistProfiles.forEach(profile => {
      const displayName = profile.fullName || profile.username;
      const profileId = profile._id;
      
      // Render artist profile
      html += `
        <div class="result-item artist-profile" data-type="profile" data-id="${profileId}">
          <a href="/profile/${profileId}" class="profile-link">
            <img src="${profile.profilePic ? `${API_BASE_URL}/uploads/${profileId}/profiles/${profile.profilePic}` : `${API_BASE_URL}/uploads/profiles/default-profile.png`}" 
                alt="Profile" class="thumb"
                onerror="this.src='${API_BASE_URL}/uploads/profiles/default-profile.png'">
            <div class="result-details">
              <div class="result-title">${displayName}</div>
              <div class="result-subtitle">@${profile.username}</div>
              <div class="result-badge artist-badge">Artist</div>
            </div>
          </a>
        </div>
      `;
    });
    
    // Then show regular profiles
    if (regularProfiles.length > 0) {
      if (artistProfiles.length > 0) {
        html += '<div class="result-section-header">Other Users</div>';
      }
      
      regularProfiles.forEach(profile => {
        const displayName = profile.fullName || profile.username;
        const profileId = profile._id;
        
        html += `
          <div class="result-item" data-type="profile" data-id="${profileId}">
            <a href="/profile/${profileId}" class="profile-link">
              <img src="${profile.profilePic ? `${API_BASE_URL}/uploads/${profileId}/profiles/${profile.profilePic}` : `${API_BASE_URL}/uploads/profiles/default-profile.png`}" 
                  alt="Profile" class="thumb"
                  onerror="this.src='${API_BASE_URL}/uploads/profiles/default-profile.png'">
              <div class="result-details">
                <div class="result-title">${displayName}</div>
                <div class="result-subtitle">@${profile.username}</div>
              </div>
            </a>
          </div>
        `;
      });
    }
  }
  
  //  VR galleries search results
  if (data.galleries && data.galleries.length > 0) {
    html += '<div class="result-section-header">VR Galleries</div>';
    
    data.galleries.forEach(gallery => {
      const galleryId = gallery._id;
      const galleryName = gallery.name;
      const artistName = gallery.user ? (gallery.user.displayName || gallery.user.username) : 'Unknown Artist';
      
      const previewUrl = gallery.previewImageUrl || `${API_BASE_URL}/uploads/profiles/default-profile.png`;
      
      html += `
        <div class="result-item gallery-item" data-type="gallery" data-id="${galleryId}">
          <div class="gallery-preview" data-id="${galleryId}">
            <img src="${previewUrl}" 
                 alt="Gallery" class="thumb"
                 onerror="this.src='${API_BASE_URL}/uploads/profiles/default-profile.png'">
            <div class="result-details">
              <div class="result-title">${galleryName}</div>
              <div class="result-subtitle">by ${artistName}</div>
              <div class="result-subtitle">${gallery.artworkCount || 0} artworks</div>
            </div>
          </div>
        </div>
      `;
    });
  }
  
  if (data.artworks.length > 0) {
    html += '<div class="result-section-header">Artworks</div>';
  
    data.artworks.forEach(artwork => {
      if (!artwork.user || !artwork.user._id) {
        console.error('Artwork missing user data:', artwork);
        return; 
      }
      
      // Artwork title
      const title = artwork.title || 'Untitled';
      const userId = artwork.user._id;
      const artworkId = artwork._id;

      // MainImage path 
      let mainImageUrl;
      if (artwork.mainImageUrl) {
        mainImageUrl = artwork.mainImageUrl;
      } else if (artwork.mainImage) {
        if (artwork.mainImage.startsWith('http')) {
          mainImageUrl = artwork.mainImage;
        } else if (artwork.mainImage.includes('/')) {
          mainImageUrl = `${API_BASE_URL}/${artwork.mainImage}`;
        } else {
          mainImageUrl = `${API_BASE_URL}/uploads/${userId}/artworks/${artwork.mainImage}`;
        }
      } else {
        mainImageUrl = `${API_BASE_URL}/uploads/artworks/default-artwork.png`;
      }
  
      html += `
        <div class="result-item artwork-item" data-type="artwork" data-userid="${userId}" data-artworkid="${artworkId}">
          <div class="artwork-preview" data-id="${artworkId}">
            <img src="${mainImageUrl}" 
                 alt="Artwork" class="thumb"
                 onerror="this.src='${API_BASE_URL}/uploads/artworks/default-artwork.png'">
            <div class="result-details">
              <div class="result-title">${title}</div>
              <div class="result-subtitle">${artwork.user.username ? 'by ' + artwork.user.username : ''}</div>
            </div>
          </div>
        </div>
      `;
    });
  }

  searchResults.innerHTML = html;
  searchResults.style.display = 'block';
  
  addResultEventListeners();
}

// Gallery clicks
function addResultEventListeners() {
  // Profile 
  document.querySelectorAll('.result-item[data-type="profile"]').forEach(item => {
    item.addEventListener('click', (event) => {
      if (event.target.tagName !== 'A' && !event.target.closest('a')) {
        const id = item.getAttribute('data-id');
        window.location.href = `/profile/${id}`;
      }
    });
  });
  
  // Gallery
  document.querySelectorAll('.gallery-preview').forEach(item => {
    if (item.closest('.result-item[data-type="gallery"]')) {
      item.addEventListener('click', (event) => {
        const galleryId = item.getAttribute('data-id');
        window.location.href = `../Create gallery/creategallery.html?id=${galleryId}`;

        event.preventDefault();
        event.stopPropagation();
      });
    }
  });
  
  // Artwork 
  document.querySelectorAll('.artwork-preview').forEach(item => {
    if (item.closest('.result-item[data-type="artwork"]')) {
      item.addEventListener('click', (event) => {
        const artworkId = item.getAttribute('data-id');
        openArtworkModal(artworkId);
        event.preventDefault();
        event.stopPropagation();
      });
    }
  });
}

// Artwork modal listeners
function initializeModalListeners() {
  closeModalBtn.addEventListener('click', () => {
    artworkModal.style.display = 'none';
  });
  
  artworkModal.addEventListener('click', (event) => {
    if (event.target === artworkModal) {
      artworkModal.style.display = 'none';
    }
  });
  
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      artworkModal.style.display = 'none';
    }
  });
}

// Open the artwork modal and load artwork details
async function openArtworkModal(artworkId) {
  artworkDetails.innerHTML = '';
  modalLoading.style.display = 'block';
  artworkModal.style.display = 'block';
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/artworks/${artworkId}`);
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const artwork = await response.json();
    
    let content = `
      <h2>${artwork.title || 'Untitled'}</h2>
      <div class="artwork-image-container">
        <img src="${artwork.mainImageUrl}" alt="${artwork.title || 'Artwork'}" class="artwork-main-image">
      </div>
      <div class="artwork-info">
        <p class="artwork-artist">Artist: <a href="/profile/${artwork.user._id}">${artwork.user.username}</a></p>
        <p class="artwork-dimensions">Dimensions: ${artwork.dimensions || 'Not specified'}</p>
        <div class="artwork-description">
          <h3>Description</h3>
          <p>${artwork.description || 'No description available.'}</p>
        </div>
      </div>
    `;
    
    if (artwork.extraImageUrls && artwork.extraImageUrls.length > 0) {
      content += '<div class="artwork-extra-images"><h3>Additional Images</h3><div class="image-gallery">';
      
      artwork.extraImageUrls.forEach(url => {
        content += `<img src="${url}" alt="Additional view" class="gallery-thumbnail">`;
      });
      
      content += '</div></div>';
    }
    
    artworkDetails.innerHTML = content;
    
    // Click events
    document.querySelectorAll('.gallery-thumbnail').forEach(thumb => {
      thumb.addEventListener('click', (event) => {
        const mainImage = document.querySelector('.artwork-main-image');
        mainImage.src = event.target.src;
      });
    });
    
  } catch (error) {
    console.error("Error fetching artwork details:", error);
    artworkDetails.innerHTML = `
      <div class="error-message">
        <p>Error loading artwork details</p>
        <button class="retry-button" data-id="${artworkId}">Retry</button>
      </div>
    `;
    
    const retryBtn = document.querySelector('.retry-button');
    if (retryBtn) {
      retryBtn.addEventListener('click', (event) => {
        const id = event.target.getAttribute('data-id');
        openArtworkModal(id);
      });
    }
  } finally {
    modalLoading.style.display = 'none';
  }
}

document.addEventListener('click', (event) => {
  if (!searchBox.contains(event.target) && !searchResults.contains(event.target)) {
    searchResults.style.display = 'none';
  }
});