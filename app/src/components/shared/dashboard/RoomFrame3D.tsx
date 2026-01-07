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

// 3D Frame for room view
const RoomFrame3D = ({
  imageUrl,
  shape,
  onInteraction,
  selectedSize,
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
  const [isDragging, setIsDragging] = useState(false);
  const { edgeType } = useEdge();

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const MOBILE_SCALE_FACTOR = 0.6;

  const BASE_SIZE = 12;
  const HOVER_FACTOR = 1.05;

  const scaleX = useMemo(() => {
    const baseScale = selectedSize.width / BASE_SIZE;
    return isMobile ? baseScale * MOBILE_SCALE_FACTOR : baseScale;
  }, [selectedSize.width, isMobile]);

  const scaleY = useMemo(() => {
    const baseScale = selectedSize.height / BASE_SIZE;
    return isMobile ? baseScale * MOBILE_SCALE_FACTOR : baseScale;
  }, [selectedSize.height, isMobile]);

  useEffect(() => {
    if (!imageUrl) {
      setTexture(null);
      return;
    }

    const isBase64 = imageUrl.startsWith('data:');
    const uniqueUrl = isBase64 ? imageUrl : `${imageUrl}?v=${Date.now()}`;

    const loader = new THREE.TextureLoader();

    if (texture) texture.dispose();

    loader.load(
      uniqueUrl,
      loadedTexture => {
        loadedTexture.needsUpdate = true;
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
        const img = loadedTexture.image;
        if (img && img.width && img.height) {
          const frameAspect = 1.8 / 1.35;
          const imageAspect = img.width / img.height;

          if (imageAspect > frameAspect) {
            const scale = frameAspect / imageAspect;
            loadedTexture.repeat.set(scale, 1);
            loadedTexture.offset.set((1 - scale) / 2, 0);
          } else {
            const scale = imageAspect / frameAspect;
            loadedTexture.repeat.set(1, scale);
            loadedTexture.offset.set(0, (1 - scale) / 2);
          }
        }

        setTexture(loadedTexture);
      },
      undefined,
      err => {
        console.error('❌ Texture load failed:', err);
        setTexture(null);
      }
    );
  }, [imageUrl, edgeType]);

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
        geo = new THREE.PlaneGeometry(1.8, 1.35);
    }
    return geo;
  }, [shape]);

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
      onPointerDown={() => setIsDragging(true)}
      onPointerUp={() => {
        if (isDragging) {
          onInteraction();
        }
        setIsDragging(false);
      }}
      onPointerMove={e => {
        if (e.buttons > 0) {
          onInteraction();
        }
      }}
      onClick={() => {
        onInteraction();
      }}
    >
      {frameGeometry}

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
          <ambientLight intensity={1} />
          <directionalLight
            position={[3, 4, 3]}
            intensity={3}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[2, 2, 2]} intensity={0.4} />

          {preview && selectedSize && (
            <RoomFrame3D
              imageUrl={preview}
              shape={shape}
              onInteraction={onInteraction}
              selectedSize={selectedSize}
              selectedRatio={selectedRatio}
            />
          )}

          <OrbitControls enabled={false} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default RoomFrame3DCanvas;
