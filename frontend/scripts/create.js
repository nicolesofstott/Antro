document.addEventListener('DOMContentLoaded', function() {
  console.log("Gallery loader script initialized");
  
  // Check URL parameters for gallery info
  const urlParams = new URLSearchParams(window.location.search);
  const galleryId = urlParams.get('galleryId');
  const galleryName = urlParams.get('gallery');
  const frameStyle = urlParams.get('frameStyle') || 'gold';
  
  if (galleryId) {
    console.log(`Loading gallery by ID: ${galleryId} with ${frameStyle} frames`);
    setTimeout(() => loadGalleryById(galleryId, frameStyle), 500);
  } else if (galleryName) {
    console.log(`Loading gallery by name: ${galleryName} with ${frameStyle} frames`);
    setTimeout(() => loadGallery(galleryName, frameStyle), 500);
  } else {
    console.error("Gallery ID or name is missing in URL");
    showGalleryError("Gallery ID or name is missing in URL");
  }
  
  setTimeout(setupBackButton, 500);
  setTimeout(cleanupUnwantedElements, 1000);
});

// New function to load gallery by ID
async function loadGalleryById(galleryId, frameStyle) {
  console.log(`Loading gallery with ID: ${galleryId} with ${frameStyle} frames`);
  
  const allPlaceholders = document.querySelectorAll('a-image');
  allPlaceholders.forEach(placeholder => {
    placeholder.setAttribute('visible', 'false');
  });

  let gallery = null;
  
  // Check if GalleryData module is available
  try {
    if (typeof window.GalleryData !== 'undefined') {
      try {
        console.log(`Attempting to load gallery with ID "${galleryId}" using GalleryData`);
        
        if (galleryId.startsWith('local_')) {
          const galleries = localStorage.getItem("userGalleries");
          if (galleries) {
            const parsedGalleries = JSON.parse(galleries);
            gallery = parsedGalleries.find(g => (g.id === galleryId || g._id === galleryId));
            
            if (gallery) {
              console.log(`Gallery with ID "${galleryId}" found in localStorage`);
            }
          }
        } 
        
        if (!gallery) {
          if (typeof window.GalleryData.getGalleryById === 'function') {
            gallery = await window.GalleryData.getGalleryById(galleryId);
          } else {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/galleries/${galleryId}`, {
              method: 'GET',
              headers: {
                'Authorization': token ? `Bearer ${token}` : ''
              }
            });
            
            if (response.ok) {
              gallery = await response.json();
            }
          }
          console.log(`Gallery with ID "${galleryId}" loaded:`, gallery);
        }
      } catch (error) {
        console.warn(`Error getting gallery by ID: ${error.message}`);
        throw error;
      }
    } else {
      throw new Error("GalleryData module not available");
    }
  } catch (error) {
    console.warn(`Falling back to localStorage: ${error.message}`);
    
    // Try localStorage as fallback with ID matching
    try {
      console.log("Trying to load gallery from localStorage");
      const galleries = localStorage.getItem("userGalleries");
      if (galleries) {
        const parsedGalleries = JSON.parse(galleries);
        gallery = parsedGalleries.find(g => {
          const id = g.id || g._id;
          return id === galleryId;
        });
        
        if (gallery) {
          console.log(`Gallery with ID "${galleryId}" loaded from localStorage`);
        } else {
          console.warn(`No gallery matching ID "${galleryId}" found in localStorage`);
        }
      } else {
        console.warn("No user galleries found in localStorage");
      }
    } catch (storageError) {
      console.error(`LocalStorage error: ${storageError.message}`);
    }
    
    // If still no gallery, create a mock one
    if (!gallery) {
      console.warn(`No gallery found for ID "${galleryId}", creating mock gallery`);
      gallery = createMockGallery(`Gallery ${galleryId}`, frameStyle);
    }
  }
  
  if (!gallery) {
    console.error(`Gallery not found with ID: ${galleryId}`);
    showGalleryError(`Gallery with ID "${galleryId}" not found`);
    return;
  }

  displayGallery(gallery, frameStyle, allPlaceholders);
}

// Function to load gallery by name
async function loadGallery(galleryName, frameStyle) {
  console.log(`Loading gallery by name: ${galleryName} with ${frameStyle} frames`);
  
  const allPlaceholders = document.querySelectorAll('a-image');
  allPlaceholders.forEach(placeholder => {
    placeholder.setAttribute('visible', 'false');
  });

  let gallery = null;
  
  // Check if GalleryData module is available
  try {
    if (typeof window.GalleryData !== 'undefined') {
      try {
        console.log(`Attempting to load gallery "${galleryName}" using GalleryData.getGallery`);
        gallery = await window.GalleryData.getGallery(galleryName);
        console.log(`Gallery "${galleryName}" loaded:`, gallery);
      } catch (error) {
        console.warn(`Error getting gallery: ${error.message}`);
        throw error;
      }
    } else {
      throw new Error("GalleryData module not available");
    }
  } catch (error) {
    console.warn(`Falling back to localStorage: ${error.message}`);
    
    // Try localStorage as fallback with case-insensitive matching
    try {
      console.log("Trying to load gallery from localStorage");
      const galleries = localStorage.getItem("userGalleries");
      if (galleries) {
        const parsedGalleries = JSON.parse(galleries);
        gallery = parsedGalleries.find(g => 
          g.name.toLowerCase() === galleryName.toLowerCase()
        );
        
        if (gallery) {
          console.log(`Gallery "${gallery.name}" loaded from localStorage`);
        } else {
          console.warn(`No gallery matching "${galleryName}" found in localStorage`);
        }
      } else {
        console.warn("No user galleries found in localStorage");
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
  
  displayGallery(gallery, frameStyle, allPlaceholders);
}

// Display the gallery after loading
function displayGallery(gallery, frameStyle, allPlaceholders) {
  console.log("Gallery data:", gallery);
  
  if (!gallery.artworks) {
    gallery.artworks = [];
  }
  
  // Mock artworks if none are present
  if (gallery.artworks.length === 0) {
    console.warn("Gallery has no artworks, adding mock artworks");
    gallery.artworks = getMockArtworks(4);
  }
  
  console.log("Original artwork data:", gallery.artworks);

  // Normalise artwork data to ensure URL field is available 
  gallery.artworks = gallery.artworks.map(artwork => {
    const normalizedArtwork = { ...artwork };
    
    // Set URL field if it doesn't exist but other image URL fields do
    if (!normalizedArtwork.url) {
      // Check various possible field names for image URLs
      if (normalizedArtwork.mainImageUrl) {
        normalizedArtwork.url = normalizedArtwork.mainImageUrl;
        console.log(`Artwork ${normalizedArtwork.title}: Using mainImageUrl as url`);
      } else if (normalizedArtwork.mainImage) {
        normalizedArtwork.url = normalizedArtwork.mainImage;
        console.log(`Artwork ${normalizedArtwork.title}: Using mainImage as url`);
      } else if (normalizedArtwork.imageUrl) {
        normalizedArtwork.url = normalizedArtwork.imageUrl;
        console.log(`Artwork ${normalizedArtwork.title}: Using imageUrl as url`);
      } else if (Array.isArray(normalizedArtwork.extraImageUrls) && normalizedArtwork.extraImageUrls.length > 0) {
        normalizedArtwork.url = normalizedArtwork.extraImageUrls[0];
        console.log(`Artwork ${normalizedArtwork.title}: Using first extraImageUrl as url`);
      } else if (Array.isArray(normalizedArtwork.extraImages) && normalizedArtwork.extraImages.length > 0) {
        normalizedArtwork.url = normalizedArtwork.extraImages[0];
        console.log(`Artwork ${normalizedArtwork.title}: Using first extraImage as url`);
      }
    }
    
    return normalizedArtwork;
  });

  console.log("Normalised artwork data with URL mapping:", gallery.artworks);
  
  // Room size and frame style
  const roomSize = gallery.size || 'medium';

  try {
    if (typeof window.resizeRoom === 'function') {
      const scale = window.resizeRoom(roomSize);
      console.log(`Room resized with scale factor ${scale}`);
    } else {
      console.error("resizeRoom function not found");
      const scene = document.querySelector('a-scene');
      const walls = scene.querySelectorAll('a-plane');
      
      walls.forEach(wall => {
        wall.setAttribute('width', roomSize === 'small' ? 3 : 
                               roomSize === 'large' ? 7 : 5);
      });
    }
  } catch (error) {
    console.error("Error resizing room:", error);
    showGalleryError("Error resizing gallery room");
  }
  
  // Position camera
  try {
    if (typeof window.positionCamera === 'function') {
      window.positionCamera(roomSize);
    } else {
      console.warn("positionCamera function not found, using fallback");
      const cameraRig = document.getElementById('cameraRig');
      if (cameraRig) {
        const height = 0.5;
        cameraRig.setAttribute('position', {x: 0, y: height, z: 0});
      }
    }
  } catch (error) {
    console.error("Error positioning camera:", error);
  }

  // Calculate artwork positions
  let wallPositions;
  try {
    if (typeof window.calculateWallPositions === 'function') {
      wallPositions = window.calculateWallPositions(gallery.artworks, roomSize);
    } else if (typeof window.calculateOptimalPositions === 'function') {
      wallPositions = window.calculateOptimalPositions(gallery.artworks, roomSize);
    } else {
      console.warn("No wall position calculator found, using basic positions");
      wallPositions = [
        { name: 'back', positions: [[0, 1.5, -3.4]] },
        { name: 'left', positions: [[-3.4, 1.5, 0]] },
        { name: 'right', positions: [[3.4, 1.5, 0]] },
        { name: 'front', positions: [[0, 1.5, 3.4]] }
      ];
    }
    console.log("Wall positions calculated:", wallPositions);
  } catch (error) {
    console.error("Error calculating wall positions:", error);
    showGalleryError("Error calculating artwork positions");
    return;
  }

  // Map placeholders to wall positions
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
      
      let redistributedPlacements;
      
      if (typeof window.redistributeArtworksToWalls === 'function') {
        redistributedPlacements = window.redistributeArtworksToWalls(validPlacements, wallPositions, allPlaceholders);
      } else {
        console.warn("redistributeArtworksToWalls function not found, using basic mapping");
        redistributedPlacements = validPlacements;
        
        // Basic mapping to wall positions
        redistributedPlacements.forEach((placement, index) => {
          const wallIndex = index % wallPositions.length;
          const positionIndex = Math.floor(index / wallPositions.length) % 
                               (wallPositions[wallIndex].positions.length || 1);
                               
          if (wallPositions[wallIndex].positions.length > 0) {
            const position = wallPositions[wallIndex].positions[
              positionIndex % wallPositions[wallIndex].positions.length
            ];
            
            if (position && placement.placeholder) {
              placement.placeholder.setAttribute('position', {
                x: position[0], 
                y: position[1], 
                z: position[2]
              });
              
              // Set rotation based on wall
              let rotation = { x: 0, y: 0, z: 0 };
              switch(wallIndex) {
                case 0: 
                  rotation = { x: 0, y: 0, z: 0 };
                  break;
                case 1: 
                  rotation = { x: 0, y: 90, z: 0 };
                  break;
                case 2: 
                  rotation = { x: 0, y: -90, z: 0 };
                  break;
                case 3: 
                  rotation = { x: 0, y: 180, z: 0 };
                  break;
              }
              
              placement.placeholder.setAttribute('rotation', rotation);
            }
          }
        });
      }
      
      redistributedPlacements.forEach((placement, index) => {
        const { artwork, placeholder } = placement;
        
        if (!artwork) {
          console.warn(`Artwork is missing for placement #${index}`);
          return;
        }
        
        // Ensure artwork has a URL
        if (!artwork.url) {
          console.warn(`Artwork has no URL: ${JSON.stringify(artwork)}`);
          const possibleImageProps = ['mainImageUrl', 'mainImage', 'imageUrl', 'extraImageUrls', 'extraImages'];
          for (const prop of possibleImageProps) {
            if (artwork[prop]) {
              if (Array.isArray(artwork[prop]) && artwork[prop].length > 0) {
                artwork.url = artwork[prop][0];
                console.log(`Found image URL in ${prop} array for artwork ${artwork.title || 'untitled'}`);
                break;
              } else if (typeof artwork[prop] === 'string') {
                artwork.url = artwork[prop];
                console.log(`Found image URL in ${prop} for artwork ${artwork.title || 'untitled'}`);
                break;
              }
            }
          }
          
          // If still no URL, use placeholder
          if (!artwork.url) {
            artwork.url = '../images/profileholder.png';
            console.warn(`Using placeholder image for artwork: ${artwork.title || 'untitled'}`);
          }
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
            if (altPlaceholder.getAttribute('visible') === 'true') continue; 
            
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
        
        placeholder.setAttribute('visible', 'true');
        
        let imageUrl = artwork.url;
        
        if (!imageUrl || imageUrl === 'placeholder.png') {
          imageUrl = '../images/profileholder.png';
          console.warn(`Using fallback image for artwork: ${artwork.title || 'untitled'}`);
        }
        else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('../')) {
          if (imageUrl.startsWith('uploads/')) {
            imageUrl = `../${imageUrl}`;
            console.log(`Adjusted relative path for image URL: ${imageUrl}`);
          } else {
            imageUrl = `../images/${imageUrl}`;
            console.log(`Added ../images/ prefix to image URL: ${imageUrl}`);
          }
        }
        
        console.log(`Setting artwork: ${artwork.title || 'untitled'} with image URL: ${imageUrl}`);
        
        // Determine which wall this artwork is on based on rotation
        const rotation = placeholder.getAttribute('rotation');
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
        
        // Set the image source
        placeholder.setAttribute('src', imageUrl);

        placeholder.addEventListener('error', function(e) {
          console.error(`Failed to load image: ${imageUrl}`, e);
          this.setAttribute('src', '../images/profileholder.png');
        });
        
        // Scale artwork and add frame if functions available
        let dimensions = { width: 1.2, height: 1.2 }; 
        
        if (typeof window.scaleArtwork === 'function') {
          dimensions = window.scaleArtwork(placeholder, artwork, wall);
        } else {
          console.warn("scaleArtwork function not found, using default dimensions");
          placeholder.setAttribute('width', dimensions.width);
          placeholder.setAttribute('height', dimensions.height);
        }
        
        if (typeof window.addFrameToArtwork === 'function') {
          window.addFrameToArtwork(placeholder, frameStyle, dimensions, artwork);
        } else {
          console.warn("addFrameToArtwork function not found, skipping frame");
        }
        
        if (typeof window.addArtworkLabel === 'function') {
          window.addArtworkLabel(placeholder, artwork, dimensions);
        } else {
          console.warn("addArtworkLabel function not found, skipping label");
          // Basic label fallback
          const label = document.createElement('a-text');
          label.setAttribute('value', artwork.title || 'Untitled');
          label.setAttribute('align', 'center');
          label.setAttribute('position', {
            x: position.x,
            y: position.y - (dimensions.height / 2) - 0.2,
            z: position.z
          });
          label.setAttribute('rotation', rotation);
          placeholder.parentNode.appendChild(label);
        }
        
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

// Generate mock artworks
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

// Clean up unwanted elements
function cleanupUnwantedElements() {
  const threeElements = document.querySelectorAll('a-entity[three-object]');
  threeElements.forEach(element => {
    if (element.getAttribute('three-object') === 'undefined') {
      console.log("Removing problematic three-object element");
      element.parentNode.removeChild(element);
    }
  });
}

window.loadGallery = loadGallery;
window.loadGalleryById = loadGalleryById;
window.showGalleryError = showGalleryError;
window.createMockGallery = createMockGallery;
window.getMockArtworks = getMockArtworks;
window.cleanupUnwantedElements = cleanupUnwantedElements;
window.setupBackButton = setupBackButton;