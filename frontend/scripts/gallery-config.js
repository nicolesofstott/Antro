const GalleryConfig = {
    // Room size configurations
    roomSizes: {
      small: {
        size: 7,        
        height: 3,      
        artworkY: 1.5   
      },
      medium: {
        size: 10,
        height: 4,
        artworkY: 1.6
      },
      large: {
        size: 14,
        height: 5,
        artworkY: 1.7
      }
    },
    
    // Frame style colors and settings
    frameStyles: {
      gold: {
        color: "#AC9362",
        metalness: 0.2,
        roughness: 0.7
      },
      black: {
        color: "#111111",
        metalness: 0.1,
        roughness: 0.9
      },
      white: {
        color: "#f8f8f8",
        metalness: 0.0,
        roughness: 0.9
      },
      natural: {
        color: "#a98467",
        metalness: 0.1,
        roughness: 0.8
      }
    },
    
    // Material configurations
    materials: {
      floor: "color: #AC9362; roughness: 0.95; metalness: 0",
      walls: "color: #ffffff; roughness: 1; metalness: 0; side: double",
      ceiling: "color: #f2f0ef; roughness: 1; metalness: 0; side: double"
    },
    
    // Artwork display settings
    artwork: {
      maxWidth: 3.0,       
      maxHeight: 2.5,       
      panoramicRatio: 2.0, 
      portraitRatio: 0.7,  
      framePadding: 0.02,    
      frameThickness: 0.05,  
      frameDepth: 0.03,     
      defaultWidth: 100,    
      defaultHeight: 150    
    },
    
    // Default paths
    paths: {
      images: "images/",
      placeholder: "images/placeholder.png"
    },
    
    // Lighting settings
    lighting: {
      ambient: {
        intensity: 0.5,
        color: "#ffffff"
      },
      directional: [
        {
          position: "1 1 1",
          intensity: 0.6,
          color: "#ffffff"
        },
        {
          position: "-1 1 1",
          intensity: 0.4,
          color: "#ffffff"
        }
      ],
      spotlight: {
        intensity: 0.3,
        distance: 5,
        angle: 30,
        penumbra: 0.2,
        color: "#ffffff"
      }
    },
    
    ui: {
      instructionsFadeTime: 5000,  
      instructionsOpacity: 0.7,   
      backButtonPosition: "20px 20px", 
      instructionsPosition: "bottom center" 
    }
  };