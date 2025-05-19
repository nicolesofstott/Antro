import { safeGetElement } from './profileUtils.js';
import { backendBase } from './profileAuth.js';

function setupFileUploads() {
  setupResumeUpload();
  
  setupPortfolioUpload();
}

// Setup CV/Resume upload
function setupResumeUpload() {
  const resumeUpload = safeGetElement("resume-upload");
  if (resumeUpload) {
    resumeUpload.addEventListener("change", async function() {
      if (!this.files || this.files.length === 0) return;
      
      const file = this.files[0];
      if (file.type !== "application/pdf") {
        alert("Please upload a PDF file");
        this.value = '';
        return;
      }
      
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "cv");
        
        const freshToken = localStorage.getItem("token");
        if (!freshToken) {
          alert("Your session has expired. Please log in again.");
          window.location.href = "../authentication/login.html";
          return;
        }
        
        console.log("Uploading CV...");
        const res = await fetch(`${backendBase}/api/files/upload`, {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${freshToken}`
          },
          body: formData
        });
        
        const responseText = await res.text();
        console.log("CV upload response:", responseText);
        
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            alert("Your session has expired. Please log in again.");
            window.location.href = "../authentication/login.html";
            return;
          }
          
          let errorMessage = `Upload failed. Status: ${res.status}`;
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {}
          throw new Error(errorMessage);
        }
        
        const data = JSON.parse(responseText);
        console.log("Uploaded CV:", data);
        
        // Construct the file URL 
        let fileUrl;
        if (data.file.url) {
          fileUrl = data.file.url;
        } else if (data.file.path) {
          fileUrl = `${backendBase}/${data.file.path}`;
        } else {
          throw new Error("File response missing URL or path");
        }
        
        console.log("CV URL:", fileUrl);
        renderPDFPreview("resume-preview", fileUrl, data.file._id);
        
        // Switch to the CV tab
        const cvTabButton = document.querySelector('[data-tab="cv-tab"]');
        if (cvTabButton) cvTabButton.click();
        
        this.value = '';
      } catch (err) {
        console.error("CV upload error:", err);
        alert(`Failed to upload CV: ${err.message}`);
        this.value = '';
      }
    });
  }
}

// Setup Portfolio upload
function setupPortfolioUpload() {
  const portfolioUpload = safeGetElement("portfolio-upload");
  if (portfolioUpload) {
    portfolioUpload.addEventListener("change", async function() {
      if (!this.files || this.files.length === 0) return;
      
      const file = this.files[0];
      if (file.type !== "application/pdf") {
        alert("Please upload a PDF file");
        this.value = '';
        return;
      }
      
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "portfolio");
        
        const freshToken = localStorage.getItem("token");
        if (!freshToken) {
          alert("Your session has expired. Please log in again.");
          window.location.href = "../authentication/login.html";
          return;
        }
        
        console.log("Uploading portfolio...");
        const res = await fetch(`${backendBase}/api/files/upload`, {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${freshToken}`
          },
          body: formData
        });
        
        const responseText = await res.text();
        console.log("Portfolio upload response:", responseText);
        
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            alert("Your session has expired. Please log in again.");
            window.location.href = "../authentication/login.html";
            return;
          }
          
          let errorMessage = `Upload failed. Status: ${res.status}`;
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {}
          throw new Error(errorMessage);
        }
        
        const data = JSON.parse(responseText);
        console.log("Uploaded portfolio:", data);
        
        // Construct the file URL 
        let fileUrl;
        if (data.file.url) {
          fileUrl = data.file.url;
        } else if (data.file.path) {
          fileUrl = `${backendBase}/${data.file.path}`;
        } else {
          throw new Error("File response missing URL or path");
        }
        
        console.log("Portfolio URL:", fileUrl);
        renderPDFPreview("portfolio-preview", fileUrl, data.file._id);
        
        // Switch to the portfolio tab
        const portfolioTabButton = document.querySelector('[data-tab="portfolio-tab"]');
        if (portfolioTabButton) portfolioTabButton.click();
        
        this.value = '';
      } catch (err) {
        console.error("Portfolio upload error:", err);
        alert(`Failed to upload portfolio: ${err.message}`);
        this.value = '';
      }
    });
  }
}

// Render PDF preview
function renderPDFPreview(containerId, fileUrl, fileId) {
  const container = safeGetElement(containerId);
  if (!container) {
    console.error(`Container not found: ${containerId}`);
    return;
  }

  // Clear any existing preview items if this is a new upload
  const existingItems = container.querySelectorAll(".pdf-item");
  if (existingItems.length > 0) {
    existingItems.forEach(item => item.remove());
  }

  const wrapper = document.createElement("div");
  wrapper.classList.add("pdf-item");
  wrapper.dataset.id = fileId;

  const embed = document.createElement("embed");
  embed.src = fileUrl;
  embed.type = "application/pdf";
  embed.width = "100%";
  embed.height = "500px";

  const deleteBtn = document.createElement("button");
  deleteBtn.innerHTML = "×"; // Use × symbol for consistency
  deleteBtn.classList.add("delete-btn");
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this file?")) {
      deleteFile(fileId, wrapper);
    }
  };

  wrapper.appendChild(embed);
  wrapper.appendChild(deleteBtn);
  container.appendChild(wrapper);
}

// Delete file function
async function deleteFile(fileId, wrapperElement) {
  if (!fileId) {
    console.error("No file ID provided for deletion");
    return;
  }

  const freshToken = localStorage.getItem("token");
  if (!freshToken) {
    alert("Your session has expired. Please log in again.");
    window.location.href = "../authentication/login.html";
    return;
  }

  try {
    console.log(`Deleting file: ${fileId}`);
    const res = await fetch(`${backendBase}/api/files/${fileId}`, {
      method: "DELETE",
      headers: { 
        Authorization: `Bearer ${freshToken}`
      }
    });

    let responseText;
    try {
      responseText = await res.text();
      console.log("Delete file response:", responseText);
    } catch (e) {
      console.error("Failed to read delete file response:", e);
    }

    if (res.ok) {
      wrapperElement.remove();
      alert("File deleted successfully");
    } else {
      if (res.status === 401 || res.status === 403) {
        alert("Your session has expired. Please log in again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "../authentication/login.html";
        return;
      }
      
      let errorMessage = `Failed to delete file. Status: ${res.status}`;
      try {
        if (responseText) {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        }
      } catch (e) {
        console.error("Failed to parse error response:", e);
      }
      alert(errorMessage);
    }
  } catch (err) {
    console.error("Error deleting file:", err);
    alert(`Failed to delete file: ${err.message}`);
  }
}

// Load user files
async function loadUserFiles() {
  try {
    console.log("Loading user files...");
    const freshToken = localStorage.getItem("token");

    if (!freshToken) {
      throw new Error("Authentication token missing");
    }

    const res = await fetch(`${backendBase}/api/files`, {
      headers: { Authorization: `Bearer ${freshToken}` }
    });

    let responseText;
    try {
      responseText = await res.text();
      console.log("Files response text:", responseText);
    } catch (e) {
      console.error("Failed to read files response:", e);
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error("Authentication failed");
      }
      
      let errorMessage = "Failed to load files";
      try {
        if (responseText) {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        }
      } catch (e) {
        console.error("Failed to parse error response:", e);
      }
      throw new Error(errorMessage);
    }

    let files;
    try {
      files = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse files JSON:", e);
      throw new Error("Invalid response format");
    }

    console.log("Loaded files:", files);

    if (!files || files.length === 0) {
      console.log("No files found");
      return;
    }

    // Clear existing PDF previews
    const resumePreview = safeGetElement("resume-preview");
    const portfolioPreview = safeGetElement("portfolio-preview");

    if (resumePreview) resumePreview.innerHTML = "";
    if (portfolioPreview) portfolioPreview.innerHTML = "";

    files.forEach(file => {
      if (!file.path && !file.url) {
        console.warn("File missing path and url:", file);
        return;
      }
      
      // Construct the file URL 
      let fileUrl;
      if (file.url) {
        fileUrl = file.url;
      } else if (file.path) {
        fileUrl = `${backendBase}/${file.path}`;
      } else {
        console.warn("File missing path and url:", file);
        return;
      }
      
      console.log(`Rendering file: ${file.type}, URL: ${fileUrl}`);
      
      if (file.type === "cv") {
        renderPDFPreview("resume-preview", fileUrl, file._id);
      } else if (file.type === "portfolio") {
        renderPDFPreview("portfolio-preview", fileUrl, file._id);
      }
    });      
  } catch (err) {
    console.error("Error loading files:", err);

    if (err.message === "Authentication failed" || err.message === "Authentication token missing") {
      alert("Your session has expired. Please log in again.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "../authentication/login.html";
    }
  }
}

export {
  setupFileUploads,
  renderPDFPreview,
  deleteFile,
  loadUserFiles
};