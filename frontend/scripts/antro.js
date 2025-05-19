document.addEventListener('DOMContentLoaded', function() {
  // Sample data for featured artists - this would normally come from backend
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

// Function to populate featured artists section
function populateFeaturedArtists(artists) {
  const container = document.getElementById('featured-artists');
  
  if (!container || !artists || artists.length === 0) {
    return;
  }
  
  container.innerHTML = '';
  
  const accentClasses = ['accent-pink', 'accent-blue', 'accent-orange', 'accent-plum'];
  
  // Add artist cards to container
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
    
    // Add click event to view artist profile
    card.addEventListener('click', function() {
      console.log(`Viewed artist: ${artist.name}`);
    });
  });
}

// Function to enhance search experience
function enhanceSearchExperience() {
  const searchBox = document.getElementById('searchBox');
  const clearButton = document.querySelector('.search-clear-btn');
  
  if (!searchBox || !clearButton) {
    return;
  }
  
  searchBox.addEventListener('input', function() {
    if (this.value.length > 0) {
      clearButton.style.display = 'block';
    } else {
      clearButton.style.display = 'none';
    }
  });
  
  if (searchBox.value.length === 0) {
    clearButton.style.display = 'none';
  }
  
  clearButton.addEventListener('click', function() {
    searchBox.value = '';
    searchBox.focus();
    this.style.display = 'none';
    
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
      searchResults.innerHTML = '';
      searchResults.style.display = 'none';
    }
  });
  
  // Add visual feedback on search focus
  searchBox.addEventListener('focus', function() {
    this.parentElement.classList.add('search-focused');
  });
  
  searchBox.addEventListener('blur', function() {
    this.parentElement.classList.remove('search-focused');
  });
}