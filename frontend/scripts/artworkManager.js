import { safeGetElement, resizeGridItem } from './profileUtils.js';
import { backendBase } from './profileAuth.js';

// Render artwork preview for Pinterest-style layout
function renderArtPreview(containerId, artwork) {
  const container = safeGetElement(containerId);
  if (!container) return console.error(`Container not found: ${containerId}`);

  const card = document.createElement("div");
  card.classList.add("art-item");
  card.dataset.id = artwork._id;
  card.dataset.title = artwork.title || "Untitled";
  card.dataset.dimensions = artwork.dimensions || "Unknown";
  card.dataset.description = artwork.description || "No description";
  
  card.dataset.images = JSON.stringify([
    artwork.mainImageUrl, 
    ...(artwork.extraImageUrls || [])
  ].filter(Boolean));

  const img = document.createElement("img");
  img.src = artwork.mainImageUrl; 
  img.alt = artwork.title || "Artwork";

  img.onload = () => {
    resizeGridItem(card);
  };
  
  img.onerror = () => {
    console.warn(`Failed to load image: ${artwork.mainImageUrl}`);
    img.src = "../images/profileholder.png";
    setTimeout(() => resizeGridItem(card), 100);
  };

  // Title label
  const titleDiv = document.createElement("div");
  titleDiv.classList.add("art-title");
  titleDiv.textContent = artwork.title || "Untitled";
  
  // Add dimensions as a subtle caption
  if (artwork.dimensions) {
    const dimensionsSpan = document.createElement("div");
    dimensionsSpan.classList.add("art-dimensions");
    dimensionsSpan.textContent = artwork.dimensions;
    dimensionsSpan.style.fontSize = "0.8rem";
    dimensionsSpan.style.color = "#777";
    dimensionsSpan.style.marginTop = "4px";
    titleDiv.appendChild(dimensionsSpan);
  }

  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.innerHTML = "×"; // × symbol for delete
  deleteBtn.classList.add("delete-btn");
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${artwork.title || 'Untitled'}"?`)) {
      deleteArtwork(artwork._id, card);
    }
  };

  // Modal click
  card.addEventListener("click", function() {
    openModal(card);
  });

  card.appendChild(img);
  card.appendChild(titleDiv);
  card.appendChild(deleteBtn);
  container.appendChild(card);
  
  // Set initial size (adjusted when image loads)
  card.style.gridRowEnd = "span 30";
  
  return card;
}

// Open modal function
function openModal(card) {
    console.log("Opening modal for card:", card);
    
    const title = card.dataset.title;
    const dimensions = card.dataset.dimensions;
    const description = card.dataset.description;
    
    let images = [];
    try {
      images = JSON.parse(card.dataset.images || "[]");
      console.log("Parsed images:", images);
    } catch (err) {
      console.error("Failed to parse images JSON:", err);
    }
  
    // Set modal content
    const modalTitle = safeGetElement("modalTitle");
    const modalDimensions = safeGetElement("modalDimensions");
    const modalDescription = safeGetElement("modalDescription");
    const modalImages = safeGetElement("modalImages");
    
    if (modalTitle) modalTitle.textContent = title;
    if (modalDimensions) modalDimensions.textContent = `Dimensions: ${dimensions}`;
    if (modalDescription) modalDescription.textContent = description;
  
    // Clear and populate images
    if (modalImages) {
      modalImages.innerHTML = "";
      
      if (images.length === 0) {
        const noImagesMessage = document.createElement("p");
        noImagesMessage.textContent = "No images available";
        noImagesMessage.style.textAlign = "center";
        noImagesMessage.style.fontStyle = "italic";
        noImagesMessage.style.color = "#777";
        modalImages.appendChild(noImagesMessage);
      } else {
        // Add each image to the modal
        images.forEach((src, index) => {
          if (!src) return;
          
          const imgContainer = document.createElement("div");
          imgContainer.style.marginBottom = "15px";
          
          const modalImg = document.createElement("img");
          modalImg.src = src;
          modalImg.alt = `${title} - Image ${index + 1}`;
          modalImg.style.width = "100%";
          modalImg.style.borderRadius = "8px";
          modalImg.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
          
          modalImg.onerror = () => {
            console.error(`Failed to load modal image: ${src}`);
            modalImg.src = "../images/profileholder.png";
            modalImg.style.opacity = "0.7";
          };
          
          imgContainer.appendChild(modalImg);
          modalImages.appendChild(imgContainer);
        });
      }
    }
  
    // Show modal
    const modal = safeGetElement("artworkModal");
    if (modal) {
      console.log("Displaying modal");
      
      modal.style.position = "fixed";
      modal.style.zIndex = "9999"; 
      modal.style.left = "0";
      modal.style.top = "0";
      modal.style.width = "100%";
      modal.style.height = "100%";
      modal.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
      modal.style.overflow = "auto";
      
      const modalContent = modal.querySelector(".modal-content");
      if (modalContent) {
        modalContent.style.backgroundColor = "#fff";
        modalContent.style.margin = "50px auto";
        modalContent.style.padding = "25px";
        modalContent.style.maxWidth = "800px";
        modalContent.style.width = "80%";
        modalContent.style.borderRadius = "8px";
        modalContent.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.3)";
        modalContent.style.position = "relative";
      }
      
      const closeBtn = modal.querySelector(".close");
      if (closeBtn) {
        closeBtn.style.position = "absolute";
        closeBtn.style.top = "15px";
        closeBtn.style.right = "20px";
        closeBtn.style.fontSize = "28px";
        closeBtn.style.fontWeight = "bold";
        closeBtn.style.color = "#555";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.zIndex = "1";
      }
      
      modal.classList.remove("hidden");
      modal.style.display = "flex"; 
      modal.style.justifyContent = "center";
      modal.style.alignItems = "flex-start"; 
    } else {
      console.error("Modal element not found!");
    }
  }

// Delete artwork
async function deleteArtwork(artworkId, cardElement) {
  if (!artworkId) return console.error("No artwork ID provided for deletion");

  const freshToken = localStorage.getItem("token");
  if (!freshToken) {
    alert("Your session has expired. Please log in again.");
    window.location.href = "../authentication/login.html";
    return;
  }

  try {
    console.log(`Deleting artwork: ${artworkId}`);
    const res = await fetch(`${backendBase}/api/artworks/${artworkId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${freshToken}` }
    });

    const responseText = await res.text();
    console.log("Delete response:", responseText);

    if (res.ok) {
      cardElement.remove();
      alert("Artwork deleted successfully");
    } else {
      if ([401, 403].includes(res.status)) {
        alert("Your session has expired. Please log in again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "../authentication/login.html";
        return;
      }

      let errorMessage = `Failed to delete artwork. Status: ${res.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {}
      alert(errorMessage);
    }
  } catch (err) {
    console.error("Error deleting artwork:", err);
    alert(`Failed to delete artwork: ${err.message}`);
  }
}

// Load user artworks
async function loadUserArtworks() {
  try {
    console.log("Loading user artworks...");
    const freshToken = localStorage.getItem("token");

    if (!freshToken) throw new Error("Authentication token missing");

    const res = await fetch(`${backendBase}/api/artworks/mine`, {
      headers: { Authorization: `Bearer ${freshToken}` }
    });

    const responseText = await res.text();
    console.log("Artworks response text:", responseText);

    if (!res.ok) {
      let errorMessage = "Failed to load artworks";
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    const artworks = JSON.parse(responseText);
    console.log("Loaded artworks:", artworks);

    const container = safeGetElement("art-preview");
    if (!container) return console.error("Art preview container not found");

    container.innerHTML = "";
    
    if (!container.classList.contains('art-grid')) {
      container.classList.add('art-grid');
    }

    if (artworks.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.classList.add('art-grid-empty');
      emptyMessage.innerHTML = "<p>No artworks found. Upload some artwork to get started!</p>";
      container.appendChild(emptyMessage);
      return;
    }

    // Render each artwork
    artworks.forEach(artwork => {
      renderArtPreview("art-preview", artwork);
    });

    setTimeout(() => {
      initMasonryLayout();
    }, 100);

  } catch (err) {
    console.error("Error loading artworks:", err);

    if (["Authentication failed", "Authentication token missing"].includes(err.message)) {
      alert("Your session has expired. Please log in again.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "../authentication/login.html";
      return;
    }

    const container = safeGetElement("art-preview");
    if (container) {
      container.innerHTML = "";
      const errorMessage = document.createElement('div');
      errorMessage.classList.add('art-grid-empty');
      errorMessage.innerHTML = `<p>Error loading artworks: ${err.message}</p>`;
      container.appendChild(errorMessage);
    }
  }
}

// Setup artwork upload form
function setupArtworkUpload() {
  const uploadForm = safeGetElement("artwork-upload-form");
  const toggleArtForm = safeGetElement("toggle-art-form");
  
  if (toggleArtForm) {
    toggleArtForm.addEventListener("click", () => {
      const artUploadForm = safeGetElement("art-upload-form");
      if (artUploadForm) {
        artUploadForm.classList.toggle("hidden");
      }
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(uploadForm);

      const freshToken = localStorage.getItem("token");
      if (!freshToken) {
        alert("Your session has expired. Please log in again.");
        window.location.href = "../authentication/login.html";
        return;
      }

      for (let pair of formData.entries()) {
        console.log(`Form data: ${pair[0]}: ${pair[1]}`);
      }

      // Verify dimensions format
      const dimensions = formData.get('dimensions');
      if (dimensions && !/^\d{1,3}x\d{1,3}$/.test(dimensions)) {
        alert("Dimensions must be in format: widthxheight (e.g., 100x200)");
        return;
      }

      // Larger files
      try {
        const extraImagesField = uploadForm.querySelector('input[name="extraImages"]');
        const hasMultipleFiles = extraImagesField && extraImagesField.files && extraImagesField.files.length > 3;
        
        if (hasMultipleFiles) {
          alert("Uploading multiple files. This may take a moment...");
        }
        
        console.log("Sending artwork upload request...");
        console.log("Using authorization token:", freshToken ? freshToken.substring(0, 10) + "..." : "MISSING");
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000);
        
        try {
          const res = await fetch(`${backendBase}/api/artworks/upload`, {
            method: "POST",
            headers: { 
              Authorization: `Bearer ${freshToken}`
            },
            body: formData,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          let responseText;
          let responseReadSuccess = false;
          
          try {
            responseText = await res.text();
            responseReadSuccess = true;
            console.log("Upload response text:", responseText);
          } catch (e) {
            console.error("Failed to read response text:", e);
            if (hasMultipleFiles) {
              console.log("Multiple files uploaded, waiting to verify success...");
              await new Promise(resolve => setTimeout(resolve, 2000));
              responseReadSuccess = false;
            } else {
              throw new Error("Failed to read server response");
            }
          }
          
          if (responseReadSuccess && !res.ok) {
            let errorMessage = "Upload failed";
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorData.message || "Upload failed";
            } catch (e) {
              console.error("Failed to parse error response:", e);
            }

            if (res.status === 401 || res.status === 403) {
              alert("Your session has expired. Please log in again.");
              window.location.href = "../authentication/login.html";
              return;
            }
            
            throw new Error(errorMessage);
          }

          alert("Upload successful!");
          uploadForm.reset();
          const artUploadForm = safeGetElement("art-upload-form");
          if (artUploadForm) {
            artUploadForm.classList.add("hidden");
          }
          await loadUserArtworks();
          
        } catch (fetchError) {
          clearTimeout(timeoutId);
          
          if (fetchError.name === 'AbortError') {
            console.log("Request timed out, but upload might still be processing...");
            alert("The request timed out, but your upload may still be processing. We'll check if it was successful.");
            
            await new Promise(resolve => setTimeout(resolve, 3000));
            await loadUserArtworks();
          } else {
            throw fetchError;
          }
        }
      } catch (err) {
        console.error("Upload error:", err);
        alert(`Failed to upload artwork: ${err.message}`);
      }
    });
  }
}

export {
  renderArtPreview,
  openModal,
  deleteArtwork,
  loadUserArtworks,
  setupArtworkUpload
};