function resizeRoom(roomSize) {
    console.log(`Resizing room to ${roomSize} size`);
    
    // Define default configurations if GalleryConfig is not available
    const defaultSizes = {
        small: { size: 3, height: 2.5 },
        medium: { size: 5, height: 3 },
        large: { size: 7, height: 3.5 }
    };
    
    const config = window.GalleryConfig?.sizes?.[roomSize] || 
                  defaultSizes[roomSize] || 
                  defaultSizes.medium;
                  
    const size = config.roomWidth || config.size || 5;
    const height = config.wallHeight || config.height || 3; 
    const wallPos = size / 2; 
    
    console.log(`Using room config:`, config);
    console.log(`Room size: ${size}, height: ${height}, wall position: ${wallPos}`);
    
    // Get room elements by ID
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
    
    // Resize and reposition walls
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
        leftWall.setAttribute('width', size); 
        leftWall.setAttribute('height', height);
      } else {
        leftWall.setAttribute('depth', size);
      }
      leftWall.setAttribute('position', {x: -wallPos, y: 1.5, z: 0});
    }
    
    if (rightWall) {
      if (rightWall.tagName.toLowerCase() === 'a-plane') {
        rightWall.setAttribute('width', size); 
        rightWall.setAttribute('height', height);
      } else {
        rightWall.setAttribute('depth', size);
      }
      rightWall.setAttribute('position', {x: wallPos, y: 1.5, z: 0});
    }
    
    // Baseboard and crown molding adjustments 
    document.querySelectorAll('.baseboard, a-box[position*="0.1"]').forEach(element => {
      const position = element.getAttribute('position');
      if (!position) return; 
      
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
  
// Calculate optimal positions for artworks based on room size and number of artworks
function calculateOptimalPositions(artworks, roomSize) {
    const galleryWalls = [
      { name: 'back', positions: [] },
      { name: 'left', positions: [] },
      { name: 'right', positions: [] },
      { name: 'front', positions: [] }
    ];

    const defaultSizes = {
        small: { size: 3, height: 2.5 },
        medium: { size: 5, height: 3 },
        large: { size: 7, height: 3.5 }
    };
    
    // Get room configuration with fallback
    const config = window.GalleryConfig?.sizes?.[roomSize] || 
                  defaultSizes[roomSize] || 
                  defaultSizes.medium;
                  
    const size = config.roomWidth || config.size || 5;
    const wallPos = size / 2;
    
    const height = config.artworkY || 1.5;
    
    // Calculate wall positions
    const WALL_THICKNESS = 0.1;
    const backWallZ = -wallPos + (WALL_THICKNESS / 2) + 0.06;  
    const frontWallZ = wallPos - (WALL_THICKNESS / 2) - 0.06;  
    const leftWallX = -wallPos + (WALL_THICKNESS / 2) + 0.06;  
    const rightWallX = wallPos - (WALL_THICKNESS / 2) - 0.06; 
    
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
    
    // Scale
    const scale = size / 7;
    
    // Calculate optimal positions for each wall
    Object.keys(artworksPerWall).forEach(wall => {
      const count = artworksPerWall[wall];
      
      if (count === 0) return;
      
      if (count === 1) {
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
        const spacing = 1.5 * scale;
        
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
        const spacing = 2.0 * scale; 
        
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
  
// Redistribute artworks to walls based on calculated positions
function redistributeArtworksToWalls(placements, galleryWalls, placeholders) {
    console.log("Redistributing artworks to walls");
    
    let allPositions = [];
    let wallMap = {};
    
    galleryWalls.forEach((wall, wallIndex) => {
      wall.positions.forEach((pos, posIndex) => {
        allPositions.push(pos);
        wallMap[allPositions.length - 1] = { wall: wallIndex, position: posIndex };
      });
    });
    
    // Calculate total available positions
    const totalPositions = allPositions.length;
    
    const validPlacements = placements.slice(0, Math.min(placements.length, totalPositions));
    
    // Ensure placeholders are set for valid placements
    validPlacements.forEach((placement, index) => {
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
            case 0: 
              rotation = { x: 0, y: 0, z: 0 };
              break;
            case 1: 
              rotation = { x: 0, y: 90, z: 0 };
              break;
            case 2: 
              rotation = { x: 0, y: -90, z: 0 };
              break;
            case 3:
              rotation = { x: 0, y: 180, z: 0 };
              break;
          }
        }
        
        placement.placeholder.setAttribute('rotation', rotation);
      }
    });
    
    const usedPositions = new Set();
    
    // Check for overlaps and fix if needed
    validPlacements.forEach((placement) => {
      if (!placement.placeholder) return;
      
      const position = placement.placeholder.getAttribute('position');
      if (!position) return;
      
      const positionKey = `${position.x.toFixed(2)},${position.y.toFixed(2)},${position.z.toFixed(2)}`;
      
      if (usedPositions.has(positionKey)) {
        for (let i = 0; i < placeholders.length; i++) {
          const alternativePlaceholder = placeholders[i];
          const altPosition = alternativePlaceholder.getAttribute('position');
          if (!altPosition) continue;
          
          const altPositionKey = `${altPosition.x.toFixed(2)},${altPosition.y.toFixed(2)},${altPosition.z.toFixed(2)}`;
          
          if (!usedPositions.has(altPositionKey)) {
            console.log(`Found alternative position ${altPositionKey} for overlapping artwork`);
            
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
  
// Position the camera based on room size
function positionCamera(roomSize) {
  const cameraRig = document.getElementById('cameraRig');
  if (!cameraRig) {
    console.error("Camera rig not found!");
    return;
  }
  
  const height = 0.5;

  cameraRig.setAttribute('position', {x: 0, y: height, z: 0});
  console.log(`Camera positioned at height ${height}`);
  
  const camera = document.querySelector('a-camera');
  if (camera && !camera.getAttribute('look-controls')) {
    camera.setAttribute('look-controls', 'pointerLockEnabled: true');
    console.log("Added look-controls to camera");
  }
}
  
// Pointerlock
function ensurePointerLock() {
    const camera = document.querySelector('a-camera');
    if (!camera) return;
    
    const lookControls = camera.getAttribute('look-controls');
    if (!lookControls) {
      camera.setAttribute('look-controls', 'pointerLockEnabled: true');
    } else if (typeof lookControls === 'object' && !lookControls.pointerLockEnabled) {
      camera.setAttribute('look-controls', 'pointerLockEnabled: true');
    }
    
    console.log("Pointer lock configuration ensured");
  }
  
window.resizeRoom = resizeRoom;
window.calculateOptimalPositions = calculateOptimalPositions;
window.redistributeArtworksToWalls = redistributeArtworksToWalls;
window.positionCamera = positionCamera;
window.ensurePointerLock = ensurePointerLock;