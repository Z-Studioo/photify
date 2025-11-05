/* eslint-disable */
// @ts-nocheck

import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useUpload, type CanvasShape } from '@/context/UploadContext';
import { useEdge } from '@/context/EdgeContext';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface ThreeDCanvasProps {
  isVisible: boolean;
}

// 3D Frame component with true gallery-wrapped edges
const Frame3D = ({
  imageUrl,
  shape,
  edgeType,
}: {
  imageUrl: string;
  shape: CanvasShape;
  edgeType: 'wrapped' | 'mirrored';
}) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const { selectedSize } = useUpload();

  useEffect(() => {
  if (!imageUrl) {
    setTexture(null);
    return;
  }

  const isBase64 = imageUrl.startsWith('data:');
  const uniqueUrl = isBase64 ? imageUrl : `${imageUrl}?v=${Date.now()}`;

  const loader = new THREE.TextureLoader();

  // Dispose old texture
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

      // Center image based on aspect ratio
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


  const frameDepth = 0.06;
  const BASE_SIZE = 15;

  // Memoize the geometry so it's only created once
  const geometry = useMemo(() => {
    if (shape !== 'rectangle') return null;

    const frameWidth =
      selectedSize?.width && !isNaN(selectedSize.width / BASE_SIZE)
        ? selectedSize.width / BASE_SIZE
        : 1.8;

    const frameHeight =
      selectedSize?.height && !isNaN(selectedSize.height / BASE_SIZE)
        ? selectedSize.height / BASE_SIZE
        : 1.35;
    const box = new THREE.BoxGeometry(frameWidth, frameHeight, frameDepth);
    const uv = box.getAttribute('uv');

    // Compute UV wrap amount based on actual frame proportions
    const wrapX = frameDepth / frameWidth;
    const wrapY = frameDepth / frameHeight;

    // For better visibility, increase the wrap amount
    const sideWrapX = wrapX * 3; // Make sides more visible
    const sideWrapY = wrapY * 3;

    if (edgeType === 'mirrored') {
      // MIRRORED EDGES - Uses negative/beyond-1 UVs with MirroredRepeatWrapping
      // This creates a mirror/reflection effect on the sides

      // Right Face (0–3) - extend beyond 1.0 to trigger mirroring
      uv.setXY(0, 1 + sideWrapX, 1); // outer edge (will mirror back)
      uv.setXY(1, 1, 1); // at the edge
      uv.setXY(2, 1 + sideWrapX, 0); // outer edge (will mirror back)
      uv.setXY(3, 1, 0); // at the edge

      // Left Face (4–7) - extend below 0.0 to trigger mirroring
      uv.setXY(4, 0, 1); // at the edge
      uv.setXY(5, 0 - sideWrapX, 1); // outer edge (will mirror back)
      uv.setXY(6, 0, 0); // at the edge
      uv.setXY(7, 0 - sideWrapX, 0); // outer edge (will mirror back)

      // Top Face (8–11) - extend beyond 1.0 to trigger mirroring
      uv.setXY(8, 0, 1); // at the edge
      uv.setXY(9, 1, 1); // at the edge
      uv.setXY(10, 0, 1 + sideWrapY); // outer edge (will mirror back)
      uv.setXY(11, 1, 1 + sideWrapY); // outer edge (will mirror back)

      // Bottom Face (12–15) - extend below 0.0 to trigger mirroring
      uv.setXY(12, 0, 0 - sideWrapY); // outer edge (will mirror back)
      uv.setXY(13, 1, 0 - sideWrapY); // outer edge (will mirror back)
      uv.setXY(14, 0, 0); // at the edge
      uv.setXY(15, 1, 0); // at the edge
    } else {
      // WRAPPED EDGES - Takes a very thin slice from the edge of the image
      // Uses ClampToEdgeWrapping to smoothly extend the edge

      // Use a much smaller wrap amount for smoother appearance
      const edgeSlice = 0.005; // Very thin slice from edge (0.5% of image)

      // Right Face (0–3) - thin slice from right edge
      uv.setXY(0, 1, 1); // outer edge
      uv.setXY(1, 1 - edgeSlice, 1); // inner edge (very close to edge)
      uv.setXY(2, 1, 0); // outer edge
      uv.setXY(3, 1 - edgeSlice, 0); // inner edge (very close to edge)

      // Left Face (4–7) - thin slice from left edge
      uv.setXY(4, edgeSlice, 1); // inner edge (very close to edge)
      uv.setXY(5, 0, 1); // outer edge
      uv.setXY(6, edgeSlice, 0); // inner edge (very close to edge)
      uv.setXY(7, 0, 0); // outer edge

      // Top Face (8–11) - thin slice from top edge
      uv.setXY(8, 0, 1 - edgeSlice); // inner edge (very close to edge)
      uv.setXY(9, 1, 1 - edgeSlice); // inner edge (very close to edge)
      uv.setXY(10, 0, 1); // outer edge
      uv.setXY(11, 1, 1); // outer edge

      // Bottom Face (12–15) - thin slice from bottom edge
      uv.setXY(12, 0, 0); // outer edge
      uv.setXY(13, 1, 0); // outer edge
      uv.setXY(14, 0, edgeSlice); // inner edge (very close to edge)
      uv.setXY(15, 1, edgeSlice); // inner edge (very close to edge)
    }

    // Front Face (16–19) - always the same
    uv.setXY(16, 0, 1);
    uv.setXY(17, 1, 1);
    uv.setXY(18, 0, 0);
    uv.setXY(19, 1, 0);

    // Back Face (20–23) -> stays default solid color

    return box;
  }, [shape, edgeType, selectedSize?.width, selectedSize?.height]);

  if (!texture) return null;

  if (shape === 'rectangle' && geometry) {
    return (
      <group castShadow receiveShadow>
        <mesh position={[0, 0, -frameDepth / 2]} geometry={geometry}>
          {/* Materials for each face */}
          <meshStandardMaterial
            attach='material-0'
            map={texture}
            roughness={0.45}
            metalness={0.2}
          />
          <meshStandardMaterial
            attach='material-1'
            map={texture}
            roughness={0.45}
            metalness={0.2}
          />
          <meshStandardMaterial
            attach='material-2'
            map={texture}
            roughness={0.45}
            metalness={0.2}
          />
          <meshStandardMaterial
            attach='material-3'
            map={texture}
            roughness={0.45}
            metalness={0.2}
          />
          <meshStandardMaterial
            attach='material-4'
            map={texture}
            roughness={0.08}
            metalness={0.0}
            emissiveIntensity={0.12}
          />

          <meshStandardMaterial attach='material-5' color='#333333' />
        </mesh>
      </group>
    );
  } else {
    // Fallback for non-rectangular shapes
    const createGeometry = (): THREE.BufferGeometry => {
      switch (shape) {
        case 'round':
          return new THREE.CircleGeometry(0.9, 64);
        case 'hexagon':
          return new THREE.CircleGeometry(0.9, 6);
        case 'octagon':
          return new THREE.CircleGeometry(0.9, 8);
        case 'dodecagon':
          return new THREE.CircleGeometry(0.9, 12);
        default:
          return new THREE.PlaneGeometry(1.8, 1.35);
      }
    };

    return (
      <group castShadow receiveShadow>
        <mesh position={[0, 0, -frameDepth / 2]}>
          <cylinderGeometry args={[0.9, 0.9, frameDepth, 64]} />
          <meshStandardMaterial
            color='#9a9a9a'
            roughness={0.45}
            metalness={0.2}
          />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <primitive object={createGeometry()} />
          <meshStandardMaterial map={texture} transparent={true} />
        </mesh>
      </group>
    );
  }
};

const CameraControls = ({
  controlsRef,
}: {
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
}) => {
  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      enableDamping={true}
      dampingFactor={0.05}
      minDistance={1}
      maxDistance={15}
      autoRotate={false}
      autoRotateSpeed={2}
      zoomSpeed={0.6}
      panSpeed={0.8}
      rotateSpeed={0.4}
    />
  );
};

const ThreeDCanvas = ({ isVisible }: ThreeDCanvasProps) => {
  const { preview, shape } = useUpload();
  const { edgeType } = useEdge();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(false);

  const handleCenter = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      const camera = controls.object as THREE.PerspectiveCamera;

      const bounds = { width: 1.8, height: 1.35 };
      const maxDimension = Math.max(bounds.width, bounds.height);
      const fov = camera.fov * (Math.PI / 180);
      const optimalDistance = (maxDimension / (2 * Math.tan(fov / 2))) * 1.5;

      const duration = 800;
      const startTime = Date.now();
      const startPosition = camera.position.clone();
      const startTarget = controls.target.clone();

      const targetPosition = new THREE.Vector3(0, 0, optimalDistance);
      const targetTarget = new THREE.Vector3(0, 0, 0);

      const animateToCenter = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4);

        camera.position.lerpVectors(
          startPosition,
          targetPosition,
          easeProgress
        );
        controls.target.lerpVectors(startTarget, targetTarget, easeProgress);
        controls.update();

        if (progress < 1) requestAnimationFrame(animateToCenter);
      };
      animateToCenter();
    }
  };

  const handleZoom = (factor: number) => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      const camera = controls.object as THREE.PerspectiveCamera;

      const duration = 500;
      const startTime = Date.now();
      const startPosition = camera.position.clone();
      const currentDistance = controls.target.distanceTo(camera.position);
      const targetDistance = THREE.MathUtils.clamp(
        currentDistance * factor,
        controls.minDistance,
        controls.maxDistance
      );

      const direction = camera.position
        .clone()
        .sub(controls.target)
        .normalize();

      const animateZoom = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        const newDistance =
          currentDistance + (targetDistance - currentDistance) * easeProgress;
        const newPosition = controls.target
          .clone()
          .add(direction.clone().multiplyScalar(newDistance));

        camera.position.copy(newPosition);
        controls.update();

        if (progress < 1) requestAnimationFrame(animateZoom);
      };
      animateZoom();
    }
  };

  const handleAutoRotate = () => {
    if (controlsRef.current) {
      const newAutoRotate = !controlsRef.current.autoRotate;
      controlsRef.current.autoRotate = newAutoRotate;
      setIsAutoRotating(newAutoRotate);
    }
  };

  useEffect(() => {
    if (isVisible && preview) {
      const t = setTimeout(() => handleCenter(), 220);
      return () => clearTimeout(t);
    }
  }, [isVisible, preview]);

  if (!isVisible) return null;

  return (
    <div className='w-full h-full relative' style={{ isolation: 'isolate' }}>
      <Canvas
        shadows
        camera={{ position: [0, 0, 4], fov: 50 }}
        style={{
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          pointerEvents: 'auto',
        }}
        className='pointer-events-auto'
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={4}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <directionalLight position={[-4, 6, -4]} intensity={1.5} />

          {preview && (
            <Frame3D imageUrl={preview} shape={shape} edgeType={edgeType} />
          )}

          <ContactShadows
            rotation-x={Math.PI / 2}
            position={[0, -1.5, 0]}
            opacity={0.15}
            width={4}
            height={4}
            blur={1.5}
            far={2}
          />
          <CameraControls controlsRef={controlsRef} />
        </Suspense>
      </Canvas>
      {/* 3D Controls - Responsive */}
      <div
        className='absolute top-2 left-2 md:top-4 md:left-4 z-[9999]'
        style={{ pointerEvents: 'auto', isolation: 'isolate' }}
      >
        {/* Desktop Layout - Horizontal */}
        <div
          className='hidden md:flex bg-white rounded-full px-2 py-1.5 shadow-lg border border-gray-200 items-center gap-2 hover:shadow-xl transition-shadow duration-300'
          style={{ pointerEvents: 'auto' }}
        >
          {/* Play/Rotate Button */}
          <button
            onClick={handleAutoRotate}
            type='button'
            className='flex items-center gap-1 px-2 py-1.5 rounded-full transition-all duration-200 hover:bg-pink-50 hover:scale-105 active:scale-95 cursor-pointer'
            style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1 }}
          >
            <svg
              className='w-3 h-3 text-pink-500 transition-transform duration-200 hover:rotate-12'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M8 5v14l11-7z' />
            </svg>
            <span className='text-xs font-medium text-pink-500 transition-colors duration-200'>
              {isAutoRotating ? 'Stop' : 'Play'}
            </span>
          </button>

          {/* Divider */}
          <div className='w-px h-5 bg-gray-200'></div>

          {/* Center Button */}
          <button
            onClick={handleCenter}
            type='button'
            className='flex items-center gap-1 px-2 py-1.5 rounded-full transition-all duration-200 hover:bg-pink-50 hover:scale-105 active:scale-95 cursor-pointer'
            style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1 }}
          >
            <svg
              className='w-3 h-3 text-pink-500 transition-transform duration-200 hover:scale-110'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <circle cx='12' cy='12' r='3' />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 1v6m0 10v6m11-7h-6m-10 0H1'
              />
            </svg>
            <span className='text-xs font-medium text-pink-500 transition-colors duration-200'>
              Center
            </span>
          </button>

          {/* Divider */}
          <div className='w-px h-5 bg-gray-200'></div>

          {/* Zoom In Button */}
          <button
            onClick={() => handleZoom(0.7)}
            type='button'
            className='flex items-center gap-1 px-2 py-1.5 rounded-full transition-all duration-200 hover:bg-pink-50 hover:scale-105 active:scale-95 cursor-pointer'
            style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1 }}
          >
            <svg
              className='w-3 h-3 text-pink-500 transition-transform duration-200 hover:scale-125'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <circle cx='11' cy='11' r='8' />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='m21 21-4.35-4.35M11 8v6m-3-3h6'
              />
            </svg>
            <span className='text-xs font-medium text-pink-500 transition-colors duration-200'>
              Zoom In
            </span>
          </button>

          {/* Divider */}
          <div className='w-px h-5 bg-gray-200'></div>

          {/* Zoom Out Button */}
          <button
            onClick={() => handleZoom(1.4)}
            type='button'
            className='flex items-center gap-1 px-2 py-1.5 rounded-full transition-all duration-200 hover:bg-pink-50 hover:scale-105 active:scale-95 cursor-pointer'
            style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1 }}
          >
            <svg
              className='w-3 h-3 text-pink-500 transition-transform duration-200 hover:scale-90'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <circle cx='11' cy='11' r='8' />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='m21 21-4.35-4.35M8 11h6'
              />
            </svg>
            <span className='text-xs font-medium text-pink-500 transition-colors duration-200'>
              Zoom Out
            </span>
          </button>
        </div>

        {/* Mobile Layout - Vertical Stack */}
        <div
          className='md:hidden flex flex-col gap-2'
          style={{ pointerEvents: 'auto' }}
        >
          {/* Play/Rotate Button */}
          <button
            onClick={handleAutoRotate}
            type='button'
            className='bg-white rounded-full p-2.5 shadow-lg border border-gray-200 transition-all duration-200 hover:bg-pink-50 active:scale-95 cursor-pointer'
            style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1 }}
          >
            <svg
              className='w-4 h-4 text-pink-500'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M8 5v14l11-7z' />
            </svg>
          </button>

          {/* Center Button */}
          <button
            onClick={handleCenter}
            type='button'
            className='bg-white rounded-full p-2.5 shadow-lg border border-gray-200 transition-all duration-200 hover:bg-pink-50 active:scale-95 cursor-pointer'
            style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1 }}
          >
            <svg
              className='w-4 h-4 text-pink-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <circle cx='12' cy='12' r='3' />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 1v6m0 10v6m11-7h-6m-10 0H1'
              />
            </svg>
          </button>

          {/* Zoom In Button */}
          <button
            onClick={() => handleZoom(0.7)}
            type='button'
            className='bg-white rounded-full p-2.5 shadow-lg border border-gray-200 transition-all duration-200 hover:bg-pink-50 active:scale-95 cursor-pointer'
            style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1 }}
          >
            <svg
              className='w-4 h-4 text-pink-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <circle cx='11' cy='11' r='8' />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='m21 21-4.35-4.35M11 8v6m-3-3h6'
              />
            </svg>
          </button>

          {/* Zoom Out Button */}
          <button
            onClick={() => handleZoom(1.4)}
            type='button'
            className='bg-white rounded-full p-2.5 shadow-lg border border-gray-200 transition-all duration-200 hover:bg-pink-50 active:scale-95 cursor-pointer'
            style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1 }}
          >
            <svg
              className='w-4 h-4 text-pink-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <circle cx='11' cy='11' r='8' />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='m21 21-4.35-4.35M8 11h6'
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreeDCanvas;
