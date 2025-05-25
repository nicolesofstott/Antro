// Example artists
document.addEventListener('DOMContentLoaded', function() {
  const featuredArtists = [
    {
      name: 'Sophia Rodriguez',
      specialty: 'Digital Sculptor',
      image: '../images/artist1.jpg'
    },
    {
      name: 'Marcus Chen',
      specialty: 'Mixed Media',
      image: '../images/artist2.jpg'
    },
    {
      name: 'Aisha Johnson',
      specialty: 'Abstract Photographer',
      image: '../images/artist3.jpg'
    },
    {
      name: 'Leo Kowalski',
      specialty: 'Virtual Reality',
      image: '../images/artist4.jpg'
    }
  ];
  
  populateFeaturedArtists(featuredArtists);
  enhanceSearchExperience();
});

// Populate featured artists section
function populateFeaturedArtists(artists) {
  const container = document.getElementById('featured-artists');
  
  if (!container || !artists || artists.length === 0) {
    return;
  }
  
  container.innerHTML = '';
  
  const accentClasses = ['accent-pink', 'accent-blue', 'accent-orange', 'accent-plum'];
  
  artists.forEach((artist, index) => {
    const card = document.createElement('div');
    card.className = `artist-card ${accentClasses[index % accentClasses.length]}`;
    
    const imageSrc = artist.image || '../images/placeholder.png';
    
    card.innerHTML = `
      <img src="${imageSrc}" alt="${artist.name}" onerror="this.src='../images/placeholder.png'">
      <div class="artist-card-content">
        <h3>${artist.name}</h3>
        <p>${artist.specialty}</p>
      </div>
    `;
    
    container.appendChild(card);
    
    card.addEventListener('click', function() {
      console.log(`Viewed artist: ${artist.name}`);
    });
  });
}

// Function to enhance search experience
function enhanceSearchExperience() {
  const searchBox = document.getElementById('searchBox');
  const clearButton = document.querySelector('.search-clear-btn');
  const searchResults = document.getElementById('searchResults');
  
  if (!searchBox || !clearButton) {
    return;
  }
  
  let searchTimeout;
  
  searchBox.addEventListener('input', function() {
    const query = this.value.trim();
    
    if (query.length > 0) {
      clearButton.style.display = 'block';
      
      // Clear previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      // Debounce search - wait 300ms after user stops typing
      searchTimeout = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      clearButton.style.display = 'none';
      hideSearchResults();
    }
  });
  
  // Clear button state
  if (searchBox.value.length === 0) {
    clearButton.style.display = 'none';
  }
  
  clearButton.addEventListener('click', function() {
    searchBox.value = '';
    searchBox.focus();
    this.style.display = 'none';
    hideSearchResults();
  });
  
  // Add focus and blur events to search box
  searchBox.addEventListener('focus', function() {
    this.parentElement.classList.add('search-focused');
  });
  
  searchBox.addEventListener('blur', function() {
    setTimeout(() => {
      this.parentElement.classList.remove('search-focused');
    }, 200);
  });
  
  // Hide results when clicking outside
  document.addEventListener('click', function(e) {
    if (!searchBox.contains(e.target) && !searchResults.contains(e.target)) {
      setTimeout(() => {
        hideSearchResults();
      }, 100);
    }
  });
}

// Function to perform search
async function performSearch(query) {
  const searchResults = document.getElementById('searchResults');
  
  if (!searchResults || !query) return;
  
  try {
    showSearchLoading();
    
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    hideSearchLoading();
    
    displaySearchResults(data, query);
    
  } catch (error) {
    console.error('Search error:', error);
    hideSearchLoading();
    showSearchError();
  }
}

// Function to show search loading state
function showSearchLoading() {
  const searchLoading = document.querySelector('.search-loading');
  const searchResults = document.getElementById('searchResults');
  
  if (searchLoading) {
    searchLoading.style.display = 'block';
  }
  
  if (searchResults) {
    searchResults.style.display = 'block';
    searchResults.innerHTML = '<div class="search-loading-text" style="padding: 20px; text-align: center; color: #777;">Searching...</div>';
  }
}

// Hide search loading state
function hideSearchLoading() {
  const searchLoading = document.querySelector('.search-loading');
  
  if (searchLoading) {
    searchLoading.style.display = 'none';
  }
}

// Display search results
function displaySearchResults(data, query) {
  const searchResults = document.getElementById('searchResults');
  
  if (!searchResults) return;
  
  const { profiles = [], artworks = [], galleries = [] } = data;
  const totalResults = profiles.length + artworks.length + galleries.length;
  
  if (totalResults === 0) {
    searchResults.innerHTML = `
      <div class="search-no-results">
        <p>No results found for "${query}"</p>
        <p style="font-size: 0.9rem; color: #999;">Try searching for artists, artworks, or galleries</p>
      </div>
    `;
    searchResults.style.display = 'block';
    return;
  }
  
  let resultsHtml = '';
  
  // Add profile results
  if (profiles.length > 0) {
    profiles.forEach(profile => {
      const displayName = profile.displayName || profile.fullName || profile.username;
      const firstLetter = displayName.charAt(0).toUpperCase();
      const artistBadge = profile.isArtist ? '<span class="badge orange">Artist</span>' : '';
      const avatarClass = profile.isArtist ? 'profile-avatar artist' : 'profile-avatar';
      
      resultsHtml += `
        <div class="search-result-item" onclick="viewProfile('${profile._id}')">
          <div class="${avatarClass}">${firstLetter}</div>
          <div class="result-content">
            <div class="result-title">
              ${displayName}
              ${artistBadge}
            </div>
            <div class="result-category">Profile • <span class="username">@${profile.username}</span></div>
          </div>
        </div>
      `;
    });
  }
  
  // Add artwork results
  if (artworks.length > 0) {
    artworks.forEach(artwork => {
      const artistName = artwork.user ? artwork.user.username : 'Unknown Artist';
      const imageUrl = artwork.mainImage || '/uploads/artworks/default-artwork.png';
      
      resultsHtml += `
        <div class="search-result-item result-artwork" onclick="viewArtwork('${artwork._id}')">
          <img src="${imageUrl}" alt="${artwork.title}" onerror="this.src='/uploads/artworks/default-artwork.png'">
          <div class="result-content">
            <div class="result-title">${artwork.title}</div>
            <div class="result-category">Artwork • by <span class="username">${artistName}</span></div>
          </div>
        </div>
      `;
    });
  }
  
  // Add gallery results
  if (galleries.length > 0) {
    galleries.forEach(gallery => {
      const ownerName = gallery.user ? (gallery.user.displayName || gallery.user.username) : 'Unknown';
      const artworkCount = gallery.artworkCount || 0;
      const firstLetter = gallery.name.charAt(0).toUpperCase();
      
      resultsHtml += `
        <div class="search-result-item gallery-result" onclick="viewGallery('${gallery._id}')">
          <div class="profile-avatar" style="background-color: var(--accent-4); color: var(--text-on-plum);">${firstLetter}</div>
          <div class="result-content">
            <div class="result-title">${gallery.name}</div>
            <div class="result-category">VR Gallery • ${artworkCount} artworks • by <span class="username">${ownerName}</span></div>
          </div>
        </div>
      `;
    });
  }
  
  searchResults.innerHTML = resultsHtml;
  searchResults.style.display = 'block';
}

// Hide search results
function hideSearchResults() {
  const searchResults = document.getElementById('searchResults');
  if (searchResults) {
    searchResults.style.display = 'none';
    searchResults.innerHTML = '';
  }
}

// Search error
function showSearchError() {
  const searchResults = document.getElementById('searchResults');
  if (searchResults) {
    searchResults.innerHTML = `
      <div class="search-no-results">
        <p>Something went wrong</p>
        <p style="font-size: 0.9rem; color: #999;">Please try again</p>
      </div>
    `;
    searchResults.style.display = 'block';
  }
}

function viewProfile(profileId) {
  window.location.href = `/profile/${profileId}`;
}

function viewArtwork(artworkId) {
  window.location.href = `/artwork/${artworkId}`;
}

function viewGallery(galleryId) {
  window.location.href = `/gallery/${galleryId}`;
}