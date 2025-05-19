// Utility function to safely get elements
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Element not found: ${id}`);
    }
    return element;
  }
  
  // Tab system
  function setupTabSystem() {
    console.log("Setting up enhanced tabs");
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");
    
    // First hide all tab contents
    tabContents.forEach(content => {
      content.style.display = "none";
      content.classList.remove("active");
    });
    
    // Function to activate a tab
    function activateTab(tabId) {
      console.log(`Activating tab: ${tabId}`);
      
      tabContents.forEach(content => {
        content.style.display = "none";
        content.classList.remove("active");
      });
      
      tabButtons.forEach(btn => {
        btn.classList.remove("active");
      });
      
      const targetTab = document.getElementById(tabId);
      const targetButton = document.querySelector(`[data-tab="${tabId}"]`);
      
      if (targetTab) {
        targetTab.style.display = "block";
        targetTab.classList.add("active");
        console.log(`Tab ${tabId} displayed`);
      } else {
        console.error(`Tab content not found: ${tabId}`);
      }
      
      if (targetButton) {
        targetButton.classList.add("active");
      }
      
      localStorage.setItem("activeProfileTab", tabId);
    }
    
    // Set up click handlers for tab buttons
    tabButtons.forEach(button => {
      button.addEventListener("click", () => {
        const tabId = button.dataset.tab;
        activateTab(tabId);
      });
    });
    
    // Activate the saved tab or default to the first tab
    const savedTab = localStorage.getItem("activeProfileTab");
    if (savedTab && document.getElementById(savedTab)) {
      activateTab(savedTab);
    } else {
      const firstTabId = tabButtons[0]?.dataset.tab;
      if (firstTabId) {
        activateTab(firstTabId);
      }
    }
    
    return {
      activateTab
    };
  }
  
  // Initialize masonry layout for artworks grid
  function initMasonryLayout() {
    console.log("Initializing masonry layout");
    const grid = document.getElementById('art-preview');
    if (!grid) {
      console.error("Art preview grid not found");
      return;
    }
    
    // Wait for images to load before calculating heights
    const artItems = grid.querySelectorAll('.art-item');
    if (artItems.length === 0) {
      console.log("No art items found in grid");
      return;
    }
    
    console.log(`Found ${artItems.length} art items to resize`);
    
    // Process all artwork items
    artItems.forEach(item => {
      const img = item.querySelector('img');
      if (!img) return;

      if (img.complete) {
        console.log("Image already loaded, resizing now");
        resizeGridItem(item);
      } else {
        img.addEventListener('load', () => {
          console.log("Image loaded, resizing item");
          resizeGridItem(item);
        });
        
        img.addEventListener('error', () => {
          console.error("Error loading image", img.src);
          item.style.gridRowEnd = 'span 20';
        });
      }
    });
  }
  
  // Function to resize grid item based on content size
  function resizeGridItem(item) {
    let rowHeight = 10;
    let rowGap = 15;
    
    const grid = document.getElementById('art-preview');
    if (!grid) return;
    
    try {
      const gridStyle = window.getComputedStyle(grid);
      const rowHeightValue = gridStyle.getPropertyValue('grid-auto-rows');
      const rowGapValue = gridStyle.getPropertyValue('grid-row-gap') || gridStyle.getPropertyValue('row-gap');
      
      if (rowHeightValue) rowHeight = parseInt(rowHeightValue);
      if (rowGapValue) rowGap = parseInt(rowGapValue);
    } catch (err) {
      console.warn("Could not compute grid styles, using defaults", err);
    }
    
    // Get the content height
    let contentHeight = 0;
    const img = item.querySelector('img');
    const titleDiv = item.querySelector('.art-title');
    
    if (img) contentHeight += img.offsetHeight;
    if (titleDiv) contentHeight += titleDiv.offsetHeight;
    
    // Calculate how many rows the item should span 
    const rowSpan = Math.max(10, Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap)));
    
    // Set the height
    item.style.gridRowEnd = `span ${rowSpan}`;
    console.log(`Item resized to span ${rowSpan} rows (content height: ${contentHeight}px)`);
  }
  
  // Function to setup modal close functionality
  function setupModalClose() {
    const closeModalBtn = safeGetElement("closeModalBtn");
    const artworkModal = safeGetElement("artworkModal");
  
    if (closeModalBtn && artworkModal) {
      closeModalBtn.addEventListener("click", () => {
        artworkModal.classList.add("hidden");
        artworkModal.style.display = "none";
      });
  
      window.addEventListener("click", (e) => {
        if (e.target === artworkModal) {
          artworkModal.classList.add("hidden");
          artworkModal.style.display = "none";
        }
      });
    }
  }
  
  export { 
    safeGetElement, 
    setupTabSystem, 
    initMasonryLayout, 
    resizeGridItem, 
    setupModalClose 
  };