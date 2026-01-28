import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { RoomEnvironment } from '@/components/product-configs/shared/3d/room-environment';
import { RulerOverlay } from '@/components/product-configs/shared/3d/ruler-overlay';
import { useUpload } from '@/context/UploadContext';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Ruler } from 'lucide-react';
import { motion } from 'motion/react';

interface Room3DViewProps {
  isVisible: boolean;
}

function FrameMesh() {
  const { preview, selectedSize } = useUpload();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (preview) {
      const loader = new THREE.TextureLoader();
      const tex = loader.load(preview);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 16;
      setTexture(tex);
    }
  }, [preview]);
  
  if (!preview || !selectedSize) return null;

  const canvasWidth = selectedSize.width_in / 10;
  const canvasHeight = selectedSize.height_in / 10;
  const canvasDepth = 0.0709;
  const cornerRadius = Math.min(
    0.08,
    canvasDepth * 0.5,
    canvasWidth * 0.02,
    canvasHeight * 0.02
  );
  const smoothness = 8;

  if (!texture) return null;

  const geometry = new RoundedBoxGeometry(
    canvasWidth,
    canvasHeight,
    canvasDepth,
    smoothness,
    cornerRadius
  );

  return (
    /* @ts-ignore react-three-fiber types */
    <mesh
      position={[0, 2.2, -4.9645]}
      castShadow
      receiveShadow
    >
      {/* @ts-ignore react-three-fiber types */}
      <primitive object={geometry} attach="geometry" />
      {/* @ts-ignore react-three-fiber types */}
      <meshStandardMaterial
        map={texture}
        toneMapped={false}
        roughness={0.5}
        metalness={0.0}
      />
    </mesh>
  );
}

export function Room3DView({ isVisible }: Room3DViewProps) {
  const { selectedSize } = useUpload();
  const [showRuler, setShowRuler] = useState(true);

  if (!isVisible || !selectedSize) return null;

  return (
    <div className='w-full h-full relative'>
      <Canvas
        shadows
        camera={{
          position: [0, 2.2, 5],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        style={{ background: '#f5f5f5' }}
      >
        {/* Lighting */}
        {/* @ts-ignore react-three-fiber types */}
        <ambientLight intensity={1.2} />
        {/* @ts-ignore react-three-fiber types */}
        <directionalLight
          position={[10, 10, 5]}
          intensity={2.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        {/* @ts-ignore react-three-fiber types */}
        <directionalLight position={[-5, 8, 5]} intensity={1.5} />
        {/* @ts-ignore react-three-fiber types */}
        <directionalLight position={[0, -5, 0]} intensity={0.8} />

        {/* Room Environment */}
        <RoomEnvironment wallColor='#d4e4d4' />

        {/* Frame on Wall */}
        <FrameMesh />

        {/* Ruler Overlay */}
        <RulerOverlay
          canvasWidth={selectedSize.width_in}
          canvasHeight={selectedSize.height_in}
          canvasPosition={[0, 2.2, -4.9645]}
          showRuler={showRuler}
          showFurnitureRulers={showRuler}
        />

        {/* Orbit Controls */}
        <OrbitControls
          target={[0, 2.2, -4.9645]}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={15}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 4}
          minAzimuthAngle={-Math.PI / 3}
          maxAzimuthAngle={Math.PI / 3}
        />
      </Canvas>

      {/* Ruler Toggle Button */}
      <motion.button
        onClick={() => setShowRuler(!showRuler)}
        className={`absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-all ${
          showRuler
            ? 'bg-primary text-white'
            : 'bg-white text-gray-700 border border-gray-300'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={showRuler ? 'Hide Ruler' : 'Show Ruler'}
      >
        <Ruler className='h-4 w-4' />
        <span className='text-sm font-medium'>
          {showRuler ? 'Hide' : 'Show'} Ruler
        </span>
      </motion.button>
    </div>
  );
}
