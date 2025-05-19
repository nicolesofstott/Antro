const GalleryData = (function() {
  const config = {
    backendBase: "http://localhost:5050",
    storageKeys: {
      GALLERIES: 'userGalleries',
      USER: 'user',
      TOKEN: 'token'
    }
  };


  function getAuthToken() {
    return localStorage.getItem(config.storageKeys.TOKEN);
  }


  function getUserInfo() {
    const userData = localStorage.getItem(config.storageKeys.USER);
    return userData ? JSON.parse(userData) : null;
  }

  async function callApi(endpoint, options = {}) {
    const token = getAuthToken();
    
    if (!token) {
      console.warn("No authentication token found");
      throw new Error("Authentication required");
    }
    
    const url = `${config.backendBase}${endpoint}`;
    
    // Add authentication headers
    const headers = {
      ...options.headers,
      "Authorization": `Bearer ${token}`
    };
    
    if (options.body && !headers['Content-Type'] && 
        (options.method === 'POST' || options.method === 'PUT')) {
      headers['Content-Type'] = 'application/json';
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.error("Authentication failed");
          throw new Error("Authentication failed");
        }
        
        const errorText = await response.text();
        let errorMessage = `API error: ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      return response;
    } catch (error) {
      console.error(`API error (${endpoint}):`, error);
      throw error;
    }
  }

  async function fetchGalleriesFromBackend() {
    try {
      const response = await callApi('/api/galleries/mine');
      const galleries = await response.json();
      
      localStorage.setItem(config.storageKeys.GALLERIES, JSON.stringify(galleries));
      
      return galleries;
    } catch (error) {
      console.error("Error fetching galleries from backend:", error);
      
      return getGalleriesFromLocalStorage();
    }
  }

  function getGalleriesFromLocalStorage() {
    const data = localStorage.getItem(config.storageKeys.GALLERIES);
    return data ? JSON.parse(data) : [];
  }

  async function getGalleries() {
    try {
      return await fetchGalleriesFromBackend();
    } catch (error) {
      console.warn("Falling back to localStorage for galleries");
      return getGalleriesFromLocalStorage();
    }
  }

  async function createGalleryOnBackend(galleryData) {
    try {
      const response = await callApi('/api/galleries/create', {
        method: 'POST',
        body: JSON.stringify(galleryData)
      });
      
      const createdGallery = await response.json();
      
      // Update local cache
      const galleries = getGalleriesFromLocalStorage();
      galleries.push(createdGallery.gallery || createdGallery);
      localStorage.setItem(config.storageKeys.GALLERIES, JSON.stringify(galleries));
      
      return createdGallery.gallery || createdGallery;
    } catch (error) {
      console.error("Error creating gallery on backend:", error);
      throw error;
    }
  }

  function createGalleryInLocalStorage(galleryData) {
    if (!galleryData.name) {
      throw new Error('Gallery must have a name');
    }
    
    const galleries = getGalleriesFromLocalStorage();
    
    // Check if gallery with this name already exists
    if (galleries.some(g => g.name === galleryData.name)) {
      throw new Error(`Gallery "${galleryData.name}" already exists`);
    }
    
    // Create the new gallery object
    const newGallery = {
      name: galleryData.name,
      size: galleryData.size || 'medium',
      frameStyle: galleryData.frameStyle || 'gold',
      artworks: galleryData.artworks || [],
      createdAt: new Date().toISOString()
    };
    
    // Add to galleries and save
    galleries.push(newGallery);
    localStorage.setItem(config.storageKeys.GALLERIES, JSON.stringify(galleries));
    
    console.log(`Gallery "${newGallery.name}" created locally with ${newGallery.artworks.length} artworks`);
    return newGallery;
  }

  async function createGallery(galleryData) {
    try {
      return await createGalleryOnBackend(galleryData);
    } catch (error) {
      console.warn("Falling back to localStorage for gallery creation:", error.message);
      return createGalleryInLocalStorage(galleryData);
    }
  }

  async function getGallery(galleryName) {
    const galleries = await getGalleries();
    return galleries.find(g => g.name === galleryName) || null;
  }

  async function fetchUserArtworksFromBackend() {
    try {
      const response = await callApi('/api/artworks/mine');
      return await response.json();
    } catch (error) {
      console.error("Error fetching artworks from backend:", error);
      throw error;
    }
  }

  function getMockArtworks() {
    console.log("Using mock artworks");
    return [
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
      }
    ];
  }

  async function getUserArtworks() {
    try {
      const artworks = await fetchUserArtworksFromBackend();
      
      // Transform API artworks to the format expected by the gallery
      return artworks.map(art => ({
        id: art._id,
        title: art.title || "Untitled",
        artist: getUserInfo()?.displayName || "Artist Name",
        url: art.mainImageUrl || art.mainImage || "../images/profileholder.png",
        width: art.dimensions ? parseInt(art.dimensions.split('x')[0]) : 100,
        height: art.dimensions ? parseInt(art.dimensions.split('x')[1]) : 100
      }));
    } catch (error) {
      console.warn("Falling back to mock artworks:", error.message);
      return getMockArtworks();
    }
  }

  async function createSampleGallery() {
    const galleries = await getGalleries();
    
    if (galleries.length === 0) {
      console.log("Creating sample gallery for first-time user");
      
      try {
        const artworks = await getUserArtworks();
        const sampleArtworks = artworks.slice(0, 3);
        
        await createGallery({
          name: 'Sample Gallery',
          size: 'medium',
          frameStyle: 'gold',
          artworks: sampleArtworks
        });
        
        console.log("Sample gallery created successfully");
      } catch (error) {
        console.error("Error creating sample gallery:", error);
      }
    }
  }

  // Return public API
  return {
    getGalleries,
    getGallery,
    createGallery,
    getUserArtworks,
    createSampleGallery,
    backendBase: config.backendBase
  };
})();

window.GalleryData = GalleryData;