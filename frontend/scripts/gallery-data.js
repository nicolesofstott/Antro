const GalleryData = {
  // Get a specific gallery by name
  getGallery: async function(galleryName) {
    if (!galleryName) {
      throw new Error("Gallery name is required");
    }
    
    try {
      const token = localStorage.getItem('token');
      
      try {
        const response = await fetch(`/api/galleries/name/${galleryName}`, {
          method: 'GET',
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        if (response.ok) {
          return await response.json();
        }
      } catch (apiError) {
        console.warn(`API error: ${apiError.message}, trying localStorage`); 
      }
      
      // Fall back to localStorage
      const galleries = localStorage.getItem("userGalleries");
      if (galleries) {
        const parsedGalleries = JSON.parse(galleries);
        const gallery = parsedGalleries.find(g => g.name === galleryName);
        
        if (gallery) {
          console.log(`Gallery "${galleryName}" found in localStorage`);
          return gallery;
        }
      }
      
      throw new Error(`Gallery "${galleryName}" not found`);
    } catch (error) {
      console.error(`Error getting gallery "${galleryName}":`, error);
      throw error;
    }
  },

  // Get gallery by ID
  getGalleryById: async function(galleryId) {
    if (!galleryId) {
      throw new Error("Gallery ID is required");
    }
    
    try {
      const token = localStorage.getItem('token');
      
      try {
        const response = await fetch(`/api/galleries/${galleryId}`, {
          method: 'GET',
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        if (response.ok) {
          return await response.json();
        }
      } catch (apiError) {
        console.warn(`API error: ${apiError.message}, trying localStorage`);
      }
      
      // Fall back to localStorage
      const galleries = localStorage.getItem("userGalleries");
      if (galleries) {
        const parsedGalleries = JSON.parse(galleries);
        const gallery = parsedGalleries.find(g => (g.id === galleryId || g._id === galleryId));
        
        if (gallery) {
          console.log(`Gallery with ID "${galleryId}" found in localStorage`);
          return gallery;
        }
      }
      
      throw new Error(`Gallery with ID "${galleryId}" not found`);
    } catch (error) {
      console.error(`Error getting gallery "${galleryId}":`, error);
      throw error;
    }
  },

  // Get galleries for the user
  getGalleries: async function() {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/galleries/mine', {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch galleries: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching galleries:", error);
      const localGalleries = localStorage.getItem("userGalleries");
      return localGalleries ? JSON.parse(localGalleries) : [];
    }
  },
  
  // Get public galleries for explore tab
  getExploreGalleries: async function() {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/galleries/public', {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch public galleries: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching public galleries:", error);
      return [];
    }
  },
  
  // Get saved galleries
  getSavedGalleries: async function() {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log("No auth token available");
        return [];
      }
      
      const response = await fetch('/api/galleries/saved', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch saved galleries: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching saved galleries:", error);
      return [];
    }
  },
  
  // Save a gallery
  saveGallery: async function(galleryId) {
    if (!galleryId) {
      throw new Error("Gallery ID is required");
    }
    
    // Validate ID format using mongoose ObjectId regex
    if (!/^[0-9a-fA-F]{24}$/.test(galleryId) && !galleryId.startsWith('local_')) {
      throw new Error("Invalid gallery ID format");
    }
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/galleries/save/${galleryId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save gallery: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error saving gallery ${galleryId}:`, error);
      
      if (galleryId.startsWith('local_')) {
        const savedGalleries = localStorage.getItem('savedGalleries') || '[]';
        const saved = JSON.parse(savedGalleries);
        
        if (!saved.includes(galleryId)) {
          saved.push(galleryId);
          localStorage.setItem('savedGalleries', JSON.stringify(saved));
        }
        
        return { message: 'Gallery saved in local storage', isSaved: true };
      }
      
      throw error;
    }
  },
  
  // Unsave a gallery
  unsaveGallery: async function(galleryId) {
    if (!galleryId) {
      throw new Error("Gallery ID is required");
    }
    
    if (!/^[0-9a-fA-F]{24}$/.test(galleryId) && !galleryId.startsWith('local_')) {
      throw new Error("Invalid gallery ID format");
    }
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/galleries/unsave/${galleryId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to unsave gallery: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error unsaving gallery ${galleryId}:`, error);
      
      if (galleryId.startsWith('local_')) {
        const savedGalleries = localStorage.getItem('savedGalleries') || '[]';
        const saved = JSON.parse(savedGalleries);
        
        const index = saved.indexOf(galleryId);
        if (index > -1) {
          saved.splice(index, 1);
          localStorage.setItem('savedGalleries', JSON.stringify(saved));
        }
        
        return { message: 'Gallery unsaved in local storage', isSaved: false };
      }
      
      throw error;
    }
  },

  // Get artworks for the current user
  getUserArtworks: async function() {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/artworks/mine', {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch artworks: ${response.status}`);
      }
      
      const artworks = await response.json();
      console.log("Raw artworks from API:", artworks);
      
      // Process artworks to ensure proper structure and fields
      const processedArtworks = artworks.map(artwork => {
        const processedArtwork = { ...artwork };
        
        if (!processedArtwork.artist && processedArtwork.user) {
          if (typeof processedArtwork.user === 'object') {
            processedArtwork.artist = processedArtwork.user.displayName || 
                                     processedArtwork.user.fullName || 
                                     processedArtwork.user.username || 
                                     'Unknown Artist';
          }
        }
        
        // Dimensions handling
        if (!processedArtwork.width || !processedArtwork.height || 
            processedArtwork.width === 100 || processedArtwork.height === 100) {
          
          if (processedArtwork.dimensions && typeof processedArtwork.dimensions === 'string') {
            const dimensionMatch = processedArtwork.dimensions.match(/^(\d{1,3})x(\d{1,3})$/);
            if (dimensionMatch) {
              processedArtwork.width = parseInt(dimensionMatch[1], 10);
              processedArtwork.height = parseInt(dimensionMatch[2], 10);
              console.log(`Parsed dimensions for ${processedArtwork.title}: ${processedArtwork.width}x${processedArtwork.height}`);
            }
          }
        }
        
        if (!processedArtwork.url) {
          processedArtwork.url = processedArtwork.mainImageUrl || 
                                processedArtwork.mainImage || 
                                '../images/profileholder.png';
        }
        
        console.log(`Processed artwork: ${processedArtwork.title} by ${processedArtwork.artist} (${processedArtwork.width}x${processedArtwork.height})`);
        
        return processedArtwork;
      });
      
      return processedArtworks;
    } catch (error) {
      console.error("Error fetching artworks:", error);
      
      // Return mock artworks if API fails
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const currentUserName = currentUser.username || currentUser.displayName || currentUser.fullName || 'Demo Artist';
      
      return [
        {
          id: 'demo1',
          title: 'Sunset Landscape',
          artist: currentUserName,
          url: '../images/profileholder.png',
          width: 150,
          height: 100,
          dimensions: '150x100'
        },
        {
          id: 'demo2',
          title: 'Abstract Composition',
          artist: currentUserName,
          url: '../images/profileholder.png',
          width: 100,
          height: 120,
          dimensions: '100x120'
        },
        {
          id: 'demo3',
          title: 'Portrait Study',
          artist: currentUserName,
          url: '../images/profileholder.png',
          width: 80,
          height: 110,
          dimensions: '80x110'
        }
      ];
    }
  },
  
  // Create a new gallery
  createGallery: async function(galleryData) {
    try {
      const token = localStorage.getItem('token');
      
      // Validate gallery-data structure
      const processedArtworks = galleryData.artworks.map((artwork, index) => {
        // Generate a proper position on the wall for each artwork
        const wallIndex = index % 4; // Distribute across 4 walls
        let position = { x: 0, y: 1.5, z: 0 };
        let rotation = { x: 0, y: 0, z: 0 };
        
        switch (wallIndex) {
          case 0: 
            position = { x: (index - 1) * 1.5, y: 1.5, z: -2.4 };
            rotation = { x: 0, y: 0, z: 0 };
            break;
          case 1: 
            position = { x: -2.4, y: 1.5, z: (index - 1) * 1.5 };
            rotation = { x: 0, y: 90, z: 0 };
            break;
          case 2: 
            position = { x: 2.4, y: 1.5, z: (index - 1) * 1.5 };
            rotation = { x: 0, y: -90, z: 0 };
            break;
          case 3: 
            position = { x: (index - 1) * 1.5, y: 1.5, z: 2.4 };
            rotation = { x: 0, y: 180, z: 0 };
            break;
        }
        
        return {
          artworkId: artwork.artworkId || artwork.id || artwork._id,
          title: artwork.title || 'Untitled',
          artist: artwork.artist || 'Unknown Artist',
          url: artwork.url || artwork.mainImageUrl,
          width: artwork.width || 100,
          height: artwork.height || 100,
          dimensions: artwork.dimensions || `${artwork.width || 100}x${artwork.height || 100}`,
          position: position,
          rotation: rotation
        };
      });
      
      const requestData = {
        name: galleryData.name,
        description: galleryData.description || '',
        size: galleryData.size || 'medium',
        frameStyle: galleryData.frameStyle || 'gold',
        isPublic: galleryData.isPublic !== false,
        artworks: processedArtworks
      };
      
      console.log("Creating gallery with processed artwork data:", requestData);
      
      const response = await fetch('/api/galleries/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create gallery: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log("Gallery created successfully:", result);
      return result;
    } catch (error) {
      console.error("Error creating gallery:", error);
      
      // Fallback to localStorage if API fails
      try {
        const galleries = localStorage.getItem("userGalleries") || "[]";
        const parsedGalleries = JSON.parse(galleries);
        
        if (parsedGalleries.some(g => g.name === galleryData.name)) {
          throw new Error(`Gallery "${galleryData.name}" already exists in localStorage`);
        }
        
        // Create a new gallery with a local ID and proper artwork data
        const newGallery = {
          id: 'local_' + Date.now(),
          name: galleryData.name,
          description: galleryData.description || '',
          size: galleryData.size || 'medium',
          frameStyle: galleryData.frameStyle || 'gold',
          isPublic: galleryData.isPublic !== false,
          artworks: galleryData.artworks.map(artwork => ({
            id: artwork.id || artwork._id,
            title: artwork.title || 'Untitled',
            artist: artwork.artist || 'Unknown Artist',
            url: artwork.url || artwork.mainImageUrl,
            width: artwork.width || 100,
            height: artwork.height || 100,
            dimensions: artwork.dimensions || `${artwork.width || 100}x${artwork.height || 100}`
          })),
          createdAt: new Date().toISOString()
        };
        
        parsedGalleries.push(newGallery);
        localStorage.setItem("userGalleries", JSON.stringify(parsedGalleries));
        
        console.log(`Gallery "${galleryData.name}" created in localStorage with proper data`);
        return newGallery;
      } catch (localError) {
        console.error("Error creating gallery in localStorage:", localError);
        throw localError;
      }
    }
  },
  
  // Create a sample gallery for new users
  createSampleGallery: async function() {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn("No auth token available, cannot create sample gallery");
        return null;
      }
      
      let existingGalleries = [];
      try {
        existingGalleries = await this.getGalleries();
        
        // Check if a sample gallery already exists
        const hasSampleGallery = existingGalleries.some(gallery => 
          gallery.name === "Sample Gallery" || 
          gallery.id === 'sample1'
        );
        
        if (hasSampleGallery) {
          console.log("Sample gallery already exists, not creating another one");
          return null;
        }
        
        // If user has any galleries, don't create a sample
        if (existingGalleries.length > 0) {
          console.log("User already has galleries, not creating a sample gallery");
          return null;
        }
      } catch (err) {
        console.warn("Could not check existing galleries:", err);
      }
      
      // Get current user info
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const currentUserName = currentUser.username || currentUser.displayName || currentUser.fullName || 'Demo Artist';
      
      // Sample gallery data 
      const sampleGallery = {
        name: "Sample Gallery",
        description: "A demo gallery to show how it works",
        size: "medium",
        frameStyle: "gold",
        isPublic: true,
        artworks: [
          {
            title: "Sample Artwork 1",
            artist: currentUserName,
            url: "../images/profileholder.png",
            width: 120,
            height: 80,
            dimensions: "120x80",
            position: { x: -1, y: 1.5, z: -2 },
            rotation: { x: 0, y: 0, z: 0 }
          },
          {
            title: "Sample Artwork 2",
            artist: currentUserName,
            url: "../images/profileholder.png",
            width: 90,
            height: 100,
            dimensions: "90x100",
            position: { x: 1, y: 1.5, z: -2 },
            rotation: { x: 0, y: 0, z: 0 }
          }
        ]
      };
      
      const response = await fetch('/api/galleries/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sampleGallery)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create sample gallery: ${response.status}`);
      }
      
      console.log("Sample gallery created successfully");
      return await response.json();
    } catch (error) {
      console.error("Error creating sample gallery:", error);
      
      // Check localStorage 
      const galleries = localStorage.getItem("userGalleries");
      const parsedGalleries = galleries ? JSON.parse(galleries) : [];
    
      if (parsedGalleries.some(g => g.id === 'sample1')) {
        console.log("Sample gallery already exists locally");
        return null;
      }
      
      // Get current user info 
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const currentUserName = currentUser.username || currentUser.displayName || currentUser.fullName || 'Demo Artist';
      
      // Create local sample gallery
      const sampleGallery = {
        id: 'sample1',
        name: "Sample Gallery",
        size: "medium",
        frameStyle: "gold",
        artworks: [
          {
            id: 'demo1',
            title: "Sample Artwork 1",
            artist: currentUserName,
            url: "../images/profileholder.png",
            width: 120,
            height: 80,
            dimensions: "120x80"
          },
          {
            id: 'demo2',
            title: "Sample Artwork 2",
            artist: currentUserName,
            url: "../images/profileholder.png",
            width: 90,
            height: 100,
            dimensions: "90x100"
          }
        ],
        createdAt: new Date().toISOString()
      };
      
      parsedGalleries.push(sampleGallery);
      localStorage.setItem("userGalleries", JSON.stringify(parsedGalleries));
      console.log("Sample gallery created locally");
      
      return sampleGallery;
    }
  },

  // Delete a gallery
  deleteGallery: async function(galleryId) {
    if (!galleryId) {
      throw new Error("Gallery ID is required");
    }
    
    try {
      const token = localStorage.getItem('token');
      
      if (galleryId.startsWith('local_') || galleryId === 'sample1') {
        console.log(`Deleting local gallery: ${galleryId}`);
        const galleriesData = localStorage.getItem("userGalleries");
        if (galleriesData) {
          let galleries = JSON.parse(galleriesData);
          const initialCount = galleries.length;
          galleries = galleries.filter(gallery => {
            const id = gallery.id || gallery._id;
            return id !== galleryId;
          });
          
          if (galleries.length < initialCount) {
            localStorage.setItem("userGalleries", JSON.stringify(galleries));
            console.log(`Gallery ${galleryId} removed from localStorage`);
            
            // Also remove from saved galleries if exists
            try {
              const savedGalleriesData = localStorage.getItem("savedGalleries");
              if (savedGalleriesData) {
                let savedGalleries = JSON.parse(savedGalleriesData);
                savedGalleries = savedGalleries.filter(id => id !== galleryId);
                localStorage.setItem("savedGalleries", JSON.stringify(savedGalleries));
              }
            } catch (e) {
              console.error("Error updating saved galleries:", e);
            }
            
            return { message: 'Gallery deleted from localStorage' };
          } else {
            throw new Error("Gallery not found in localStorage");
          }
        } else {
          throw new Error("No galleries found in localStorage");
        }
      }
      
      // API
      console.log(`Deleting gallery from database: ${galleryId}`);
      const response = await fetch(`/api/galleries/${galleryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete gallery: ${response.status} - ${errorText}`);
      }
      
      console.log(`Gallery ${galleryId} deleted from database successfully`);
      return await response.json();
    } catch (error) {
      console.error(`Error deleting gallery ${galleryId}:`, error);
      throw error;
    }
  }
};

window.GalleryData = GalleryData;