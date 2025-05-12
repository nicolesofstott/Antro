document.addEventListener("DOMContentLoaded", function() {
    const profile = document.querySelector('.profile-section');
    const artGrid = document.getElementById('art-preview');
    
    if (profile && artGrid) {
      addVRGalleryButton();
      
      // Add VR Gallery links to each artwork
      addVRLinksToArtworks();
    }
    
    // Check if we're on the VR Gallery page
    const galleryTabs = document.getElementById('galleryTabs');
    if (galleryTabs) {
      initProfileArtworksConnection();
    }
  });
  
  // "Create VR Gallery" button
  function addVRGalleryButton() {
    const artTab = document.getElementById('artwork-tab');
    if (!artTab) return;
    
    if (document.getElementById('create-vr-gallery-btn')) return;
    
    const toggleBtn = document.getElementById('toggle-art-form');
    if (toggleBtn) {
      const vrButton = document.createElement('button');
      vrButton.id = 'create-vr-gallery-btn';
      vrButton.className = 'vr-gallery-btn';
      vrButton.textContent = '🖼️ Create VR Gallery with My Artworks';
      
      // Insert after the toggle button
      toggleBtn.parentNode.insertBefore(vrButton, toggleBtn.nextSibling);
      
      vrButton.addEventListener('click', function() {
        window.location.href = '../VRgallery/VRgallery.html';
      });
      
      document.head.appendChild(style);
    }
  }
  
  // Add to VR Gallery buttons
  function addVRLinksToArtworks() {
    // Wait for artworks to be loaded
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
          const artItems = document.querySelectorAll('.art-item');
          
          artItems.forEach(item => {

            if (item.querySelector('.add-to-vr-btn')) return;
            
            const vrButton = document.createElement('button');
            vrButton.className = 'add-to-vr-btn';
            vrButton.textContent = 'Add to VR Gallery';
            
            vrButton.addEventListener('click', function(e) {
              e.stopPropagation(); 
              
              // Get artwork info
              const title = item.dataset.title || 'Untitled';
              const dimensions = item.dataset.dimensions || '100x150';
              const description = item.dataset.description || '';

              const img = item.querySelector('img');
              const imgSrc = img ? img.src : '';
              
              // Store selected artwork in localStorage to use in VR Gallery
              storeArtworkForVR({
                title,
                artist: JSON.parse(localStorage.getItem('user') || '{}').displayName || 'Artist',
                dimensions,
                description,
                url: imgSrc,
                id: item.dataset.id
              });
              
              window.location.href = '../VRgallery/VRgallery.html';
            });
            
            item.appendChild(vrButton);
          });
        }
      });
    });
    
    const artPreview = document.getElementById('art-preview');
    if (artPreview) {
      observer.observe(artPreview, { childList: true });
    }
  }
  
  // Store artwork to be added to VR Gallery
  function storeArtworkForVR(artwork) {
    let pendingArtworks = JSON.parse(localStorage.getItem('pendingVRArtworks') || '[]');
    
    const exists = pendingArtworks.some(art => art.id === artwork.id);
    if (!exists) {
      pendingArtworks.push(artwork);
    }
    
    localStorage.setItem('pendingVRArtworks', JSON.stringify(pendingArtworks));
  }
  
  // Fetch profile artworks in the VR Gallery page
  function initProfileArtworksConnection() {
    const pendingArtworks = JSON.parse(localStorage.getItem('pendingVRArtworks') || '[]');
    
    if (pendingArtworks.length > 0) {
      console.log('Found pending artworks to add to VR Gallery:', pendingArtworks);
      
      const checkInterval = setInterval(() => {
        if (window.artworkLibrary) {
          clearInterval(checkInterval);
          
          // Open the create gallery modal
          document.querySelector('.gallery-card.create-new').click();
          
          pendingArtworks.forEach(art => {
            const index = window.artworkLibrary.findIndex(a => a.url === art.url);
            if (index !== -1 && !selectedArtworks.includes(index)) {
              selectedArtworks.push(index);
            }
          });

          renderArtworkGrid();
          
          localStorage.removeItem('pendingVRArtworks');
        }
      }, 500);
    }
  }
  
  // Connect to backend for artwork fetching on VR Gallery page
  if (window.location.href.includes('VRgallery.html')) {
    window.originalFetchUserArtworks = window.fetchUserArtworks;
    
    window.fetchUserArtworks = async function() {
      try {
        const userArtworks = await window.originalFetchUserArtworks();
        
        if (userArtworks && userArtworks.length > 0) {
          return userArtworks;
        }
        
        return [
          {
            _id: 'sample1',
            title: 'Sample Artwork',
            artist: 'You',
            url: '../images/profileholder.png',
            width: 100,
            height: 150
          }
        ];
      } catch (err) {
        console.error('Error in enhanced fetchUserArtworks:', err);
        return [];
      }
    };
  }