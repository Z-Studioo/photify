import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

interface SingleCanvasMeshProps {
  imageUrl: string | null;
  width: number; // in inches
  height: number; // in inches
  rotation: number;
  zoom: number;
  wrapImage?: boolean; // If false, use solid color sides instead of wrapping
  sideColor?: string; // Color for canvas sides when wrapImage is false (default: white)
  mirrorEdges?: boolean; // If true and wrapImage is true, mirror edges instead of wrapping
  position?: [number, number, number]; // Optional position (default: wall position for room view)
}

export function SingleCanvasMesh({
  imageUrl,
  width,
  height,
  rotation,
  zoom,
  wrapImage = true,
  sideColor = '#ffffff',
  position = [0, 2.2, -4.9645], // Default: on wall for room view
}: SingleCanvasMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const canvasWidth = width / 10;
  const canvasHeight = height / 10;
  const canvasDepth = 0.0709;

  // Calculate radius for rounded edges (approximately 0.08 units for visible smoothness)
  const cornerRadius = Math.min(
    0.08,
    canvasDepth * 0.5,
    canvasWidth * 0.02,
    canvasHeight * 0.02
  );
  const smoothness = 8; // Number of segments for smooth rounded corners

  const BLEED_INCHES = 1.7;

  const totalImageWidth = width + 2 * BLEED_INCHES;
  const totalImageHeight = height + 2 * BLEED_INCHES;

  const frontUVMargin = BLEED_INCHES / totalImageWidth;
  const frontUVMarginHeight = BLEED_INCHES / totalImageHeight;

  const imageTexture = useMemo(() => {
    if (!imageUrl) return null;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(imageUrl);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 16;
    return tex;
  }, [imageUrl]);

  const geometry = useMemo(() => {
    // Use RoundedBoxGeometry for smooth, rounded edges on the canvas
    return new RoundedBoxGeometry(
      canvasWidth,
      canvasHeight,
      canvasDepth,
      smoothness, // segments for rounded corners
      cornerRadius // radius of the rounded edges
    );
  }, [canvasWidth, canvasHeight, canvasDepth, cornerRadius, smoothness]);

  // For RoundedBoxGeometry with solid colored sides, we need a composite texture
  // For collages: create a texture with image in center and solid color borders
  // For wrapped: use the image texture with bleed margins
  const material = useMemo(() => {
    if (!imageTexture) {
      return new THREE.MeshStandardMaterial({
        color: '#f5f5f5',
        roughness: 0.7,
      });
    }

    if (!wrapImage && sideColor) {
      // For collages: Create a composite texture with solid colored borders
      // This simulates the solid colored sides when texture wraps around edges
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageTexture.image?.src || imageUrl || '';

      // Create canvas to composite the image with colored borders
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx)
        return new THREE.MeshStandardMaterial({
          color: sideColor,
          roughness: 0.7,
        });

      // Wait for image to load
      img.onload = () => {
        // For RoundedBoxGeometry with collages, we need VERY large borders
        // to ensure ONLY solid color shows on sides (not image repetition)
        // The UV mapping on RoundedBoxGeometry is complex, so we need generous borders

        // Make borders 100% of image size (same size as image on each side)
        // This ensures that when texture wraps, sides only see solid color
        const borderWidth = img.width; // Border = full image width
        const borderHeight = img.height; // Border = full image height

        // Total canvas will be 3x the image size (border + image + border)
        canvas.width = img.width * 3;
        canvas.height = img.height * 3;

        // Fill entire canvas with solid color
        ctx.fillStyle = sideColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw collage image in the exact center (1/3 to 2/3 of total canvas)
        ctx.drawImage(img, borderWidth, borderHeight, img.width, img.height);

        // Update texture
        const compositeTexture = new THREE.CanvasTexture(canvas);
        compositeTexture.colorSpace = THREE.SRGBColorSpace;
        compositeTexture.minFilter = THREE.LinearFilter;
        compositeTexture.magFilter = THREE.LinearFilter;

        // UV mapping: Show only the center 1/3 portion (the collage) on the front face
        // This leaves the outer 2/3 (solid color borders) to wrap around sides
        const centerStart = 1 / 3; // Start at 1/3 into the texture
        const centerSize = 1 / 3; // Show 1/3 of the texture (the center)

        compositeTexture.repeat.set(centerSize, centerSize);
        compositeTexture.offset.set(centerStart, centerStart);
        compositeTexture.needsUpdate = true;

        if (meshRef.current) {
          const mat = meshRef.current.material as THREE.MeshStandardMaterial;
          mat.map = compositeTexture;
          mat.needsUpdate = true;
        }
      };

      // Return temporary material while image loads
      return new THREE.MeshStandardMaterial({
        map: imageTexture,
        toneMapped: false,
        roughness: 0.5,
        metalness: 0.0,
        color: sideColor,
      });
    } else {
      // For wrapped canvases: use image texture with bleed margins
      const texture = imageTexture.clone();

      if (wrapImage) {
        // Apply bleed margins for wrapped canvases
        texture.repeat.set(1 - 2 * frontUVMargin, 1 - 2 * frontUVMarginHeight);
        texture.offset.set(frontUVMargin, frontUVMarginHeight);
      } else {
        // Fallback: full image display
        texture.repeat.set(1, 1);
        texture.offset.set(0, 0);
      }

      texture.needsUpdate = true;

      return new THREE.MeshStandardMaterial({
        map: texture,
        toneMapped: false,
        roughness: 0.5,
        metalness: 0.0,
      });
    }
  }, [
    imageTexture,
    imageUrl,
    wrapImage,
    sideColor,
    frontUVMargin,
    frontUVMarginHeight,
  ]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x = 0;
      meshRef.current.rotation.y = 0;
    }
  });

  // For collages with solid colored sides, use multi-material approach
  if (!wrapImage && sideColor && imageTexture) {
    return (
      <group
        position={position}
        rotation={[0, 0, (rotation * Math.PI) / 180]}
        scale={zoom}
      >
        {/* Use RoundedBoxGeometry with solid color for the entire canvas */}
        <mesh geometry={geometry} castShadow={false} receiveShadow={false}>
          <meshStandardMaterial
            color={sideColor}
            roughness={0.7}
            metalness={0.0}
          />
        </mesh>

        {/* Overlay a flat plane with the collage image on the front face */}
        <mesh position={[0, 0, canvasDepth / 2 + 0.001]}>
          <planeGeometry args={[canvasWidth * 0.99, canvasHeight * 0.99]} />
          <meshStandardMaterial
            map={imageTexture}
            toneMapped={false}
            roughness={0.5}
            metalness={0.0}
            transparent={false}
          />
        </mesh>
      </group>
    );
  }

  // For wrapped images, use the standard approach
  return (
    <group
      position={position}
      rotation={[0, 0, (rotation * Math.PI) / 180]}
      scale={zoom}
    >
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        castShadow={false}
        receiveShadow={false}
      />
    </group>
  );
}
