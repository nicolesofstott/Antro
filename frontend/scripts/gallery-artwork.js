function scaleArtwork(placeholder, artwork, wall) {
    console.log(`Scaling artwork: ${artwork.title || 'untitled'}, Wall: ${wall}`);
    
    let widthCm, heightCm;
    
    // Parse from dimensions string first (most reliable source)
    if (artwork.dimensions && typeof artwork.dimensions === 'string') {
        const parts = artwork.dimensions.split('x');
        if (parts.length === 2) {
            widthCm = parseFloat(parts[0]);
            heightCm = parseFloat(parts[1]);
            console.log(`Parsed from dimensions string: ${widthCm}x${heightCm} cm`);
        }
    } 

    else if (artwork.width && artwork.height) {
        widthCm = parseFloat(artwork.width);
        heightCm = parseFloat(artwork.height);
        console.log(`Using direct dimensions: ${widthCm}x${heightCm} cm`);
    }
    
    if (!widthCm || !heightCm || isNaN(widthCm) || isNaN(heightCm) || widthCm <= 0 || heightCm <= 0) {
        console.warn(`Invalid dimensions for artwork "${artwork.title || 'untitled'}". Using defaults.`);
        widthCm = 100;
        heightCm = 100;
    }
    
    const aspectRatio = widthCm / heightCm;
    
    console.log(`Original dimensions: ${widthCm}x${heightCm} cm, Aspect Ratio: ${aspectRatio.toFixed(2)}`);
    
    // Convert to meters for VR scaling
    const widthM = widthCm / 100;
    const heightM = heightCm / 100;
    
    console.log(`Converted to meters: ${widthM.toFixed(2)}x${heightM.toFixed(2)} m`);
    
    // Set appropriate VR world size limits
    const MAX_WIDTH = 3.0;    
    const MAX_HEIGHT = 2.0;   
    const MIN_SIZE = 0.5;     
    
    let vrWidth, vrHeight;
    
    // Use true-to-life scaling (use the actual meter dimensions)
    vrWidth = widthM;
    vrHeight = heightM;
    
    if (vrWidth > MAX_WIDTH) {
        const scale = MAX_WIDTH / vrWidth;
        vrWidth = MAX_WIDTH;
        vrHeight *= scale;
    }
    
    if (vrHeight > MAX_HEIGHT) {
        const scale = MAX_HEIGHT / vrHeight;
        vrHeight = MAX_HEIGHT;
        vrWidth *= scale;
    }
    
    if (vrWidth < MIN_SIZE && vrHeight < MIN_SIZE) {
        const scale = MIN_SIZE / Math.max(vrWidth, vrHeight);
        vrWidth *= scale;
        vrHeight *= scale;
    }
    
    // Adjust scale based on wall location 
    if (wall === 'left' || wall === 'right') {
        vrWidth *= 0.9;
        vrHeight *= 0.9;
    }
    
    console.log(`VR dimensions: ${vrWidth.toFixed(2)}x${vrHeight.toFixed(2)} m`);
    
    placeholder.setAttribute('width', vrWidth);
    placeholder.setAttribute('height', vrHeight);
    
    placeholder.setAttribute('data-wall', wall);
    placeholder.setAttribute('data-aspect-ratio', aspectRatio);
    
    return { 
        width: vrWidth, 
        height: vrHeight,
        aspectRatio: aspectRatio
    };
}

// Single function to add frames to artwork
function addFrameToArtwork(placeholder, frameStyle, dimensions, artwork) {
    console.log(`Adding ${frameStyle} frame to: ${artwork.title || 'untitled'}`);
    
    const defaultFrameStyles = {
      'gold': { color: '#d4af37', width: 0.05 },
      'black': { color: '#222222', width: 0.04 },
      'white': { color: '#f8f8f8', width: 0.04 },
      'natural': { color: '#a98467', width: 0.06 }
    };
  
    const config = window.GalleryConfig || {};
    const frameStylesConfig = config.frameStyles || defaultFrameStyles;
    const frameStyleConfig = frameStylesConfig[frameStyle] || frameStylesConfig.gold || defaultFrameStyles.gold;
    
    const frameColor = frameStyleConfig.color || defaultFrameStyles[frameStyle]?.color || '#d4af37';
    const frameThickness = frameStyleConfig.width || defaultFrameStyles[frameStyle]?.width || 0.05;
    
    const frame = document.createElement('a-entity');
    frame.className = 'artwork-frame';

    const position = placeholder.getAttribute('position');
    const rotation = placeholder.getAttribute('rotation');
    const wall = placeholder.getAttribute('data-wall') || 'back';

    // Make sure dimensions are defined
    if (!dimensions || typeof dimensions !== 'object') {
      dimensions = { width: 1.2, height: 1.2 };
      console.warn(`Frame dimensions were undefined for ${artwork.title || 'untitled'}, using defaults`);
    }

    // Frame dimensions should be slightly larger than the artwork
    const frameWidth = dimensions.width + (frameThickness * 2);
    const frameHeight = dimensions.height + (frameThickness * 2);
    const depth = 0.02; 

    // Clone position to avoid modifying original object
    let framePosition = { ...position };
    let artworkPosition = { ...position };
    
    // Adjust frame position based on which wall the artwork is on
    if (wall === 'left') {
      framePosition.x = position.x - depth;
      artworkPosition.x = position.x + depth/2;
    } else if (wall === 'right') {
      framePosition.x = position.x + depth;
      artworkPosition.x = position.x - depth/2;
    } else if (wall === 'back') {
      framePosition.z = position.z - depth;
      artworkPosition.z = position.z + depth/2;
    } else if (wall === 'front') {
      framePosition.z = position.z + depth;
      artworkPosition.z = position.z - depth/2;
    }

    frame.setAttribute('position', framePosition);
    frame.setAttribute('rotation', rotation);

    frame.setAttribute('geometry', `primitive: box; width: ${frameWidth}; height: ${frameHeight}; depth: ${depth}`);
    frame.setAttribute('material', `color: ${frameColor}`);

    // Add frame to scene
    placeholder.parentNode.appendChild(frame);

    placeholder.frameElement = frame;

    placeholder.setAttribute('position', artworkPosition);
    
    console.log(`Frame added: width=${frameWidth.toFixed(2)}, height=${frameHeight.toFixed(2)}, color=${frameColor}`);
}
  
// Add artwork label
function addArtworkLabel(placeholder, artwork, dimensions) {
    console.log(`Adding label for: ${artwork.title || 'untitled'}`);
    
    const label = document.createElement('a-entity');
    label.className = 'artwork-label';
    
    const position = placeholder.getAttribute('position');
    const rotation = placeholder.getAttribute('rotation');
    
    const title = artwork?.title || 'Untitled';
    const artist = artwork?.artist || 'Unknown Artist';
    const labelText = `${title}\n${artist}`;
    
    if (!dimensions || typeof dimensions !== 'object') {
      dimensions = { width: 1.2, height: 1.2 };
      console.warn(`Label dimensions were undefined for ${title}, using defaults`);
    }
    
    const labelY = position.y - (dimensions.height / 2) - 0.15;
    
    // Set label text and attributes
    label.setAttribute('text', `value: ${labelText}; align: center; width: ${dimensions.width + 0.2}; color: #333333; side: double; wrapCount: 30`);
    
    // Set label position and rotation
    label.setAttribute('position', {
      x: position.x,
      y: labelY,
      z: position.z
    });
    label.setAttribute('rotation', rotation);
    
    placeholder.parentNode.appendChild(label);
    
    placeholder.labelElement = label;
    
    console.log(`Label added at y=${labelY.toFixed(2)}`);
}

window.scaleArtwork = scaleArtwork;
window.addFrameToArtwork = addFrameToArtwork;
window.addArtworkLabel = addArtworkLabel;