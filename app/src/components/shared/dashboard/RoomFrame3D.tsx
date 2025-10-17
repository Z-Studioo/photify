'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import {
  useUpload,
  type CanvasShape,
  type SizeData,
} from '@/context/UploadContext';
import { useEdge } from '@/context/EdgeContext';

interface RoomFrame3DProps {
  onInteraction: () => void;
}

// 3D Frame component optimized for room view
const RoomFrame3D = ({
  imageUrl,
  shape,
  onInteraction,
  selectedSize,
  selectedRatio,
}: {
  imageUrl: string;
  shape: CanvasShape;
  onInteraction: () => void;
  selectedSize: SizeData;
  selectedRatio: string | null;
}) => {
  const frameRef = useRef<THREE.Group>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { edgeType } = useEdge();

  const BASE_SIZE = 12;
  const HOVER_FACTOR = 1.1;

  const scaleX = useMemo(
    () => selectedSize.width / BASE_SIZE,
    [selectedSize.width]
  );
  const scaleY = useMemo(
    () => selectedSize.height / BASE_SIZE,
    [selectedSize.height]
  );

  useEffect(() => {
    if (imageUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(imageUrl, loadedTexture => {
        loadedTexture.flipY = true;
        if (edgeType === 'mirrored') {
          loadedTexture.wrapS = THREE.MirroredRepeatWrapping;
          loadedTexture.wrapT = THREE.MirroredRepeatWrapping;
        } else {
          loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
          loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
        }
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

  // --- Image geometry (photo plane / shape) ---
  const geometry = useMemo(() => {
    let geo: THREE.BufferGeometry;

    switch (shape) {
      case 'round':
        geo = new THREE.CircleGeometry(0.9, 64);
        break;
      case 'hexagon':
        geo = new THREE.CircleGeometry(0.9, 6);
        break;
      case 'octagon':
        geo = new THREE.CircleGeometry(0.9, 8);
        break;
      case 'dodecagon':
        geo = new THREE.CircleGeometry(0.9, 12);
        break;
      default:
        // rectangle
        geo = new THREE.PlaneGeometry(1.8, 1.35);
    }
    return geo;
  }, [shape]);

  // --- Frame geometry (3D physical border) ---
  const frameGeometry = useMemo(() => {
    const frameDepth = 0.6;

    if (shape === 'rectangle') {
      return (
        <mesh
          scale={[
            scaleX * (isHovered ? HOVER_FACTOR : 1),
            scaleY * (isHovered ? HOVER_FACTOR : 1),
            1,
          ]}
          position={[0, 0, -frameDepth / 2]}
        >
          <meshStandardMaterial
            color={isHovered ? '#404040' : '#2c2c2c'}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
      );
    } else {
      return (
        <mesh position={[0, 0, -frameDepth / 2]}>
          <cylinderGeometry args={[1.15, 1.15, frameDepth, 64]} />
          <meshStandardMaterial
            color={isHovered ? '#404040' : '#2c2c2c'}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
      );
    }
  }, [shape, isHovered, scaleX, scaleY]);

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
    >
      {/* Frame */}
      {frameGeometry}

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
        <mesh
          scale={[
            scaleX * (isHovered ? HOVER_FACTOR : 1),
            scaleY * (isHovered ? HOVER_FACTOR : 1),
            1,
          ]}
          position={[0, 0, 0.01]}
          rotation={[0, 0, 0]}
          castShadow
        >
          <primitive object={geometry} />
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
  const { preview, shape, selectedSize, selectedRatio } = useUpload();

  return (
    <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-60 cursor-pointer'>
      <Canvas
        shadows
        camera={{ position: [0, 0, 4], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Lighting optimized for room integration */}
          <ambientLight intensity={1} />
          <directionalLight
            position={[3, 4, 3]}
            intensity={3}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[2, 2, 2]} intensity={0.4} />

          {/* Frame with image */}
          {preview && selectedSize && (
            <RoomFrame3D
              imageUrl={preview}
              shape={shape}
              onInteraction={onInteraction}
              selectedSize={selectedSize}
              selectedRatio={selectedRatio}
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
