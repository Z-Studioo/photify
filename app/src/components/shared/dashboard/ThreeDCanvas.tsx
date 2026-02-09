import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useUpload, type CanvasShape, type CornerStyle } from '@/context/UploadContext';
import { useEdge, type EdgeType } from '@/context/EdgeContext';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import backpanel from '@/assets/images/backpanel.png';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { motion } from 'motion/react';

interface ThreeDCanvasProps {
  isVisible: boolean;
  focusOnEdge?: boolean;
}

export const applyRoundedBoxUVs = (
  geometry: THREE.BufferGeometry,
  width: number,
  height: number,
  depth: number,
  edgeType: EdgeType
) => {
  const pos = geometry.getAttribute('position') as THREE.BufferAttribute;
  const normal = geometry.getAttribute('normal') as THREE.BufferAttribute;
  const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;

  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;

  const wrapX = depth / width;
  const wrapY = depth / height;
  const sideWrapX = wrapX * 3;
  const sideWrapY = wrapY * 3;
  const edgeSlice = 0.005;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const nx = normal.getX(i);
    const ny = normal.getY(i);
    const nz = normal.getZ(i);

    let u = 0;
    let v = 0;

    const ax = Math.abs(nx);
    const ay = Math.abs(ny);
    const az = Math.abs(nz);

    if (az >= ax && az >= ay) {
      // front/back
      u = (x + halfW) / width;
      v = (y + halfH) / height;
    } else if (ax >= ay) {
      // left/right
      const baseU = (z + halfD) / depth;
      const baseV = (y + halfH) / height;

      if (edgeType === 'mirrored') {
        u =
          nx > 0
            ? 1 + sideWrapX - baseU * sideWrapX
            : 0 - sideWrapX + baseU * sideWrapX;
      } else {
        u = nx > 0 ? 1 - edgeSlice + baseU * edgeSlice : baseU * edgeSlice;
      }
      v = baseV;
    } else {
      // top/bottom
      const baseU = (x + halfW) / width;
      const baseV = (z + halfD) / depth;

      if (edgeType === 'mirrored') {
        v =
          ny > 0
            ? 1 + sideWrapY - baseV * sideWrapY
            : 0 - sideWrapY + baseV * sideWrapY;
      } else {
        v = ny > 0 ? 1 - edgeSlice + baseV * edgeSlice : baseV * edgeSlice;
      }
      u = baseU;
    }

    uv.setXY(i, u, v);
  }

  uv.needsUpdate = true;
};

const Frame3D = ({
  imageUrl,
  shape,
  edgeType,
  cornerStyle = 'rounded',
}: {
  imageUrl: string;
  shape: CanvasShape;
  edgeType: 'wrapped' | 'mirrored';
  cornerStyle?: CornerStyle;
}) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const backTexture = useLoader(THREE.TextureLoader, backpanel as string);

  useEffect(() => {
    if (backTexture) {
      if ('colorSpace' in backTexture) {
        (backTexture as THREE.Texture).colorSpace = THREE.SRGBColorSpace;
      }
      backTexture.needsUpdate = true;
    }
  }, [backTexture]);

  const { selectedSize } = useUpload();

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
          (loadedTexture as THREE.Texture).colorSpace = THREE.SRGBColorSpace;
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

  const frameDepth = 0.06;
  const BASE_SIZE = 15;

  const geometry = useMemo(() => {
    if (shape !== 'rectangle') return null;

    const frameWidth =
      selectedSize?.width_in && !isNaN(selectedSize.height_in / BASE_SIZE)
        ? selectedSize.width_in / BASE_SIZE
        : 1.8;

    const frameHeight =
      selectedSize?.height_in && !isNaN(selectedSize.height_in / BASE_SIZE)
        ? selectedSize.height_in / BASE_SIZE
        : 1.35;

    const cornerRadius = cornerStyle === 'sharp'
      ? 0
      : Math.min(0.08, frameDepth * 0.5, frameWidth * 0.02, frameHeight * 0.02);
    const smoothness = 8;

    const box = new RoundedBoxGeometry(
      frameWidth,
      frameHeight,
      frameDepth,
      smoothness,
      cornerRadius
    );

    applyRoundedBoxUVs(box, frameWidth, frameHeight, frameDepth, edgeType);

    return box;
  }, [
    shape,
    edgeType,
    selectedSize?.width_in,
    selectedSize?.height_in,
    cornerStyle,
  ]);

  if (!texture) return null;

  if (shape === 'rectangle' && geometry) {
    return (
      <group castShadow receiveShadow>
        <mesh position={[0, 0, -frameDepth / 2]} geometry={geometry}>
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
          <meshStandardMaterial
            attach='material-5'
            map={backTexture}
            roughness={0.1}
            metalness={0}
          />
        </mesh>
      </group>
    );
  } else {
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

const ThreeDCanvas = ({
  isVisible,
  focusOnEdge = false,
}: ThreeDCanvasProps) => {
  const { preview, shape } = useUpload();
  const { edgeType } = useEdge();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  // const [cornered, setCornered] = useState<boolean>(false);
  const { cornerStyle, setCornerStyle } = useUpload();

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
      const startTarget = controls.target.clone();

      const targetPosition = new THREE.Vector3(0, 0, optimalDistance);
      const targetTarget = new THREE.Vector3(0, 0, 0);

      const animateToCenter = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4);

        camera.position.lerpVectors(
          camera.position,
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

  const focusCameraOnEdge = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      const camera = controls.object as THREE.PerspectiveCamera;

      const duration = 1000;
      const startTime = Date.now();
      const startTarget = controls.target.clone();

      const targetPosition = new THREE.Vector3(1.8, 0.25, 1.2);
      const targetTarget = new THREE.Vector3(0, 0, 0);

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4);

        camera.position.lerpVectors(
          camera.position,
          targetPosition,
          easeProgress
        );
        controls.target.lerpVectors(startTarget, targetTarget, easeProgress);
        controls.update();

        if (progress < 1) requestAnimationFrame(animate);
      };
      animate();
    }
  };

  useEffect(() => {
    if (isVisible && preview && focusOnEdge) {
      const focusWithRetry = (retryCount = 0) => {
        if (controlsRef.current) {
          focusCameraOnEdge();
        } else if (retryCount < 8) {
          setTimeout(() => focusWithRetry(retryCount + 1), 100);
        }
      };

      focusWithRetry();
    }
  }, [isVisible, preview, focusOnEdge]);

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
            <Frame3D
              imageUrl={preview}
              shape={shape}
              edgeType={edgeType}
              cornerStyle={cornerStyle}
            />
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
      <div
        className='flex justify-end absolute top-10 right-4 md:top-16 md:left-4 z-[9999]'
        style={{ pointerEvents: 'auto', isolation: 'isolate' }}
      >
        <motion.div
          className='fixed flex gap-2 pointer-events-auto right-0 md:right-2'
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 0.5,
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className='flex border border-gray-300 divide-x divide-gray-300'>
            <motion.button
              onClick={() => setCornerStyle('sharp')}
              className={`flex items-center justify-center px-2 py-2 md:px-5 md:py-3 text-xs md:text-sm font-medium rounded-none cursor-pointer transition-all flex-shrink-0 whitespace-nowrap ${
                cornerStyle === 'sharp'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              type='button'
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className='hidden md:inline ml-1'>Sharp</span>
              <span className='md:hidden'>Sharp</span>
            </motion.button>

            <motion.button
              onClick={() => setCornerStyle('rounded')}
              className={`flex items-center justify-center px-2 py-2 md:px-5 md:py-3 text-xs md:text-sm font-medium rounded-none cursor-pointer transition-all flex-shrink-0 whitespace-nowrap ${
                cornerStyle === 'rounded'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              type='button'
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className='hidden md:inline ml-1'>Rounded</span>
              <span className='md:hidden'>Round</span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      <div
        className='absolute top-2 left-2 md:top-4 md:left-4 z-[9999]'
        style={{ pointerEvents: 'auto', isolation: 'isolate' }}
      >
        <div
          className='hidden md:flex bg-white rounded-full px-2 py-1.5 shadow-lg border border-gray-200 items-center gap-2 hover:shadow-xl transition-shadow duration-300'
          style={{ pointerEvents: 'auto' }}
        >
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

          <div className='w-px h-5 bg-gray-200' />

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

          <div className='w-px h-5 bg-gray-200' />

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

          <div className='w-px h-5 bg-gray-200' />

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

        <div
          className='md:hidden flex flex-col gap-2'
          style={{ pointerEvents: 'auto' }}
        >
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
