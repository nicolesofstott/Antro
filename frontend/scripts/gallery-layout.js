
function resizeRoom(roomSize) {
    console.log(`Resizing room to ${roomSize} size`);
    
    // Get configuration for the specified room size
    const config = GalleryConfig.roomSizes[roomSize] || GalleryConfig.roomSizes.medium;
    const size = config.size || 7; // Default size if not specified
    const height = config.height || 3; // Default height
    const wallPos = size / 2; // Wall distance from center
    
    // Get room elements by ID (more reliable than position selectors)
    const floor = document.getElementById('floor') || document.querySelector('a-box[position="0 -0.05 0"]');
    const ceiling = document.getElementById('ceiling') || document.querySelector('a-box[position="0 3.05 0"]');
    const backWall = document.getElementById('back-wall');
    const frontWall = document.getElementById('front-wall');
    const leftWall = document.getElementById('left-wall');
    const rightWall = document.getElementById('right-wall');
    
    // Resize floor and ceiling
    if (floor) {
      floor.setAttribute('width', size);
      floor.setAttribute('depth', size);
    }
    
    if (ceiling) {
      ceiling.setAttribute('width', size);
      ceiling.setAttribute('depth', size);
    }
    
    // Resize and reposition walls based on their element type
    if (backWall) {
      if (backWall.tagName.toLowerCase() === 'a-plane') {
        backWall.setAttribute('width', size);
        backWall.setAttribute('height', height);
      } else {
        backWall.setAttribute('width', size);
      }
      backWall.setAttribute('position', {x: 0, y: 1.5, z: -wallPos});
    }
    
    if (frontWall) {
      if (frontWall.tagName.toLowerCase() === 'a-plane') {
        frontWall.setAttribute('width', size);
        frontWall.setAttribute('height', height);
      } else {
        frontWall.setAttribute('width', size);
      }
      frontWall.setAttribute('position', {x: 0, y: 1.5, z: wallPos});
    }
    
    if (leftWall) {
      if (leftWall.tagName.toLowerCase() === 'a-plane') {
        leftWall.setAttribute('width', size); // For a-plane, width is front to back when rotated
        leftWall.setAttribute('height', height);
      } else {
        leftWall.setAttribute('depth', size);
      }
      leftWall.setAttribute('position', {x: -wallPos, y: 1.5, z: 0});
    }
    
    if (rightWall) {
      if (rightWall.tagName.toLowerCase() === 'a-plane') {
        rightWall.setAttribute('width', size); // For a-plane, width is front to back when rotated
        rightWall.setAttribute('height', height);
      } else {
        rightWall.setAttribute('depth', size);
      }
      rightWall.setAttribute('position', {x: wallPos, y: 1.5, z: 0});
    }
    
    // Update baseboards
    document.querySelectorAll('.baseboard, a-box[position*="0.1"]').forEach(element => {
      const position = element.getAttribute('position');
      if (!position) return; // Skip if position is undefined
      
      const x = typeof position === 'object' ? position.x : parseFloat(position.split(' ')[0]);
      const y = typeof position === 'object' ? position.y : parseFloat(position.split(' ')[1]);
      const z = typeof position === 'object' ? position.z : parseFloat(position.split(' ')[2]);
      
      if (Math.abs(z) > 3) {
        element.setAttribute('width', size);
        const newZ = z > 0 ? wallPos - 0.05 : -wallPos + 0.05;
        element.setAttribute('position', {x: 0, y: y, z: newZ});
      } else if (Math.abs(x) > 3) {
        element.setAttribute('depth', size);
        const newX = x > 0 ? wallPos - 0.05 : -wallPos + 0.05;
        element.setAttribute('position', {x: newX, y: y, z: 0});
      }
    });
    
    // Update crown moldings
    document.querySelectorAll('.crown-molding, a-box[position*="2.95"]').forEach(element => {
      const position = element.getAttribute('position');
      if (!position) return; // Skip if position is undefined
      
      const x = typeof position === 'object' ? position.x : parseFloat(position.split(' ')[0]);
      const y = typeof position === 'object' ? position.y : parseFloat(position.split(' ')[1]);
      const z = typeof position === 'object' ? position.z : parseFloat(position.split(' ')[2]);
  
      if (Math.abs(z) > 3) {
        element.setAttribute('width', size);
        const newZ = z > 0 ? wallPos - 0.05 : -wallPos + 0.05;
        element.setAttribute('position', {x: 0, y: y, z: newZ});
      } else if (Math.abs(x) > 3) {
        element.setAttribute('depth', size);
        const newX = x > 0 ? wallPos - 0.05 : -wallPos + 0.05;
        element.setAttribute('position', {x: newX, y: y, z: 0});
      }
    });
    
    console.log(`Room resized to ${size}x${size} units`);
    return size / 7; 
  }
  
/**
 * Calculate optimal positions for artworks on each wall
 * @param {Array} artworks - Artwork objects to position
 * @param {string} roomSize - Size option (small, medium, large)
 * @returns {Array} Wall positions for artworks
 */
function calculateOptimalPositions(artworks, roomSize) {
    // Initialize walls array
    const galleryWalls = [
      { name: 'back', positions: [] },
      { name: 'left', positions: [] },
      { name: 'right', positions: [] },
      { name: 'front', positions: [] }
    ];
    
    // Get room configuration
    const config = GalleryConfig.roomSizes[roomSize] || GalleryConfig.roomSizes.medium;
    const size = config.size || 7; 
    const wallPos = size / 2;
    
    const height = config.artworkY || 1.5;
    
    // Wall coordinates with proper offset to place artworks ON the walls
    // Add precise offsets to ensure artworks are positioned correctly on walls
    const WALL_THICKNESS = 0.1;
    const backWallZ = -wallPos + (WALL_THICKNESS / 2) + 0.06;  // Increased offset
    const frontWallZ = wallPos - (WALL_THICKNESS / 2) - 0.06;  // Increased offset
    const leftWallX = -wallPos + (WALL_THICKNESS / 2) + 0.06;  // Increased offset
    const rightWallX = wallPos - (WALL_THICKNESS / 2) - 0.06;  // Increased offset
    
    // How many artworks to place on each wall
    const totalArtworks = artworks.length;
    let artworksPerWall = {};
    
    // Distribute artworks across walls
    if (totalArtworks <= 4) {
      artworksPerWall = {
        back: Math.min(1, totalArtworks),
        left: totalArtworks > 1 ? 1 : 0,
        right: totalArtworks > 2 ? 1 : 0,
        front: totalArtworks > 3 ? 1 : 0
      };
    } else if (totalArtworks <= 8) {
      artworksPerWall = {
        back: Math.min(2, totalArtworks),
        left: totalArtworks > 2 ? Math.min(2, totalArtworks - 2) : 0,
        right: totalArtworks > 4 ? Math.min(2, totalArtworks - 4) : 0,
        front: totalArtworks > 6 ? Math.min(2, totalArtworks - 6) : 0
      };
    } else {
      artworksPerWall = {
        back: Math.min(3, totalArtworks),
        left: totalArtworks > 3 ? Math.min(3, totalArtworks - 3) : 0,
        right: totalArtworks > 6 ? Math.min(3, totalArtworks - 6) : 0,
        front: totalArtworks > 9 ? Math.min(3, totalArtworks - 9) : 0
      };
    }
    
    console.log(`Artwork distribution: Back=${artworksPerWall.back}, Left=${artworksPerWall.left}, Right=${artworksPerWall.right}, Front=${artworksPerWall.front}`);
    
    // Scale factor for spacing (based on room size)
    const scale = size / 7;
    
    // Calculate optimal positions for each wall
    Object.keys(artworksPerWall).forEach(wall => {
      const count = artworksPerWall[wall];
      
      if (count === 0) return;
      
      if (count === 1) {
        // Single artwork centered on wall
        if (wall === 'back') {
          galleryWalls[0].positions.push([0, height, backWallZ]);
        } else if (wall === 'left') {
          galleryWalls[1].positions.push([leftWallX, height, 0]);
        } else if (wall === 'right') {
          galleryWalls[2].positions.push([rightWallX, height, 0]);
        } else if (wall === 'front') {
          galleryWalls[3].positions.push([0, height, frontWallZ]);
        }
      } else if (count === 2) {
        // Two artworks with scaled spacing
        const spacing = 1.5 * scale; // Reduced spacing to prevent overlaps
        
        if (wall === 'back') {
          galleryWalls[0].positions.push([-spacing, height, backWallZ]);
          galleryWalls[0].positions.push([spacing, height, backWallZ]);
        } else if (wall === 'left') {
          galleryWalls[1].positions.push([leftWallX, height, -spacing]);
          galleryWalls[1].positions.push([leftWallX, height, spacing]);
        } else if (wall === 'right') {
          galleryWalls[2].positions.push([rightWallX, height, -spacing]);
          galleryWalls[2].positions.push([rightWallX, height, spacing]);
        } else if (wall === 'front') {
          galleryWalls[3].positions.push([-spacing, height, frontWallZ]);
          galleryWalls[3].positions.push([spacing, height, frontWallZ]);
        }
      } else {
        // Three artworks with scaled spacing
        const spacing = 2.0 * scale; // Reduced spacing to prevent overlaps
        
        if (wall === 'back') {
          galleryWalls[0].positions.push([-spacing, height, backWallZ]);
          galleryWalls[0].positions.push([0, height, backWallZ]);
          galleryWalls[0].positions.push([spacing, height, backWallZ]);
        } else if (wall === 'left') {
          galleryWalls[1].positions.push([leftWallX, height, -spacing]);
          galleryWalls[1].positions.push([leftWallX, height, 0]);
          galleryWalls[1].positions.push([leftWallX, height, spacing]);
        } else if (wall === 'right') {
          galleryWalls[2].positions.push([rightWallX, height, -spacing]);
          galleryWalls[2].positions.push([rightWallX, height, 0]);
          galleryWalls[2].positions.push([rightWallX, height, spacing]);
        } else if (wall === 'front') {
          galleryWalls[3].positions.push([-spacing, height, frontWallZ]);
          galleryWalls[3].positions.push([0, height, frontWallZ]);
          galleryWalls[3].positions.push([spacing, height, frontWallZ]);
        }
      }
    });
    
    return galleryWalls;
  }
  
/**
 * Distribute artworks to the calculated wall positions
 * @param {Array} placements - Initial artwork placement objects
 * @param {Array} galleryWalls - Calculated wall positions
 * @param {Array} placeholders - Placeholder elements for artworks
 * @returns {Array} Updated artwork placements
 */
function redistributeArtworksToWalls(placements, galleryWalls, placeholders) {
    console.log("Redistributing artworks to walls");
    
    // Flatten wall positions into a single array
    let allPositions = [];
    let wallMap = {};
    
    galleryWalls.forEach((wall, wallIndex) => {
      wall.positions.forEach((pos, posIndex) => {
        allPositions.push(pos);
        // Map this position to its wall and position index
        wallMap[allPositions.length - 1] = { wall: wallIndex, position: posIndex };
      });
    });
    
    // Calculate total available positions
    const totalPositions = allPositions.length;
    
    // If we have more artworks than positions, limit to available positions
    const validPlacements = placements.slice(0, Math.min(placements.length, totalPositions));
    
    // Assign artworks to positions with specific rotations for each wall
    validPlacements.forEach((placement, index) => {
      // Get the corresponding wall and position
      const posIndex = index % totalPositions;
      const position = allPositions[posIndex];
      const wallInfo = wallMap[posIndex];
      
      // Set position attributes on the placeholder
      if (placement.placeholder) {
        placement.placeholder.setAttribute('position', {
          x: position[0],
          y: position[1],
          z: position[2]
        });
        
        // Set rotation based on wall
        let rotation = { x: 0, y: 0, z: 0 };
        
        if (wallInfo) {
          switch (wallInfo.wall) {
            case 0: // back wall
              rotation = { x: 0, y: 0, z: 0 };
              break;
            case 1: // left wall
              rotation = { x: 0, y: 90, z: 0 };
              break;
            case 2: // right wall
              rotation = { x: 0, y: -90, z: 0 };
              break;
            case 3: // front wall
              rotation = { x: 0, y: 180, z: 0 };
              break;
          }
        }
        
        placement.placeholder.setAttribute('rotation', rotation);
      }
    });
    
    // Track used positions to avoid overlaps
    const usedPositions = new Set();
    
    // Check for overlaps and fix if needed
    validPlacements.forEach((placement) => {
      if (!placement.placeholder) return;
      
      const position = placement.placeholder.getAttribute('position');
      if (!position) return;
      
      const positionKey = `${position.x.toFixed(2)},${position.y.toFixed(2)},${position.z.toFixed(2)}`;
      
      if (usedPositions.has(positionKey)) {
        // Find an available placeholder
        for (let i = 0; i < placeholders.length; i++) {
          const alternativePlaceholder = placeholders[i];
          const altPosition = alternativePlaceholder.getAttribute('position');
          if (!altPosition) continue;
          
          const altPositionKey = `${altPosition.x.toFixed(2)},${altPosition.y.toFixed(2)},${altPosition.z.toFixed(2)}`;
          
          if (!usedPositions.has(altPositionKey)) {
            console.log(`Found alternative position ${altPositionKey} for overlapping artwork`);
            
            // Move artwork to this position
            placement.placeholder.setAttribute('position', altPosition);
            usedPositions.add(altPositionKey);
            break;
          }
        }
      } else {
        usedPositions.add(positionKey);
      }
    });
    
    return validPlacements;
  }
  
/**
 * Position the camera based on room size
 * @param {string} roomSize - Size option (small, medium, large)
 */
function positionCamera(roomSize) {
    const cameraRig = document.getElementById('cameraRig');
    if (!cameraRig) {
      console.error("Camera rig not found!");
      return;
    }
    
    // Adjust height based on room size
    const height = roomSize === 'small' ? 0.8 : 
                  roomSize === 'large' ? 1.0 : 0.9;
    
    cameraRig.setAttribute('position', {x: 0, y: height, z: 0});
    console.log(`Camera positioned at height ${height}`);
    
    // Add look controls
    const camera = document.querySelector('a-camera');
    if (camera && !camera.getAttribute('look-controls')) {
      camera.setAttribute('look-controls', 'pointerLockEnabled: true');
      console.log("Added look-controls to camera");
    }
  }
  
/**
 * Ensure pointer lock is enabled for VR controls
 */
function ensurePointerLock() {
    // Check if pointer lock is already working
    const camera = document.querySelector('a-camera');
    if (!camera) return;
    
    // Check if camera already has look-controls
    const lookControls = camera.getAttribute('look-controls');
    if (!lookControls) {
      camera.setAttribute('look-controls', 'pointerLockEnabled: true');
    } else if (typeof lookControls === 'object' && !lookControls.pointerLockEnabled) {
      camera.setAttribute('look-controls', 'pointerLockEnabled: true');
    }
    
    console.log("Pointer lock configuration ensured");
  }
  
// Export functions globally
window.resizeRoom = resizeRoom;
window.calculateOptimalPositions = calculateOptimalPositions;
window.redistributeArtworksToWalls = redistributeArtworksToWalls;
window.positionCamera = positionCamera;
window.ensurePointerLock = ensurePointerLock;