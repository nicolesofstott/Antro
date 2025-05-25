// Gallery configuration module
const GalleryConfig = {
  defaultSettings: {
    size: 'medium',
    frameStyle: 'gold',
    isPublic: true
  },
  
  // Gallery size options 
  sizes: {
    small: {
      roomWidth: 3,
      roomHeight: 3,
      wallHeight: 2.5,
      maxArtworks: 4,
      size: 3,
      height: 2.5
    },
    medium: {
      roomWidth: 5,
      roomHeight: 5,
      wallHeight: 3,
      maxArtworks: 8,
      size: 5, 
      height: 3
    },
    large: {
      roomWidth: 7,
      roomHeight: 7,
      wallHeight: 3.5,
      maxArtworks: 12,
      size: 7, 
      height: 3.5
    }
  },
  
  // Frame style options with material textures
  frameStyles: {
    gold: {
      color: '#b4a053',
      material: 'metallic',
      width: 0.05
    },
    black: {
      color: '#222222',
      material: 'matte',
      width: 0.04
    },
    white: {
      color: '#f8f8f8',
      material: 'matte',
      width: 0.04
    },
    natural: {
      color: '#96673b',
      material: 'wood',
      width: 0.06
    }
  },
  
  // Wall colours
  wallColors: {
    default: '#f0f0f0',
    floor: '#d6d6d6',
    ceiling: '#ffffff'
  },
  
  // Calculate artwork placement based on gallery size and selected artworks
  calculateArtworkPlacements: function(gallerySize, artworks) {
    const sizeConfig = this.sizes[gallerySize] || this.sizes.medium;
    const { roomWidth, wallHeight } = sizeConfig;
    
    const wallLength = roomWidth - 0.5;
    
    const placements = [];
    const artworksPerWall = Math.ceil(artworks.length / 4); 
    
    artworks.forEach((artwork, index) => {
      const wallIndex = Math.floor(index / artworksPerWall);
      const positionOnWall = (index % artworksPerWall) / (artworksPerWall > 1 ? artworksPerWall - 1 : 1);
      
      // Scale artwork
      let width = artwork.width || 100;
      let height = artwork.height || 100;
      const maxDimension = wallHeight * 0.8;
      
      if (width > height && width > maxDimension) {
        const scale = maxDimension / width;
        width = maxDimension;
        height *= scale;
      } else if (height > width && height > maxDimension) {
        const scale = maxDimension / height;
        height = maxDimension;
        width *= scale;
      }
      
      const widthInMeters = width / 100;
      const heightInMeters = height / 100;
      
      // Calculate position and rotation based on wall index
      let position, rotation;
      
      switch (wallIndex) {
        case 0: 
          position = {
            x: -wallLength / 2 + wallLength * positionOnWall,
            y: wallHeight / 2,
            z: -wallLength / 2
          };
          rotation = { x: 0, y: 0, z: 0 };
          break;
        case 1: 
          position = {
            x: wallLength / 2,
            y: wallHeight / 2,
            z: -wallLength / 2 + wallLength * positionOnWall
          };
          rotation = { x: 0, y: -90, z: 0 };
          break;
        case 2: 
          position = {
            x: wallLength / 2 - wallLength * positionOnWall,
            y: wallHeight / 2,
            z: wallLength / 2
          };
          rotation = { x: 0, y: 180, z: 0 };
          break;
        case 3: 
          position = {
            x: -wallLength / 2,
            y: wallHeight / 2,
            z: wallLength / 2 - wallLength * positionOnWall
          };
          rotation = { x: 0, y: 90, z: 0 };
          break;
        default:
          position = {
            x: -wallLength / 2 + wallLength * Math.random(),
            y: wallHeight / 2,
            z: -wallLength / 2
          };
          rotation = { x: 0, y: 0, z: 0 };
      }
      
      placements.push({
        artworkId: artwork.id || artwork._id,
        title: artwork.title || 'Untitled',
        artist: artwork.artist || 'Unknown Artist',
        url: artwork.url || artwork.mainImageUrl,
        width: widthInMeters,
        height: heightInMeters,
        position,
        rotation
      });
    });
    
    return placements;
  },
  
  // Add a mockup gallery data function for when GalleryData isn't available
  mockGalleryData: function(name) {
    return {
      name: name || "Mock Gallery",
      size: "medium",
      frameStyle: "gold",
      artworks: [
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
        }
      ]
    };
  }
};

window.GalleryConfig = GalleryConfig;