document.addEventListener('DOMContentLoaded', function() {
  console.log("Gallery loader script initialized");
  
  // Check URL parameters for gallery info
  const urlParams = new URLSearchParams(window.location.search);
  const galleryName = urlParams.get('gallery');
  const frameStyle = urlParams.get('frameStyle') || 'gold';
  
  if (galleryName) {
    console.log(`Loading gallery: ${galleryName} with ${frameStyle} frames`);
    setTimeout(() => loadGallery(galleryName, frameStyle), 2000);
  }
  
  setTimeout(setupBackButton, 1000);
  setTimeout(cleanupUnwantedElements, 2000);
});

async function loadGallery(galleryName, frameStyle) {
  console.log(`Loading gallery: ${galleryName} with ${frameStyle} frames`);
  
  // Hide all placeholders initially
  const allPlaceholders = document.querySelectorAll('a-image');
  allPlaceholders.forEach(placeholder => {
    placeholder.setAttribute('visible', 'false');
  });

  let gallery = null;
  
  try {
    if (typeof GalleryData !== 'undefined' && GalleryData.getGallery) {
      try {
        gallery = await GalleryData.getGallery(galleryName);
        console.log(`Gallery "${galleryName}" loaded from user database`);
      } catch (error) {
        console.warn(`Error getting gallery from user database: ${error.message}`);
        throw error;
      }
    } else {
      throw new Error("GalleryData module not available");
    }
  } catch (error) {
    console.warn(`Falling back to localStorage: ${error.message}`);
    
    // Try localStorage as fallback
    try {
      const galleries = localStorage.getItem("userGalleries");
      if (galleries) {
        const parsedGalleries = JSON.parse(galleries);
        gallery = parsedGalleries.find(g => g.name === galleryName);
        if (gallery) {
          console.log(`Gallery "${galleryName}" loaded from localStorage`);
        }
      }
    } catch (storageError) {
      console.error(`LocalStorage error: ${storageError.message}`);
    }
    
    // If still no gallery, create a mock one
    if (!gallery) {
      console.warn(`No gallery found for "${galleryName}", creating mock gallery`);
      gallery = createMockGallery(galleryName, frameStyle);
    }
  }
  
  if (!gallery) {
    console.error(`Gallery not found: ${galleryName}`);
    showGalleryError(`Gallery "${galleryName}" not found`);
    return;
  }
  
  console.log("Gallery data:", gallery);
  
  if (!gallery.artworks) {
    gallery.artworks = [];
  }
  
  // Mock artworks if none are present
  if (gallery.artworks.length === 0) {
    console.warn("Gallery has no artworks, adding mock artworks");
    gallery.artworks = getMockArtworks(4);
  }
  
  console.log("Artworks to load:", gallery.artworks);
  
  // Room size and frame style
  const roomSize = gallery.size || 'medium';

  try {
    const scale = window.resizeRoom(roomSize);
    console.log(`Room resized with scale factor ${scale}`);
  } catch (error) {
    console.error("Error resizing room:", error);
  }
  
  // Position camera
  try {
    window.positionCamera(roomSize);
  } catch (error) {
    console.error("Error positioning camera:", error);
  }
  
  // Calculate artwork positions
  let wallPositions;
  try {
    if (window.calculateWallPositions) {
      wallPositions = window.calculateWallPositions(gallery.artworks, roomSize);
    } else {
      wallPositions = window.calculateOptimalPositions(gallery.artworks, roomSize);
    }
    console.log("Wall positions calculated:", wallPositions);
  } catch (error) {
    console.error("Error calculating wall positions:", error);
    showGalleryError("Error setting up gallery layout");
    return;
  }
  
  // Create a map to track used positions to prevent overlaps
  const usedPositions = new Map();
  
  let artworkIndex = 0;
  const placedArtworks = [];

  try {
    if (typeof window.assignArtworksToWalls === 'function') {
      const assignments = window.assignArtworksToWalls(gallery.artworks, wallPositions, allPlaceholders);
      
      // Display all artworks
      assignments.forEach(assignment => {
        window.displayArtwork(assignment, gallery.frameStyle || frameStyle);
        placedArtworks.push(assignment.artwork);
      });
    } else {

      const initialPlacements = gallery.artworks.map((artwork, index) => ({
        artwork,
        placeholder: index < allPlaceholders.length ? allPlaceholders[index] : null,
        originalIndex: index
      }));
      
      const validPlacements = initialPlacements.filter(p => p.placeholder);
      
      const redistributedPlacements = window.redistributeArtworksToWalls(validPlacements, wallPositions, allPlaceholders);
      
      redistributedPlacements.forEach((placement, index) => {
        const { artwork, placeholder } = placement;
        
        if (!artwork || !artwork.url) {
          console.warn(`Artwork is missing or has no URL`);
          return;
        }
        
        if (!placeholder) {
          console.warn(`No placeholder available for artwork ${index + 1}`);
          return;
        }
        
        const position = placeholder.getAttribute('position');
        if (!position) {
          console.warn(`Placeholder has no position attribute`);
          return;
        }
        
        // Create a unique position key to check for overlaps
        const positionKey = `${position.x.toFixed(2)},${position.y.toFixed(2)},${position.z.toFixed(2)}`;
        
        // Check position and adjust if necessary
        if (usedPositions.has(positionKey)) {
          console.warn(`Position ${positionKey} already used! Finding alternative position...`);
          
          let foundAlternative = false;
          
          for (let i = 0; i < allPlaceholders.length; i++) {
            const altPlaceholder = allPlaceholders[i];
            if (altPlaceholder.getAttribute('visible') === 'true') continue; // Skip already used placeholders
            
            const altPosition = altPlaceholder.getAttribute('position');
            if (!altPosition) continue;
            
            const altPositionKey = `${altPosition.x.toFixed(2)},${altPosition.y.toFixed(2)},${altPosition.z.toFixed(2)}`;
            
            if (!usedPositions.has(altPositionKey)) {
              console.log(`Found alternative position ${altPositionKey} for artwork ${index + 1}`);
              
              const originalRotation = placeholder.getAttribute('rotation');
              altPlaceholder.setAttribute('rotation', originalRotation);
              
              placement.placeholder = altPlaceholder;
              usedPositions.set(altPositionKey, true);
              foundAlternative = true;
              break;
            }
          }
          
          if (!foundAlternative) {
            const newPosition = {
              x: position.x + 0.3,
              y: position.y,
              z: position.z + 0.3
            };
            
            placeholder.setAttribute('position', newPosition);
            const newPositionKey = `${newPosition.x.toFixed(2)},${newPosition.y.toFixed(2)},${newPosition.z.toFixed(2)}`;
            usedPositions.set(newPositionKey, true);
            console.log(`Adjusted position for artwork ${index + 1} to avoid overlap: ${JSON.stringify(newPosition)}`);
          }
        } else {
          usedPositions.set(positionKey, true);
        }
        
        // Make placeholder visible
        placement.placeholder.setAttribute('visible', 'true');
        
        let imageUrl = artwork.url;
        
        if (!imageUrl || imageUrl === 'placeholder.png') {
          imageUrl = '../images/profileholder.png';
        }
        else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('../')) {
          imageUrl = `../images/${imageUrl}`;
        }
        
        console.log(`Setting artwork: ${artwork.title} with image URL: ${imageUrl}`);
        
        // Determine which wall this artwork is on
        const rotation = placement.placeholder.getAttribute('rotation');
        let wall = 'back';
        if (rotation) {
          const yRot = typeof rotation === 'object' ? rotation.y : 
                     (rotation.split(' ').length > 1 ? parseFloat(rotation.split(' ')[1]) : 0);
          
          if (Math.abs(yRot - 90) < 10) {
            wall = 'left';
          } else if (Math.abs(yRot + 90) < 10) {
            wall = 'right';
          } else if (Math.abs(Math.abs(yRot) - 180) < 10) {
            wall = 'front';
          }
        }
        
        const dimensions = window.scaleArtwork(placement.placeholder, artwork, wall);
        
        // Set the image source
        placement.placeholder.setAttribute('src', imageUrl);

        placement.placeholder.addEventListener('error', function(e) {
          console.error(`Failed to load image: ${imageUrl}`, e);
          this.setAttribute('src', '../images/profileholder.png');
        });
        
        window.addFrameToArtwork(placement.placeholder, frameStyle, dimensions, artwork);
        
        window.addArtworkLabel(placement.placeholder, artwork, dimensions);
        
        placedArtworks.push(artwork);
      });
    }
  } catch (error) {
    console.error("Error displaying artworks:", error);
    showGalleryError(`Error displaying gallery artworks: ${error.message}`);
  }
  
  console.log(`Successfully placed ${placedArtworks.length} artworks in the gallery`);
  
  setTimeout(() => {
    console.log("Gallery loading completed successfully");
  }, 1000);
}

// Display error message in the gallery
function showGalleryError(message) {
  const scene = document.querySelector('a-scene');
  
  if (scene) {
    const errorText = document.createElement('a-text');
    errorText.setAttribute('value', message);
    errorText.setAttribute('color', '#ff3333');
    errorText.setAttribute('position', '0 1.7 -2');
    errorText.setAttribute('width', 4);
    errorText.setAttribute('align', 'center');
    
    scene.appendChild(errorText);
  }
  
  console.error(`Gallery error: ${message}`);
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'gallery-error';
  errorDiv.textContent = message;
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '50%';
  errorDiv.style.left = '50%';
  errorDiv.style.transform = 'translate(-50%, -50%)';
  errorDiv.style.background = 'rgba(255, 51, 51, 0.9)';
  errorDiv.style.color = 'white';
  errorDiv.style.padding = '15px 20px';
  errorDiv.style.borderRadius = '5px';
  errorDiv.style.zIndex = '1000';
  
  document.body.appendChild(errorDiv);
  
  setTimeout(() => {
    document.body.removeChild(errorDiv);
  }, 5000);
}

// Create a mock gallery for testing
function createMockGallery(name, frameStyle) {
  return {
    name: name,
    size: 'medium',
    frameStyle: frameStyle || 'gold',
    artworks: getMockArtworks(4),
    createdAt: new Date().toISOString()
  };
}

// Function to generate mock artworks
function getMockArtworks(count = 4) {
  const mockArtworks = [
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
    },
    {
      id: 'mock4',
      title: 'Urban Landscape',
      artist: 'Artist Name',
      url: '../images/profileholder.png',
      width: 110,
      height: 70
    }
  ];
  
  return mockArtworks.slice(0, count);
}

/// Function to clean up unwanted elements
function cleanupUnwantedElements() {
  const threeElements = document.querySelectorAll('a-entity[three-object]');
  threeElements.forEach(element => {
    if (element.getAttribute('three-object') === 'undefined') {
      console.log("Removing problematic three-object element");
      element.parentNode.removeChild(element);
    }
  });
}

// Function to set up the back button
function setupBackButton() {
  const backButton = document.getElementById('backButton');
  if (backButton) {
    backButton.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
    
    console.log('Back button initialized');
  }
}

// Set up VR Gallery object
const VRGallery = {
  initialize: function() {
    console.log("VRGallery initializing...");
    const urlParams = new URLSearchParams(window.location.search);
    const galleryName = urlParams.get('gallery');
    const frameStyle = urlParams.get('frameStyle') || 'gold';

    if (galleryName) {
      loadGallery(galleryName, frameStyle);
    } else {
      showGalleryError('Gallery name is missing in URL');
    }
  }
};

window.VRGallery = VRGallery;
window.loadGallery = loadGallery;
window.showGalleryError = showGalleryError;
window.createMockGallery = createMockGallery;
window.getMockArtworks = getMockArtworks;
window.cleanupUnwantedElements = cleanupUnwantedElements;
window.setupBackButton = setupBackButton;