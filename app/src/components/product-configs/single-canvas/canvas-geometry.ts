import * as THREE from 'three';

/**
 * Creates a realistic wrapped canvas geometry with gallery wrap edges
 * The image wraps around the sides of the canvas for a professional look
 */
export function createWrappedCanvasGeometry(
  width: number,
  height: number,
  depth: number,
  edgeType: 'wrap' | 'mirror' = 'wrap' // How image extends to sides
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  
  // Arrays to hold vertex data
  const vertices: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  
  const hw = width / 2; // Half width
  const hh = height / 2; // Half height
  const hd = depth / 2; // Half depth
  
  // Minimal subdivisions for flat front face (no visible grid lines)
  const segmentsW = 1;
  const segmentsH = 1;
  
  let vertexIndex = 0;
  
  // ============================================
  // 1. FRONT FACE (Main display area - completely flat)
  // ============================================
  const curvatureAmount = 0; // No curvature - completely flat
  
  for (let i = 0; i <= segmentsH; i++) {
    for (let j = 0; j <= segmentsW; j++) {
      const u = j / segmentsW;
      const v = i / segmentsH;
      
      // Position on front face
      const x = -hw + width * u;
      const y = hh - height * v;
      
      // Add very subtle curvature (natural canvas tension)
      const distFromCenterX = Math.abs(u - 0.5) * 2; // 0 at center, 1 at edges
      const distFromCenterY = Math.abs(v - 0.5) * 2;
      const curveFactor = (1 - distFromCenterX * distFromCenterX) * (1 - distFromCenterY * distFromCenterY);
      
      const z = hd + curvatureAmount * curveFactor;
      
      vertices.push(x, y, z);
      
      // UV mapping - use full image (1:1)
      uvs.push(u, 1 - v);
      normals.push(0, 0, 1); // Facing forward
      vertexIndex++;
    }
  }
  
  // Create triangles for front face
  for (let i = 0; i < segmentsH; i++) {
    for (let j = 0; j < segmentsW; j++) {
      const a = i * (segmentsW + 1) + j;
      const b = a + segmentsW + 1;
      const c = a + 1;
      const d = b + 1;
      
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }
  
  // ============================================
  // 2. TOP WRAP FACE (Image wraps to top edge)
  // ============================================
  const topWrapSegments = 1; // Minimal segments to avoid visible grid
  const topStartVertex = vertexIndex;
  
  for (let i = 0; i <= topWrapSegments; i++) {
    for (let j = 0; j <= segmentsW; j++) {
      const u = j / segmentsW;
      const t = i / topWrapSegments; // 0 = front edge, 1 = back edge
      
      const x = -hw + width * u;
      const y = hh;
      const z = hd - depth * t;
      
      vertices.push(x, y, z);
      
      // UV mapping: based on edge type
      let wrapV: number;
      if (edgeType === 'mirror') {
        wrapV = 1 - (0.1 * t);
      } else {
        wrapV = 1 - (0.005 * t);
      }
      uvs.push(u, wrapV);
      
      normals.push(0, 1, 0); // Facing up
      vertexIndex++;
    }
  }
  
  // Create triangles for top wrap
  for (let i = 0; i < topWrapSegments; i++) {
    for (let j = 0; j < segmentsW; j++) {
      const a = topStartVertex + i * (segmentsW + 1) + j;
      const b = a + segmentsW + 1;
      const c = a + 1;
      const d = b + 1;
      
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }
  
  // ============================================
  // 3. BOTTOM WRAP FACE (Image wraps to bottom edge)
  // ============================================
  const bottomStartVertex = vertexIndex;
  
  for (let i = 0; i <= topWrapSegments; i++) {
    for (let j = 0; j <= segmentsW; j++) {
      const u = j / segmentsW;
      const t = i / topWrapSegments;
      
      const x = -hw + width * u;
      const y = -hh;
      const z = hd - depth * t;
      
      vertices.push(x, y, z);
      
      // UV mapping: based on edge type
      let wrapV: number;
      if (edgeType === 'mirror') {
        wrapV = 0.1 * t;
      } else {
        wrapV = 0.005 * t;
      }
      uvs.push(u, wrapV);
      
      normals.push(0, -1, 0); // Facing down
      vertexIndex++;
    }
  }
  
  // Create triangles for bottom wrap
  for (let i = 0; i < topWrapSegments; i++) {
    for (let j = 0; j < segmentsW; j++) {
      const a = bottomStartVertex + i * (segmentsW + 1) + j;
      const b = a + segmentsW + 1;
      const c = a + 1;
      const d = b + 1;
      
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }
  
  // ============================================
  // 4. LEFT WRAP FACE (Image wraps to left edge)
  // ============================================
  const leftStartVertex = vertexIndex;
  
  for (let i = 0; i <= segmentsH; i++) {
    for (let j = 0; j <= topWrapSegments; j++) {
      const v = i / segmentsH;
      const t = j / topWrapSegments;
      
      const x = -hw;
      const y = hh - height * v;
      const z = hd - depth * t;
      
      vertices.push(x, y, z);
      
      // UV mapping: based on edge type
      let wrapU: number;
      if (edgeType === 'mirror') {
        wrapU = 0.1 * t;
      } else {
        wrapU = 0.005 * t;
      }
      uvs.push(wrapU, 1 - v);
      
      normals.push(-1, 0, 0); // Facing left
      vertexIndex++;
    }
  }
  
  // Create triangles for left wrap
  for (let i = 0; i < segmentsH; i++) {
    for (let j = 0; j < topWrapSegments; j++) {
      const a = leftStartVertex + i * (topWrapSegments + 1) + j;
      const b = a + topWrapSegments + 1;
      const c = a + 1;
      const d = b + 1;
      
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }
  
  // ============================================
  // 5. RIGHT WRAP FACE (Image wraps to right edge)
  // ============================================
  const rightStartVertex = vertexIndex;
  
  for (let i = 0; i <= segmentsH; i++) {
    for (let j = 0; j <= topWrapSegments; j++) {
      const v = i / segmentsH;
      const t = j / topWrapSegments;
      
      const x = hw;
      const y = hh - height * v;
      const z = hd - depth * t;
      
      vertices.push(x, y, z);
      
      // UV mapping: based on edge type
      let wrapU: number;
      if (edgeType === 'mirror') {
        wrapU = 1 - (0.1 * t);
      } else {
        wrapU = 1 - (0.005 * t);
      }
      uvs.push(wrapU, 1 - v);
      
      normals.push(1, 0, 0); // Facing right
      vertexIndex++;
    }
  }
  
  // Create triangles for right wrap
  for (let i = 0; i < segmentsH; i++) {
    for (let j = 0; j < topWrapSegments; j++) {
      const a = rightStartVertex + i * (topWrapSegments + 1) + j;
      const b = a + topWrapSegments + 1;
      const c = a + 1;
      const d = b + 1;
      
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }
  
  // ============================================
  // 6. BACK FACE (Plain, no image)
  // ============================================
  const backStartVertex = vertexIndex;
  
  // Simple quad for back
  vertices.push(-hw, hh, -hd);   // Top-left
  vertices.push(hw, hh, -hd);    // Top-right
  vertices.push(hw, -hh, -hd);   // Bottom-right
  vertices.push(-hw, -hh, -hd);  // Bottom-left
  
  // UV coordinates (not used, but needed)
  for (let i = 0; i < 4; i++) {
    uvs.push(0, 0);
    normals.push(0, 0, -1); // Facing backward
  }
  
  // Back face triangles
  indices.push(backStartVertex, backStartVertex + 1, backStartVertex + 2);
  indices.push(backStartVertex, backStartVertex + 2, backStartVertex + 3);
  
  // ============================================
  // Set geometry attributes
  // ============================================
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  
  // Compute normals for smooth shading (overrides the manual normals for better lighting)
  geometry.computeVertexNormals();
  
  return geometry;
}

/**
 * Generates a procedural canvas texture (fabric weave pattern)
 */
export function generateCanvasTexture(size: number = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  // Base color (off-white)
  ctx.fillStyle = '#f8f8f8';
  ctx.fillRect(0, 0, size, size);
  
  // Draw canvas weave pattern
  const weaveSize = 4;
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 0.5;
  
  // Horizontal threads
  for (let y = 0; y < size; y += weaveSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
  
  // Vertical threads
  for (let x = 0; x < size; x += weaveSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  
  // Add noise for texture variation
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 10;
    data[i] += noise;     // R
    data[i + 1] += noise; // G
    data[i + 2] += noise; // B
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  
  return texture;
}

/**
 * Generates a normal map for canvas texture detail
 */
export function generateCanvasNormalMap(size: number = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  // Base normal color (neutral, pointing straight out)
  ctx.fillStyle = '#8080ff';
  ctx.fillRect(0, 0, size, size);
  
  // Add slight variations for fabric bumps
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      
      // Create subtle normal variations
      const noise = Math.random() * 30 - 15;
      data[i] = 128 + noise;     // R (X normal)
      data[i + 1] = 128 + noise; // G (Y normal)
      data[i + 2] = 255;         // B (Z normal - always pointing out)
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  
  return texture;
}

