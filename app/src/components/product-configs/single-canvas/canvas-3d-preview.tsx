import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from './room-environment';
import { RulerOverlay } from './ruler-overlay';

interface Canvas3DPreviewProps {
  imageUrl: string | null;
  width: number; // Width in inches
  height: number; // Height in inches
  rotation: number; // Rotation in degrees
  zoom: number; // Zoom level
  wrapImage?: boolean; // If false, use solid color sides (default: true)
  sideColor?: string; // Color for canvas sides when wrapImage is false
  mirrorEdges?: boolean; // If true and wrapImage is true, mirror edges instead of wrapping
  showRuler?: boolean; // Show dimension rulers
  wallColor?: string; // Wall color
}

function CanvasMesh({
  imageUrl,
  width,
  height,
  rotation,
  zoom,
  wrapImage = true,
  sideColor,
}: Canvas3DPreviewProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Calculate canvas proportions (convert inches to Three.js units)
  // 1 inch = 0.1 Three.js units
  const canvasWidth = width / 10; // User-selected width in inches → units
  const canvasHeight = height / 10; // User-selected height in inches → units
  const canvasDepth = 0.0709; // CONSTANT: 18mm depth (0.708" ≈ 0.0709 units)

  // Calculate radius for rounded edges (approximately 0.08 units for visible smoothness)
  const cornerRadius = Math.min(
    0.08,
    canvasDepth * 0.5,
    canvasWidth * 0.02,
    canvasHeight * 0.02
  );
  const smoothness = 8; // Number of segments for smooth rounded corners

  // Bleed area: 1.7 inches on each side for wrapping
  const BLEED_INCHES = 1.7;

  // Calculate UV coordinates for the cropped image with bleed
  // The cropped image dimensions: (width + 2*1.7) x (height + 2*1.7)
  // We need to map:
  // - Front face: center area (actual canvas size)
  // - Sides: bleed area adjacent to canvas edges
  const totalImageWidth = width + 2 * BLEED_INCHES;
  const totalImageHeight = height + 2 * BLEED_INCHES;

  // UV coordinates for front face (center of cropped image)
  const frontUVMargin = BLEED_INCHES / totalImageWidth; // Normalized margin for width
  const frontUVMarginHeight = BLEED_INCHES / totalImageHeight; // Normalized margin for height

  // Load user's image texture
  const imageTexture = useMemo(() => {
    if (!imageUrl) return null;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(imageUrl);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 16; // Maximum texture quality
    return tex;
  }, [imageUrl]);

  // Use RoundedBoxGeometry for smooth, rounded edges on the canvas
  const geometry = useMemo(() => {
    return new RoundedBoxGeometry(
      canvasWidth,
      canvasHeight,
      canvasDepth,
      smoothness, // segments for rounded corners
      cornerRadius // radius of the rounded edges
    );
  }, [canvasWidth, canvasHeight, canvasDepth, cornerRadius, smoothness]);

  // For RoundedBoxGeometry, we use a single material with the texture
  // The geometry will naturally apply the texture across all faces with smooth transitions
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

  // Keep canvas perfectly flush against wall (no idle movement)
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
        position={[0, 2.2, -4.9645]}
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
      position={[0, 2.2, -4.9645]} // Lower on wall, flush with back wall (z = -5 + depth/2)
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

function OvalOrbitControls({
  minDistance,
  maxDistance,
  canvasTarget,
}: {
  minDistance: number;
  maxDistance: number;
  canvasTarget: [number, number, number];
}) {
  const controlsRef = useRef<any>(null);

  useFrame(() => {
    if (!controlsRef.current) return;

    const camera = controlsRef.current.object;
    const distance = camera.position.distanceTo(
      new THREE.Vector3(...canvasTarget)
    );

    // Only apply oval orbit when FULLY zoomed in (within 10% of minimum distance)
    const zoomThreshold = minDistance * 1.1; // 10% tolerance

    if (distance <= zoomThreshold) {
      // Create "0" shape orbit: camera goes far when moving left/right, close at center
      const target = new THREE.Vector3(...canvasTarget);
      const cameraPos = camera.position.clone();

      // Calculate horizontal angle from center
      const dx = cameraPos.x - target.x;
      const dz = cameraPos.z - target.z;
      const horizontalAngle = Math.atan2(dx, dz - target.z);

      // Modulate distance based on horizontal position
      // When at sides (±90°), push camera farther back
      // When at center (0°), keep camera close
      const angleOffset = Math.abs(horizontalAngle); // 0 to π
      const distanceModulation = 1 + Math.sin(angleOffset) * 0.8; // 1.0 to 1.8x

      // Apply modulated distance
      const direction = cameraPos.clone().sub(target).normalize();
      const newDistance = minDistance * distanceModulation;
      const newPosition = target
        .clone()
        .add(direction.multiplyScalar(newDistance));

      // Smoothly interpolate to new position
      camera.position.lerp(newPosition, 0.1);
    }
    // Otherwise: normal spherical orbit
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={true}
      enablePan={false}
      enableRotate={true}
      minDistance={minDistance}
      maxDistance={maxDistance}
      minPolarAngle={Math.PI / 3.5}
      maxPolarAngle={Math.PI / 1.8}
      minAzimuthAngle={-Math.PI / 5}
      maxAzimuthAngle={Math.PI / 5}
      target={canvasTarget}
      autoRotate={false}
      rotateSpeed={1.0}
      zoomSpeed={1.0}
      enableDamping={true}
      dampingFactor={0.05}
      makeDefault
    />
  );
}

function Canvas3DPreview({
  imageUrl,
  width,
  height,
  rotation,
  zoom,
  wrapImage = true,
  sideColor,
  mirrorEdges = false,
  showRuler = false,
  wallColor = '#d4e4d4',
}: Canvas3DPreviewProps) {
  // Calculate dynamic zoom limits based on canvas size
  const canvasWidth = width / 10;
  const canvasHeight = height / 10;
  const maxDimension = Math.max(canvasWidth, canvasHeight);

  // Calculate minimum distance to see full canvas at current FOV (50 degrees)
  // FOV 50° means we need: distance = (dimension / 2) / tan(FOV/2)
  // For FOV=50°, tan(25°) ≈ 0.466, so distance ≈ dimension * 1.07
  const minDistanceForFullCanvas = maxDimension * 1.15; // Add 15% margin

  // Allow zooming much closer than full canvas view
  const minDistance = Math.max(0.8, minDistanceForFullCanvas * 0.4); // Can zoom to 40% of full view distance
  const maxDistance = Math.max(12, minDistanceForFullCanvas * 2); // Limited zoom-out - closer to canvas

  const canvasTarget: [number, number, number] = [0, 2.2, -4.9645];

  return (
    <div className='w-full h-full bg-gradient-to-b from-slate-100 to-slate-200 overflow-hidden'>
      <Canvas shadows camera={{ position: [0, 4.5, 8], fov: 50 }}>
        {/* Very dark ambient lighting to see lamp effects */}
        <ambientLight intensity={0.15} />

        {/* Main directional light from TOP-LEFT (moved UP from center) */}
        <directionalLight
          position={[-2, 8, 3]}
          intensity={2.2}
          color='#ffffff'
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
          shadow-bias={-0.0003}
        />

        {/* Canvas spotlight from HIGH ABOVE (gallery lighting) - BRIGHTER */}
        <spotLight
          position={[0, 6, -1]}
          target-position={[0, 2.2, -4.9645]}
          angle={0.5}
          penumbra={0.5}
          intensity={3.5}
          color='#ffffff'
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0002}
        />

        {/* Additional spotlight for canvas brightness */}
        <spotLight
          position={[-1, 5, 0]}
          target-position={[0, 2.2, -4.9645]}
          angle={0.4}
          penumbra={0.6}
          intensity={2.5}
          color='#ffffff'
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />

        {/* Directional light from FRONT to cast strong canvas shadow on wall */}
        <directionalLight
          position={[1, 3.5, 4]}
          target-position={[0, 2.2, -5]}
          intensity={1.5}
          color='#ffffff'
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
          shadow-camera-near={0.5}
          shadow-camera-far={20}
          shadow-bias={-0.001}
        />

        {/* Very subtle fill light from upper right (reduced for darker walls) */}
        <directionalLight
          position={[4, 7, 2]}
          intensity={0.3}
          color='#fff8f0'
        />

        {/* Minimal fill light from lower position */}
        <pointLight
          position={[0, 1, 2]}
          intensity={0.2}
          distance={8}
          color='#ffffff'
          decay={2}
        />

        {/* Floor lamp light - ENHANCED warm ambient glow */}
        <pointLight
          position={[-3.4, 3.3, -3.8]}
          intensity={2.5}
          distance={12}
          color='#ffcc80'
          decay={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* Additional soft glow from lamp base */}
        <pointLight
          position={[-3.4, 2.5, -3.8]}
          intensity={1.2}
          distance={6}
          color='#ffe4b3'
          decay={2}
        />

        {/* Wall section with minimal furniture */}
        <RoomEnvironment wallColor={wallColor} />

        {/* Canvas on Wall */}
        <CanvasMesh
          imageUrl={imageUrl}
          width={width}
          height={height}
          rotation={rotation}
          zoom={zoom}
          wrapImage={wrapImage}
          sideColor={sideColor}
          mirrorEdges={mirrorEdges}
        />

        {/* Ruler overlay with dimensions */}
        <RulerOverlay
          canvasWidth={width}
          canvasHeight={height}
          showRuler={showRuler}
        />

        {/* Oval orbit controls - elliptical path when zoomed in to see canvas sides */}
        <OvalOrbitControls
          minDistance={minDistance}
          maxDistance={maxDistance}
          canvasTarget={canvasTarget}
        />
      </Canvas>
    </div>
  );
}

export default Canvas3DPreview;
export { Canvas3DPreview };
