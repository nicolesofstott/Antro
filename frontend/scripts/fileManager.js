import { safeGetElement } from './profileUtils.js';
import { backendBase } from './profileAuth.js';

// File upload handlers
function setupFileUploads() {
  console.log("Setting up file uploads...");
  
  const resumeUpload = safeGetElement("resume-upload");
  const portfolioUpload = safeGetElement("portfolio-upload");

  if (resumeUpload) {
    resumeUpload.addEventListener("change", (e) => handleFileUpload(e, 'cv'));
  }
  
  if (portfolioUpload) {
    portfolioUpload.addEventListener("change", (e) => handleFileUpload(e, 'portfolio'));
  }
}

// Handle file upload
async function handleFileUpload(event, fileType) {
  const file = event.target.files[0];
  if (!file) return;

  console.log(`Uploading ${fileType}:`, file.name);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", fileType);

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${backendBase}/api/files/upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to upload ${fileType}: ${response.status}`);
    }

    const result = await response.json();
    console.log(`${fileType} uploaded successfully:`, result);
    alert(`${fileType.toUpperCase()} uploaded successfully!`);
    
    await loadUserFiles();
  } catch (error) {
    console.error(`Error uploading ${fileType}:`, error);
    alert(`Failed to upload ${fileType}: ${error.message}`);
  }
}

// Load user files
async function loadUserFiles() {
  try {
    console.log("Loading user files...");
    const token = localStorage.getItem("token");
    
    const response = await fetch(`${backendBase}/api/files/`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load files: ${response.status}`);
    }

    const files = await response.json();
    console.log("Files loaded:", files);

    renderUserFiles(files);
  } catch (error) {
    console.error("Error loading files:", error);
    showFileError("Failed to load files");
  }
}

// Render user files
function renderUserFiles(files) {
  const resumePreview = safeGetElement("resume-preview");
  const portfolioPreview = safeGetElement("portfolio-preview");

  if (resumePreview) resumePreview.innerHTML = "";
  if (portfolioPreview) portfolioPreview.innerHTML = "";

  const cvFiles = files.filter(f => f.type === 'cv');
  const portfolioFiles = files.filter(f => f.type === 'portfolio');

  if (resumePreview) {
    if (cvFiles.length > 0) {
      cvFiles.forEach(file => renderFilePreview(resumePreview, file));
    } else {
      resumePreview.innerHTML = '<p>No CV uploaded yet.</p>';
    }
  }

  if (portfolioPreview) {
    if (portfolioFiles.length > 0) {
      portfolioFiles.forEach(file => renderFilePreview(portfolioPreview, file));
    } else {
      portfolioPreview.innerHTML = '<p>No portfolio uploaded yet.</p>';
    }
  }
}

// Render individual file preview
function renderFilePreview(container, file) {
  const fileName = file.originalName || 'Unknown file';
  const fileUrl = file.url;
  
  console.log(`Rendering file: ${fileName} (${fileUrl})`);

  if (fileName.toLowerCase().endsWith('.pdf')) {
    const iframe = document.createElement("iframe");
    iframe.src = fileUrl;
    iframe.width = "100%";
    iframe.height = "600px";
    iframe.style.border = "none";
    iframe.style.borderRadius = "8px";
    iframe.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
    
    iframe.onerror = () => {
      console.error("Failed to load PDF:", fileUrl);
      container.innerHTML = createDownloadLink(fileUrl, fileName);
    };
    
    container.appendChild(iframe);
    
    // Add delete button
    const deleteBtn = createDeleteButton(file._id, file.type);
    container.appendChild(deleteBtn);
    
  } else {
    // For other files, show download link
    container.innerHTML = createDownloadLink(fileUrl, fileName);
    
    // Add delete button
    const deleteBtn = createDeleteButton(file._id, file.type);
    container.appendChild(deleteBtn);
  }
}

// Create download link HTML
function createDownloadLink(fileUrl, fileName) {
  return `
    <div style="text-align: center; padding: 40px; border: 2px dashed #ccc; border-radius: 8px; background: #f9f9f9;">
      <div style="font-weight: bold; margin-bottom: 15px; word-break: break-word;">${fileName}</div>
      <a href="${fileUrl}" target="_blank" 
         style="display: inline-block; background: #007cba; color: white; 
                padding: 12px 24px; border-radius: 6px; text-decoration: none;
                font-weight: 600; transition: background 0.3s ease;">
        Download File
      </a>
    </div>
  `;
}

// Create delete button
function createDeleteButton(fileId, fileType) {
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = `Delete ${fileType.toUpperCase()}`;
  deleteBtn.style.cssText = `
    background: #dc3545;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 10px;
    font-size: 12px;
  `;
  
  deleteBtn.addEventListener("click", () => deleteFile(fileId, fileType));
  
  return deleteBtn;
}

// Delete file
async function deleteFile(fileId, fileType) {
  if (!confirm(`Are you sure you want to delete this ${fileType}?`)) {
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${backendBase}/api/files/${fileId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete ${fileType}: ${response.status}`);
    }

    console.log(`${fileType} deleted successfully`);
    alert(`${fileType.toUpperCase()} deleted successfully!`);
    
    await loadUserFiles();
  } catch (error) {
    console.error(`Error deleting ${fileType}:`, error);
    alert(`Failed to delete ${fileType}: ${error.message}`);
  }
}

// Show file error
function showFileError(message) {
  const resumePreview = safeGetElement("resume-preview");
  const portfolioPreview = safeGetElement("portfolio-preview");
  
  const errorHtml = `<div style="color: red; padding: 10px;">${message}</div>`;
  
  if (resumePreview) resumePreview.innerHTML = errorHtml;
  if (portfolioPreview) portfolioPreview.innerHTML = errorHtml;
}

export {
  setupFileUploads,
  loadUserFiles,
  renderUserFiles,
  renderFilePreview
};