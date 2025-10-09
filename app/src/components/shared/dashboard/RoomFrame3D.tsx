'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useUpload, type CanvasShape } from '@/context/UploadContext';

interface RoomFrame3DProps {
  onInteraction: () => void;
}

// 3D Frame component optimized for room view
const RoomFrame3D = ({
  imageUrl,
  shape,
  onInteraction,
}: {
  imageUrl: string;
  shape: CanvasShape;
  onInteraction: () => void;
}) => {
  const frameRef = useRef<THREE.Group>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (imageUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(imageUrl, loadedTexture => {
        loadedTexture.flipY = true;
        loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
        loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
        loadedTexture.minFilter = THREE.LinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        loadedTexture.generateMipmaps = false;
        if ('colorSpace' in loadedTexture) {
          (loadedTexture as any).colorSpace = THREE.SRGBColorSpace;
        } else {
          (loadedTexture as any).encoding = THREE.SRGBColorSpace;
        }
        setTexture(loadedTexture);
      });
    }
  }, [imageUrl]);

  // Create geometry based on shape with proper scaling
  const createGeometry = () => {
    switch (shape) {
      case 'round':
        return new THREE.CircleGeometry(0.9, 64);
      case 'hexagon':
        return new THREE.CircleGeometry(0.9, 6);
      case 'octagon':
        return new THREE.CircleGeometry(0.9, 8);
      case 'dodecagon':
        return new THREE.CircleGeometry(0.9, 12);
      default: // rectangle
        return new THREE.PlaneGeometry(1.8, 1.35);
    }
  };

  // Simplified frame for room view
  const createFrameGeometry = () => {
    const frameDepth = 0.06;

    if (shape === 'rectangle') {
      return (
        <group>
          <mesh position={[0, 0, -frameDepth / 2]}>
            <boxGeometry args={[2.0, 1.55, frameDepth]} />
            <meshStandardMaterial
              color={isHovered ? '#404040' : '#2c2c2c'}
              roughness={0.3}
              metalness={0.7}
            />
          </mesh>
        </group>
      );
    } else {
      return (
        <group>
          <mesh position={[0, 0, -frameDepth / 2]}>
            <cylinderGeometry args={[1.15, 1.15, frameDepth, 64]} />
            <meshStandardMaterial
              color={isHovered ? '#404040' : '#2c2c2c'}
              roughness={0.3}
              metalness={0.7}
            />
          </mesh>
        </group>
      );
    }
  };

  return (
    <group
      ref={frameRef}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
      castShadow
      receiveShadow
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onClick={onInteraction}
      scale={isHovered ? 1.05 : 1}
    >
      {/* Frame */}
      {createFrameGeometry()}

      {/* Acrylic glass effect */}
      <mesh position={[0, 0, 0.02]}>
        {shape === 'rectangle' ? (
          <planeGeometry args={[1.8, 1.35]} />
        ) : (
          <primitive object={new THREE.CircleGeometry(0.9, 64)} />
        )}
        <meshPhysicalMaterial
          color='white'
          transparent
          opacity={0.02}
          roughness={0.05}
          metalness={0.0}
          transmission={0.98}
          thickness={0.005}
          ior={1.5}
        />
      </mesh>

      {/* Photo/Image */}
      {texture && (
        <mesh position={[0, 0, 0.01]} rotation={[0, 0, 0]} castShadow>
          <primitive object={createGeometry()} />
          <meshStandardMaterial
            map={texture}
            transparent={shape !== 'rectangle'}
            side={THREE.FrontSide}
            roughness={0.08}
            metalness={0.0}
            emissive={'#181818'}
            emissiveIntensity={0.1}
          />
        </mesh>
      )}
    </group>
  );
};

const RoomFrame3DCanvas = ({ onInteraction }: RoomFrame3DProps) => {
  const { preview, shape } = useUpload();

  return (
    <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-60 cursor-pointer'>
      <Canvas
        shadows
        camera={{ position: [0, 0, 4], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Lighting optimized for room integration */}
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[3, 4, 3]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[2, 2, 2]} intensity={0.4} />

          {/* Frame with image */}
          {preview && (
            <RoomFrame3D
              imageUrl={preview}
              shape={shape}
              onInteraction={onInteraction}
            />
          )}

          {/* Disable orbit controls to prevent interaction */}
          <OrbitControls enabled={false} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default RoomFrame3DCanvas;
