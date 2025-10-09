'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { Suspense, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useUpload, type CanvasShape } from '@/context/UploadContext';

interface ThreeDCanvasProps {
  isVisible: boolean;
}

// 3D Frame component with realistic materials
const Frame3D = ({
  imageUrl,
  shape,
}: {
  imageUrl: string;
  shape: CanvasShape;
}) => {
  const frameRef = useRef<THREE.Group>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

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
        // Ensure sRGB encoding so colors look correct when rendering
        // backwards-compatible with older three.js versions
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
        return new THREE.PlaneGeometry(1.8, 1.35); // Adjusted to fit inside frame
    }
  };

  // Frame geometry based on shape - optimized for standalone view
  const createFrameGeometry = () => {
    const frameThickness = 0.08;
    const frameDepth = 0.06;

    if (shape === 'rectangle') {
      return (
        <group>
          {/* Main frame - sleek modern design */}
          <mesh position={[0, 0, -frameDepth / 2]}>
            <boxGeometry args={[2.0, 1.55, frameDepth]} />
            <meshStandardMaterial
              color='#2c2c2c'
              roughness={0.3}
              metalness={0.7}
            />
          </mesh>

          {/* Inner bevel edges for depth */}
          <mesh position={[0, 0.775, -frameDepth / 4]}>
            <boxGeometry args={[2.0, frameThickness / 2, frameDepth / 2]} />
            <meshStandardMaterial
              color='#1a1a1a'
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
          <mesh position={[0, -0.775, -frameDepth / 4]}>
            <boxGeometry args={[2.0, frameThickness / 2, frameDepth / 2]} />
            <meshStandardMaterial
              color='#1a1a1a'
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
          <mesh position={[1.0, 0, -frameDepth / 4]}>
            <boxGeometry args={[frameThickness / 2, 1.55, frameDepth / 2]} />
            <meshStandardMaterial
              color='#1a1a1a'
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
          <mesh position={[-1.0, 0, -frameDepth / 4]}>
            <boxGeometry args={[frameThickness / 2, 1.55, frameDepth / 2]} />
            <meshStandardMaterial
              color='#1a1a1a'
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
        </group>
      );
    } else {
      // Circular frame for other shapes
      return (
        <group>
          <mesh position={[0, 0, -frameDepth / 2]}>
            <cylinderGeometry args={[1.15, 1.15, frameDepth, 64]} />
            <meshStandardMaterial
              color='#2c2c2c'
              roughness={0.3}
              metalness={0.7}
            />
          </mesh>
          {/* Inner ring for depth */}
          <mesh position={[0, 0, -frameDepth / 4]}>
            <cylinderGeometry args={[1.0, 1.0, frameDepth / 2, 64]} />
            <meshStandardMaterial
              color='#1a1a1a'
              roughness={0.2}
              metalness={0.8}
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

      {/* Photo/Image with enhanced material */}
      {texture && (
        <mesh position={[0, 0, 0.01]} rotation={[0, 0, 0]} castShadow>
          <primitive object={createGeometry()} />
          <meshStandardMaterial
            map={texture}
            transparent={shape !== 'rectangle'}
            side={THREE.FrontSide}
            roughness={0.08}
            metalness={0.0}
            // stronger emissive to brighten dark images
            emissive={'#1a1a1a'}
            emissiveIntensity={0.12}
            toneMapped={true}
          />
        </mesh>
      )}

      {/* Minimal inner shadow to avoid darkening */}
      <mesh position={[0, 0, 0.005]}>
        {shape === 'rectangle' ? (
          <planeGeometry args={[1.8, 1.35]} />
        ) : (
          <primitive object={new THREE.CircleGeometry(0.9, 64)} />
        )}
        <meshBasicMaterial color='black' transparent opacity={0.01} />
      </mesh>
    </group>
  );
};

// Camera controls component to access OrbitControls ref
const CameraControls = ({
  controlsRef,
}: {
  controlsRef: React.MutableRefObject<any>;
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
  const [cameraPosition, setCameraPosition] = useState<
    [number, number, number]
  >([0, 0, 4]);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    // Animate camera position when view becomes visible
    if (isVisible) {
      setCameraPosition([2, 1, 5]);
    }
  }, [isVisible]);

  // Camera control functions - Center feature like Whitewall
  const handleCenter = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      const camera = controls.object;

      // Frame bounds for different shapes (including frame border)
      const getFrameBounds = () => {
        switch (shape) {
          case 'round':
          case 'hexagon':
          case 'octagon':
          case 'dodecagon':
            return { width: 2.3, height: 2.3 }; // Circular bounds with frame
          default:
            return { width: 2.2, height: 1.75 }; // Rectangle bounds with frame
        }
      };

      const bounds = getFrameBounds();
      const maxDimension = Math.max(bounds.width, bounds.height);

      // Calculate optimal distance to fit frame in view (like Whitewall)
      const fov = camera.fov * (Math.PI / 180); // Convert to radians
      const optimalDistance = (maxDimension / (2 * Math.tan(fov / 2))) * 1.5; // 1.5 for comfortable padding

      // Smooth animation to center and optimal distance
      const duration = 800; // milliseconds
      const startTime = Date.now();
      const startPosition = camera.position.clone();
      const startTarget = controls.target.clone();

      // Target position - directly in front of frame
      const targetPosition = new THREE.Vector3(0, 0, optimalDistance);
      const targetTarget = new THREE.Vector3(0, 0, 0); // Frame center

      const animateToCenter = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease in-out cubic for smooth acceleration and deceleration
        const easeProgress =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        // Interpolate camera position
        const currentPosition = startPosition
          .clone()
          .lerp(targetPosition, easeProgress);
        camera.position.copy(currentPosition);

        // Interpolate target position
        const currentTarget = startTarget
          .clone()
          .lerp(targetTarget, easeProgress);
        controls.target.copy(currentTarget);

        controls.update();

        if (progress < 1) {
          requestAnimationFrame(animateToCenter);
        }
      };

      animateToCenter();
    }
  };

  const handleZoomIn = () => {
    if (controlsRef.current) {
      // Smooth zoom in with easing
      const duration = 500; // milliseconds
      const startTime = Date.now();
      const startDistance = controlsRef.current.getDistance();
      const targetDistance = Math.max(
        startDistance * 0.7,
        controlsRef.current.minDistance
      );

      const animateZoom = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic for smooth deceleration
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentDistance =
          startDistance + (targetDistance - startDistance) * easeProgress;

        // Set camera position to achieve desired distance
        const camera = controlsRef.current.object;
        const target = controlsRef.current.target;
        const direction = camera.position.clone().sub(target).normalize();
        camera.position
          .copy(target)
          .add(direction.multiplyScalar(currentDistance));

        controlsRef.current.update();

        if (progress < 1) {
          requestAnimationFrame(animateZoom);
        }
      };

      animateZoom();
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current) {
      // Smooth zoom out with easing
      const duration = 500; // milliseconds
      const startTime = Date.now();
      const startDistance = controlsRef.current.getDistance();
      const targetDistance = Math.min(
        startDistance * 1.4,
        controlsRef.current.maxDistance
      );

      const animateZoom = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic for smooth deceleration
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentDistance =
          startDistance + (targetDistance - startDistance) * easeProgress;

        // Set camera position to achieve desired distance
        const camera = controlsRef.current.object;
        const target = controlsRef.current.target;
        const direction = camera.position.clone().sub(target).normalize();
        camera.position
          .copy(target)
          .add(direction.multiplyScalar(currentDistance));

        controlsRef.current.update();

        if (progress < 1) {
          requestAnimationFrame(animateZoom);
        }
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

  // Auto-center when switching to 3D view so users see a nicely framed image immediately
  useEffect(() => {
    if (isVisible && preview) {
      // small delay to ensure controls & camera are mounted
      const t = setTimeout(() => {
        try {
          handleCenter()
        } catch (e) {
          // ignore - defensive
          // console.warn('auto-center failed', e)
        }
      }, 220)

      return () => clearTimeout(t)
    }
  }, [isVisible, preview])

  if (!isVisible) return null;

  // Debug: Log when component renders
  console.log('ThreeDCanvas rendering with controls');

  return (
    <div className='w-full h-full relative'>
      <Canvas
        shadows
        camera={{ position: cameraPosition, fov: 50 }}
        style={{
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        }}
      >
        <Suspense fallback={null}>
          {/* Enhanced lighting for vibrant photos */}
          <ambientLight intensity={0.4} color='#ffffff' />
          <directionalLight
            position={[5, 8, 5]}
            intensity={2.0}
            color='#ffffff'
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={20}
            shadow-camera-left={-5}
            shadow-camera-right={5}
            shadow-camera-top={5}
            shadow-camera-bottom={-5}
          />
          <pointLight position={[-3, 4, 3]} intensity={0.8} color='#fff8dc' />
          <pointLight position={[3, 4, 3]} intensity={0.6} color='#f0f8ff' />
          <spotLight
            position={[0, 6, 4]}
            angle={0.4}
            penumbra={0.3}
            intensity={1.2}
            color='#ffffff'
            target-position={[0, 0, 0]}
          />

          {/* Frame with image - centered in view */}
          {preview && <Frame3D imageUrl={preview} shape={shape} />}

          {/* Simple ground shadow */}
          <ContactShadows
            rotation-x={Math.PI / 2}
            position={[0, -1.5, 0]}
            opacity={0.15}
            width={4}
            height={4}
            blur={1.5}
            far={2}
          />

          {/* Camera controls with full freedom */}
          <CameraControls controlsRef={controlsRef} />
        </Suspense>
      </Canvas>

      {/* Floating 3D Controls - Hover to Reveal */}
      <div className='absolute top-6 left-6 z-50 group'>
        {/* Main Floating Button */}
        <div className='bg-primary hover:bg-primary/90 text-white rounded-full p-3 shadow-xl transition-all duration-300 cursor-pointer'>
          <svg
            className='w-6 h-6'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z'
            />
          </svg>
        </div>

        {/* Expanded Controls - Show on Hover */}
        <div className='absolute top-0 left-16 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-x-2 group-hover:translate-x-0'>
          <div className='flex flex-col gap-2 min-w-[140px]'>
            {/* Center Button */}
            <button
              onClick={handleCenter}
              className='bg-primary/10 hover:bg-primary/20 text-primary rounded-lg p-2.5 transition-all duration-200 hover:scale-105 border border-primary/30 flex items-center gap-3'
            >
              <svg
                className='w-4 h-4'
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
              <span className='text-sm font-medium'>Center</span>
            </button>

            {/* Zoom In */}
            <button
              onClick={handleZoomIn}
              className='bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg p-2.5 transition-all duration-200 hover:scale-105 border border-gray-200 flex items-center gap-3'
            >
              <svg
                className='w-4 h-4'
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
              <span className='text-sm font-medium'>Zoom In</span>
            </button>

            {/* Zoom Out */}
            <button
              onClick={handleZoomOut}
              className='bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg p-2.5 transition-all duration-200 hover:scale-105 border border-gray-200 flex items-center gap-3'
            >
              <svg
                className='w-4 h-4'
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
              <span className='text-sm font-medium'>Zoom Out</span>
            </button>

            {/* Auto Rotate */}
            <button
              onClick={handleAutoRotate}
              className={`rounded-lg p-2.5 transition-all duration-200 hover:scale-105 border flex items-center gap-3 ${
                isAutoRotating
                  ? 'bg-primary hover:bg-primary/90 text-white border-primary'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 12a8 8 0 0 1 8-8V2.5'
                />
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M20 12a8 8 0 0 1-8 8v1.5'
                />
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 6l4-4 4 4M16 18l-4 4-4-4'
                />
              </svg>
              <span className='text-sm font-medium'>
                {isAutoRotating ? 'Stop Rotate' : 'Auto Rotate'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeDCanvas;
