document.addEventListener("DOMContentLoaded", () => {
  const backendBase = "http://localhost:5050";
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (!user || !token) {
    alert("Please log in to edit your settings.");
    window.location.href = "../authentication/login.html";
    return;
  }

  // Form elements
  const nameInput = document.getElementById("name-input");
  const fullnameInput = document.getElementById("fullname-input");
  const aboutInput = document.getElementById("about-input");
  const usernameInput = document.getElementById("username-input");
  const emailDisplay = document.getElementById("email-display");
  const emailDomainNotice = document.getElementById("email-domain-notice");
  const currentPwInput = document.getElementById("current-password");
  const newPwInput = document.getElementById("new-password");

  // Profile picture elements
  const profilePicPreview = document.getElementById("profile-pic-preview");
  const profilePicInput = document.getElementById("profile-pic-input");
  const uploadPicBtn = document.getElementById("upload-profile-pic-btn");
  const removePicBtn = document.getElementById("remove-profile-pic-btn");

  // Delete account elements
  const deleteAccountBtn = document.getElementById("delete-account-btn");
  const deleteAccountModal = document.getElementById("delete-account-modal");
  const closeModalBtn = document.querySelector(".close-modal");
  const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
  const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
  const deleteAccountPassword = document.getElementById("delete-account-password");

  fetchCurrentUser();

  // Event listeners
  if (uploadPicBtn) {
    uploadPicBtn.addEventListener("click", () => {
      profilePicInput.click();
    });
  }

  if (profilePicInput) {
    profilePicInput.addEventListener("change", handleProfilePicUpload);
  }

  if (removePicBtn) {
    removePicBtn.addEventListener("click", handleRemoveProfilePic);
  }

  document.getElementById("settings-form").addEventListener("submit", handleFormSubmit);
  
  document.getElementById("logout-btn")?.addEventListener("click", () => {
    localStorage.clear();
    alert("You have been logged out.");
    window.location.href = "../authentication/login.html";
  });

  // Delete account event listeners
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", () => {
      deleteAccountModal.classList.remove("hidden");
      deleteAccountModal.classList.add("visible");
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      deleteAccountModal.classList.add("hidden");
      deleteAccountModal.classList.remove("visible");
      deleteAccountPassword.value = "";
    });
  }

  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", () => {
      deleteAccountModal.classList.add("hidden");
      deleteAccountModal.classList.remove("visible");
      deleteAccountPassword.value = "";
    });
  }

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", handleDeleteAccount);
  }

  // Fetch current user data
  async function fetchCurrentUser() {
    try {
      console.log("Fetching current user data...");
      const response = await fetch(`${backendBase}/api/profile/me`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await safeParseJSON(response);
        throw new Error(errorData?.error || `Failed to fetch user profile (${response.status})`);
      }

      const userData = await response.json();
      console.log("Current user data:", userData);

      localStorage.setItem("user", JSON.stringify(userData));

      nameInput.value = userData.displayName || "";
      fullnameInput.value = userData.fullName || "";
      aboutInput.value = userData.about || "";
      usernameInput.value = userData.username || "";
      emailDisplay.textContent = userData.email || "";

      // Display email domain notice for artwork uploads
      if (userData.email && userData.email.endsWith('@arts.ac.uk')) {
        emailDomainNotice.textContent = "You can upload artwork with this email domain.";
        emailDomainNotice.style.color = "green";
      } else {
        emailDomainNotice.textContent = "Note: Only users with @arts.ac.uk email addresses can upload artwork.";
        emailDomainNotice.style.color = "red";
      }

      // Set profile picture
      if (userData.profilePicUrl) {
        profilePicPreview.src = userData.profilePicUrl;
        console.log("Setting profile picture from URL:", userData.profilePicUrl);
      } else if (userData.profilePic) {
        const picUrl = `${backendBase}/uploads/${userData._id}/profiles/${userData.profilePic}`;
        profilePicPreview.src = picUrl;
        console.log("Setting profile picture from constructed path:", picUrl);
      } else {
        profilePicPreview.src = "../images/profileholder.png";
        console.log("Using default profile picture");
      }

      profilePicPreview.onerror = function() {
        console.error("Failed to load profile picture");
        this.src = "../images/profileholder.png";
      };

    } catch (error) {
      console.error("Error fetching user data:", error);
      alert("Failed to load your profile data. Please try refreshing the page.");
    }
  }

  async function safeParseJSON(response) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else {
      const text = await response.text();
      return { error: text || `Server error: ${response.status}` };
    }
  }

  // Profile picture upload
  async function handleProfilePicUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    console.log("Processing file upload:", file.name, file.type, file.size);

    const reader = new FileReader();
    reader.onload = (e) => {
      profilePicPreview.src = e.target.result;
    };
    reader.readAsDataURL(file);

    // Upload to server
    try {
      const formData = new FormData();
      formData.append("profilePic", file);

      console.log("Uploading profile picture...");
      
      const response = await fetch(`${backendBase}/api/profile/upload-profile-pic`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await safeParseJSON(response);
        throw new Error(errorData?.error || `Upload failed (${response.status})`);
      }

      const data = await response.json();
      console.log("Profile picture upload response:", data);

      if (!data.user || (!data.user.profilePic && !data.user.profilePicUrl)) {
        console.warn("Warning: Response missing expected data", data);
      }

      const currentUser = JSON.parse(localStorage.getItem("user")) || {};
      const updatedUser = {
        ...currentUser,
        profilePic: data.user?.profilePic,
        profilePicUrl: data.user?.profilePicUrl
      };
      
      localStorage.setItem("user", JSON.stringify(updatedUser));
      console.log("Updated user object in localStorage", updatedUser);

      alert("Profile picture updated successfully!");
    } catch (error) {
      console.error("Profile picture upload error:", error);
      alert(`Failed to upload profile picture: ${error.message}`);
      
      fetchCurrentUser();
    }

    e.target.value = "";
  }

  // Handle profile picture removal
  async function handleRemoveProfilePic() {
    try {
      console.log("Removing profile picture...");
      const response = await fetch(`${backendBase}/api/profile/remove-profile-pic`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await safeParseJSON(response);
        throw new Error(errorData?.error || `Removal failed (${response.status})`);
      }

      const data = await response.json();
      console.log("Profile picture removal response:", data);

      const currentUser = JSON.parse(localStorage.getItem("user")) || {};
      const updatedUser = { ...currentUser };
      delete updatedUser.profilePic;
      delete updatedUser.profilePicUrl;
      localStorage.setItem("user", JSON.stringify(updatedUser));

      profilePicPreview.src = "../images/profileholder.png";

      alert("Profile picture removed successfully!");
    } catch (error) {
      console.error("Profile picture removal error:", error);
      alert(`Failed to remove profile picture: ${error.message}`);
    }
  }

  // Handle form submission
  async function handleFormSubmit(e) {
    e.preventDefault();

    const newName = nameInput.value.trim();
    const newFullName = fullnameInput.value.trim();
    const newAbout = aboutInput.value.trim();
    const newUsername = usernameInput.value.trim();
    const currentPassword = currentPwInput.value;
    const newPassword = newPwInput.value;

    // Update profile information
    try {
      const profileData = {
        displayName: newName,
        fullName: newFullName,
        about: newAbout
      };

      console.log("Updating profile information...", profileData);
      
      const profileResponse = await fetch(`${backendBase}/api/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (!profileResponse.ok) {
        const errorData = await safeParseJSON(profileResponse);
        throw new Error(errorData?.error || `Profile update failed (${profileResponse.status})`);
      }

      const profileResult = await profileResponse.json();
      console.log("Profile update response:", profileResult);

      const currentUser = JSON.parse(localStorage.getItem("user")) || {};
      const updatedUser = {
        ...currentUser,
        displayName: newName,
        fullName: newFullName,
        about: newAbout
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      console.log("Updated user data in localStorage");
    } catch (error) {
      console.error("Profile update error:", error);
      alert(`Failed to update profile: ${error.message}`);
      return;
    }

    // Update password if needed
    if (currentPassword && newPassword) {
      if (newPassword.length < 6) {
        alert("New password must be at least 6 characters.");
        return;
      }

      try {
        console.log("Updating password...");
        
        const passwordResponse = await fetch(`${backendBase}/api/auth/change-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        });

        if (!passwordResponse.ok) {
          const errorData = await safeParseJSON(passwordResponse);
          throw new Error(errorData?.message || errorData?.error || `Password update failed (${passwordResponse.status})`);
        }

        alert("Password updated successfully!");
        currentPwInput.value = "";
        newPwInput.value = "";
      } catch (error) {
        console.error("Password update error:", error);
        alert(`Failed to update password: ${error.message}`);
        return;
      }
    }

    // Update username if changed
    if (newUsername && newUsername !== user.username) {
      try {
        console.log("Updating username to:", newUsername);
        
        const usernameResponse = await fetch(`${backendBase}/api/auth/update-username`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ newUsername }),
        });

        if (!usernameResponse.ok) {
          const errorData = await safeParseJSON(usernameResponse);
          throw new Error(errorData?.message || errorData?.error || `Username update failed (${usernameResponse.status})`);
        }

        const usernameResult = await usernameResponse.json();
        console.log("Username update response:", usernameResult);
        
        const currentUser = JSON.parse(localStorage.getItem("user")) || {};
        const updatedUser = {
          ...currentUser,
          username: usernameResult.username
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        alert("Username updated successfully!");
      } catch (error) {
        console.error("Username update error:", error);
        alert(`Failed to update username: ${error.message}`);
        return;
      }
    }

    alert("All changes saved successfully!");
  }

  // Handle delete account
  async function handleDeleteAccount() {
    const password = deleteAccountPassword.value;
    
    if (!password) {
      alert("Please enter your password to confirm account deletion.");
      return;
    }

    try {
      console.log("Deleting account...");
      
      const response = await fetch(`${backendBase}/api/auth/delete-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        const errorData = await safeParseJSON(response);
        throw new Error(errorData?.message || errorData?.error || `Account deletion failed (${response.status})`);
      }

      localStorage.clear();
      alert("Your account has been successfully deleted.");
      window.location.href = "../index.html";
    } catch (error) {
      console.error("Account deletion error:", error);
      alert(`Failed to delete account: ${error.message}`);
    }
  }
});