import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { RoomEnvironment } from './room-environment';
import { RulerOverlay } from './ruler-overlay';

interface Room3DPreviewProps {
  // Canvas mesh to render (provided by product)
  canvasMesh: React.ReactNode;
  
  // Ruler settings
  canvasWidth: number;  // in inches
  canvasHeight: number; // in inches
  showRuler?: boolean;
  canvasPosition?: [number, number, number];
  showFurnitureRulers?: boolean;
  
  // Room settings
  wallColor?: string;
  
  // Camera settings
  cameraPosition?: [number, number, number];
  orbitTarget?: [number, number, number];
  minDistance?: number;
  maxDistance?: number;
}

export function Room3DPreview({
  canvasMesh,
  canvasWidth,
  canvasHeight,
  showRuler = false,
  canvasPosition = [0, 2.2, -4.9645],
  showFurnitureRulers = true,
  wallColor = '#d4e4d4',
  cameraPosition = [0, 2.2, 5],
  orbitTarget = [0, 2.2, -4.9645],
  minDistance = 2,
  maxDistance = 15
}: Room3DPreviewProps) {
  return (
    <Canvas
      shadows
      camera={{ 
        position: cameraPosition, 
        fov: 50, 
        near: 0.1, 
        far: 1000 
      }}
      style={{ background: '#f5f5f5' }}
    >
      {/* Lighting */}
      <ambientLight intensity={2} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={2.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-5, 8, 5]} intensity={1.5} />
      <directionalLight position={[0, -5, 0]} intensity={0.8} />

      {/* Room Environment */}
      <RoomEnvironment wallColor={wallColor} />

      {/* Product-specific Canvas Mesh (injected) */}
      {canvasMesh}

      {/* Ruler Overlay */}
      <RulerOverlay
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        canvasPosition={canvasPosition}
        showRuler={showRuler}
        showFurnitureRulers={showFurnitureRulers}
      />

      {/* Orbit Controls */}
      <OrbitControls
        target={orbitTarget}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={minDistance}
        maxDistance={maxDistance}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 4}
      />
    </Canvas>
  );
}

