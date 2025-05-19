// This script is responsible for the VR Gallery functionality
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing VR Gallery UI");
    
    GalleryData.createSampleGallery();
    
    setupBackButton();
    
    setupInstructions();
    
    setTimeout(() => {
      VRGallery.initialize();
    }, 1000);

    const scene = document.querySelector('a-scene');
    if (scene.hasLoaded) {
      console.log('A-Frame scene already loaded');
      onSceneLoaded();
    } else {
      scene.addEventListener('loaded', onSceneLoaded);
    }
  });
  
  // Set up back button functionality
  function setupBackButton() {
    const backButton = document.getElementById('backButton');
    if (backButton) {
      backButton.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
      
      console.log('Back button initialized');
    }
  }
  
  function setupInstructions(config = {}) {
    const instructions = document.getElementById('instructions');
    if (!instructions) return;
  
    // Use GalleryConfig only if it's defined
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
    scene.addEventListener('enter-vr', () => {
      console.log('Entered VR mode');
      toggleUIVisibility(false);
    });
    
    scene.addEventListener('exit-vr', () => {
      console.log('Exited VR mode');
      toggleUIVisibility(true);
    });
  }
  
  // Handle keyboard input
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
  
  //Toggle UI visibility
  function toggleUIVisibility(visible) {
    const uiElements = document.querySelectorAll('.ui-overlay');
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