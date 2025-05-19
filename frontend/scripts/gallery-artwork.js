function scaleArtwork(placeholder, artwork, wall) {
    // Get artwork dimensions with fallbacks
    const width = Number(artwork.width) || 100;
    const height = Number(artwork.height) || 100;
    
    const aspectRatio = width / height;
    
    // Set maximum dimensions from config or use sensible defaults
    const config = window.GalleryConfig || {};
    const artworkConfig = config.artwork || {};
    const maxWidth = artworkConfig.maxWidth || 1.5;
    const maxHeight = artworkConfig.maxHeight || 1.2;
    
    // Determine if this is on a side wall
    const isSideWall = wall === 'left' || wall === 'right';
    
    // Helps when the dimension values don't match the actual image proportions
    const isAspectRatioExtreme = aspectRatio > 2.5 || aspectRatio < 0.4;
    const isLikelyFlipped = isAspectRatioExtreme && 
                           ((aspectRatio > 1 && artwork.url && artwork.url.includes('london')) || 
                            (aspectRatio < 1 && artwork.title && artwork.title.toLowerCase().includes('landscape')));
    const effectiveAspectRatio = isLikelyFlipped ? (1 / aspectRatio) : aspectRatio;
    
    console.log(`Artwork: ${artwork.title}, Dimensions: ${width}x${height}, Aspect Ratio: ${aspectRatio.toFixed(2)}`);
    if (isLikelyFlipped) {
      console.log(`Detected likely flipped dimensions, using corrected ratio: ${effectiveAspectRatio.toFixed(2)}`);
    }
    
    let scaledWidth, scaledHeight;
    
    // Standard scaling for all walls
    if (effectiveAspectRatio > 1) {
        // Landscape orientation
        scaledWidth = Math.min(maxWidth, maxHeight * effectiveAspectRatio);
        scaledHeight = scaledWidth / effectiveAspectRatio;
    } else {
        // Portrait orientation
        scaledHeight = Math.min(maxHeight, maxWidth / effectiveAspectRatio);
        scaledWidth = scaledHeight * effectiveAspectRatio;
    }  
    // Apply dimensions to the placeholder
    if (isLikelyFlipped) {
      placeholder.setAttribute('width', scaledHeight);
      placeholder.setAttribute('height', scaledWidth);
      console.log(`Applied swapped dimensions: width=${scaledHeight}, height=${scaledWidth}`);
    } else {
      placeholder.setAttribute('width', scaledWidth);
      placeholder.setAttribute('height', scaledHeight);
    }
    
    // Store the wall position
    placeholder.setAttribute('data-wall', wall);
    
    placeholder.addEventListener('loaded', function() {
      console.log(`Image for ${artwork.title} loaded successfully`);
    });
    
    return isLikelyFlipped ? 
      { width: scaledHeight, height: scaledWidth } : 
      { width: scaledWidth, height: scaledHeight };
  }
  
  // Single function to add frames to artwork
  function addFrameToArtwork(placeholder, frameStyle, dimensions, artwork) {
    const config = window.GalleryConfig || {};
    const frameStylesConfig = config.frameStyles || {};
    const frameStyleConfig = frameStylesConfig[frameStyle] || {};
    
    const frameColor = frameStyleConfig.color || 
      {
        'gold': '#d4af37',
        'black': '#222222',
        'white': '#f8f8f8',
        'natural': '#a98467'
      }[frameStyle] || '#d4af37';
    
    const frame = document.createElement('a-entity');
    frame.className = 'artwork-frame';

    const position = placeholder.getAttribute('position');
    const rotation = placeholder.getAttribute('rotation');
    const wall = placeholder.getAttribute('data-wall') || 'back';

    const frameWidth = dimensions.width + 0.1;
    const frameHeight = dimensions.height + 0.1;

    let framePosition = { ...position };
    let artworkPosition = { ...position };
    
    const depth = 0.02; 
    
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

    frame.setAttribute('geometry', `primitive: box; width: ${frameWidth}; height: ${frameHeight}; depth: 0.03`);
    frame.setAttribute('material', `color: ${frameColor}`);

    placeholder.parentNode.appendChild(frame);

    placeholder.frameElement = frame;

    placeholder.setAttribute('position', artworkPosition);
  }
  
  // Add artwork label
  function addArtworkLabel(placeholder, artwork, dimensions) {
    const label = document.createElement('a-entity');
    label.className = 'artwork-label';
    
    const position = placeholder.getAttribute('position');
    const rotation = placeholder.getAttribute('rotation');
    const wall = placeholder.getAttribute('data-wall') || 'back';
    
    const title = artwork.title || 'Untitled';
    const artist = artwork.artist || 'Unknown Artist';
    const labelText = `${title}\n${artist}`;
    
    const labelY = position.y - (dimensions.height / 2) - 0.15;
    
    label.setAttribute('text', `value: ${labelText}; align: center; width: ${dimensions.width + 0.2}; color: #333333; side: double`);
    
    label.setAttribute('position', {
      x: position.x,
      y: labelY,
      z: position.z
    });
    label.setAttribute('rotation', rotation);
    
    placeholder.parentNode.appendChild(label);
    
    placeholder.labelElement = label;
  }
  
  