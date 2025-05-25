document.addEventListener('DOMContentLoaded', () => {
  console.log("Gallery UI script initialized - checking if already initialized");
  
  if (window.VRGallery && window.VRGallery._initialized) {
    console.log("VRGallery was already initialized by VRgallery.js, skipping initialization");
    return;
  }
  
  console.log("Initializing Gallery UI from gallery-ui.js");
  
  // Create the global VRGallery object first to avoid reference errors
  window.VRGallery = {
    _initialized: true,
    initialize: function() {
      console.log("VR Gallery initializing from gallery-ui.js...");
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
  
  // Initialise galleries
  initializeGalleries().catch(error => {
    console.error("Error initializing galleries:", error);
    const errorMessage = document.createElement('div');
    errorMessage.className = 'gallery-error';
    errorMessage.innerHTML = 'Error loading gallery. Please try refreshing the page.';
    errorMessage.style.position = 'fixed';
    errorMessage.style.top = '50%';
    errorMessage.style.left = '50%';
    errorMessage.style.transform = 'translate(-50%, -50%)';
    errorMessage.style.padding = '15px 20px';
    errorMessage.style.background = 'rgba(255, 51, 51, 0.9)';
    errorMessage.style.color = 'white';
    errorMessage.style.borderRadius = '5px';
    errorMessage.style.zIndex = '9999';
    document.body.appendChild(errorMessage);
  });
  
  try {
    setupBackButton();
    setupInstructions();
    
    if (document.getElementById('galleryTabs')) {
      setupTabs();
      setupModalFunctionality();
      setupSearchFunctionality();
      loadGalleries();
    }
  } catch (err) {
    console.error("Error setting up UI:", err);
  }

  // Initialise VRGallery after a delay to ensure all other scripts are loaded
  setTimeout(() => {
    if (window.VRGallery && typeof window.VRGallery.initialize === 'function') {
      window.VRGallery.initialize();
    } else {
      console.warn("VRGallery object not properly initialized");
    }
  }, 1500);

  // Initialise A-Frame scene
  const scene = document.querySelector('a-scene');
  if (scene) {
    if (scene.hasLoaded) {
      console.log('A-Frame scene already loaded');
      onSceneLoaded();
    } else {
      scene.addEventListener('loaded', onSceneLoaded);
    }
  }
});

// Check and create a sample gallery only if needed
async function initializeGalleries() {
  try {
    if (typeof window.GalleryData === 'undefined') {
      console.log("GalleryData not available, skipping gallery initialization");
      return;
    }
    
    const galleries = await window.GalleryData.getGalleries();
    
    // Only create a sample gallery if no galleries exist
    if (!galleries || galleries.length === 0) {
      console.log("No galleries found, creating a sample gallery");
      await window.GalleryData.createSampleGallery();
    } else {
      console.log(`Found ${galleries.length} existing galleries, not creating sample`);
    }
  } catch (error) {
    console.warn("Error initializing galleries:", error);
  }
}
  
// Set up back button functionality
function setupBackButton() {
  const backButton = document.getElementById('backButton');
  if (backButton) {
    backButton.addEventListener('click', () => {
      window.location.href = 'VRgallery.html';
    });
    
    console.log('Back button initialized');
  }
}
  
// Set up instructions display and fade functionality
function setupInstructions(config = {}) {
  const instructions = document.getElementById('instructions');
  if (!instructions) return;

  const fadeTime = window.GalleryConfig?.ui?.instructionsFadeTime ?? 3000;
  const targetOpacity = window.GalleryConfig?.ui?.instructionsOpacity ?? '0.3';

  setTimeout(() => {
    instructions.style.opacity = targetOpacity;
  }, fadeTime);

  instructions.addEventListener('click', function () {
    this.style.opacity = '1';
    setTimeout(() => {
      this.style.opacity = targetOpacity;
    }, 3000);
  });

  console.log('Instructions initialized');
}

//Handle A-Frame scene loaded event
function onSceneLoaded() {
  console.log('A-Frame scene loaded, enhancing experience');
  
  document.addEventListener('keydown', handleKeyboardInput);

  const scene = document.querySelector('a-scene');
  if (scene) {
    scene.addEventListener('enter-vr', () => {
      console.log('Entered VR mode');
      toggleUIVisibility(false);
    });
    
    scene.addEventListener('exit-vr', () => {
      console.log('Exited VR mode');
      toggleUIVisibility(true);
    });
  }
}

// Keyboard input
function handleKeyboardInput(event) {
  if (event.key === 'h' || event.key === 'H') {
    const instructions = document.getElementById('instructions');
    if (instructions) {
      if (instructions.style.display === 'none') {
        instructions.style.display = 'block';
        instructions.style.opacity = '1';
      } else {
        instructions.style.display = 'none';
      }
    }
  }
}

// UI visibility toggle
function toggleUIVisibility(visible) {
  const uiElements = document.querySelectorAll('.ui-overlay, .vr-ui');
  uiElements.forEach(element => {
    element.style.display = visible ? 'block' : 'none';
  });
}

// Show a notification message to the user
function showNotification(message, type = 'info', duration = 3000) {
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '1000';
    document.body.appendChild(container);
  }
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  notification.style.backgroundColor = type === 'error' ? 'rgba(220, 53, 69, 0.9)' : 
                                      type === 'success' ? 'rgba(40, 167, 69, 0.9)' : 
                                      'rgba(0, 123, 255, 0.9)';
  notification.style.color = 'white';
  notification.style.padding = '10px 15px';
  notification.style.marginBottom = '10px';
  notification.style.borderRadius = '5px';
  notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
  notification.style.transition = 'opacity 0.3s, transform 0.3s';
  notification.style.opacity = '0';
  notification.style.transform = 'translateX(50px)';
  
  container.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(50px)';

    setTimeout(() => {
      container.removeChild(notification);
    }, 300);
  }, duration);
}

// Get URL parameters
function getUrlParams() {
  const params = {};
  const queryString = window.location.search.substring(1);
  const pairs = queryString.split('&');
  
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  }
  
  return params;
}

window.showNotification = showNotification;
window.toggleUIVisibility = toggleUIVisibility;
window.getUrlParams = getUrlParams;
window.setupBackButton = setupBackButton;
window.setupInstructions = setupInstructions;
window.onSceneLoaded = onSceneLoaded;