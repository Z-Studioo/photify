'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useUpload, type CanvasShape } from '@/context/UploadContext';

interface ThreeDCanvasProps {
  isVisible: boolean;
}

// 3D Frame component with true gallery-wrapped edges
const Frame3D = ({
  imageUrl,
  shape,
}: {
  imageUrl: string;
  shape: CanvasShape;
}) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (imageUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(imageUrl, loadedTexture => {
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

  const frameDepth = 0.06;

  // Memoize the geometry so it's only created once
  const geometry = useMemo(() => {
    if (shape !== 'rectangle') return null;

    const box = new THREE.BoxGeometry(1.8, 1.35, frameDepth);
    const uv = box.getAttribute('uv');

    // BoxGeometry UV Map Layout:
    // 4 triangles per side * 2 UVs per triangle vertex * 6 sides = 48 UVs
    // Each face consists of 2 triangles (4 vertices).
    // The order is: Right, Left, Top, Bottom, Front, Back

    // We will modify the UVs for the edge faces to map to the very edge pixels
    // of the texture.

    // Right Face (indices 0 to 3) -> Use U = 1 (right edge of texture)
    uv.setXY(0, 1, 1);
    uv.setXY(1, 1, 1);
    uv.setXY(2, 1, 0);
    uv.setXY(3, 1, 0);

    // Left Face (indices 4 to 7) -> Use U = 0 (left edge of texture)
    uv.setXY(4, 0, 1);
    uv.setXY(5, 0, 1);
    uv.setXY(6, 0, 0);
    uv.setXY(7, 0, 0);

    // Top Face (indices 8 to 11) -> Use V = 1 (top edge of texture)
    uv.setXY(8, 0, 1);
    uv.setXY(9, 1, 1);
    uv.setXY(10, 0, 1);
    uv.setXY(11, 1, 1);

    // Bottom Face (indices 12 to 15) -> Use V = 0 (bottom edge of texture)
    uv.setXY(12, 0, 0);
    uv.setXY(13, 1, 0);
    uv.setXY(14, 0, 0);
    uv.setXY(15, 1, 0);

    // Front Face (indices 16 to 19) -> Use full texture (0,0 to 1,1)
    // This is the default, but we set it explicitly for clarity.
    uv.setXY(16, 0, 1);
    uv.setXY(17, 1, 1);
    uv.setXY(18, 0, 0);
    uv.setXY(19, 1, 0);

    // Back Face (indices 20 to 23) -> We don't care about its UVs
    // since it will have a solid color.

    return box;
  }, [shape]);

  if (!texture) return null;

  if (shape === 'rectangle' && geometry) {
    return (
      <group castShadow receiveShadow>
        <mesh position={[0, 0, -frameDepth / 2]} geometry={geometry}>
          {/* We provide 6 materials, one for each face of the box. */}
          {/* 0: Right, 1: Left, 2: Top, 3: Bottom, 4: Front, 5: Back */}
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
            emissive={'#1a1a1a'}
            emissiveIntensity={0.12}
          />
          <meshStandardMaterial attach='material-5' color='#333333' />
        </mesh>
      </group>
    );
  } else {
    // Fallback for non-rectangular shapes
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
  const controlsRef = useRef<any>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(false);

  const handleCenter = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      const camera = controls.object;

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
      const duration = 500;
      const startTime = Date.now();
      const startDistance = controls.getDistance();
      const targetDistance = THREE.MathUtils.clamp(
        startDistance * factor,
        controls.minDistance,
        controls.maxDistance
      );

      const animateZoom = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        controls.dollyTo(
          startDistance + (targetDistance - startDistance) * easeProgress
        );
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
    <div className='w-full h-full relative'>
      <Canvas
        shadows
        camera={{ position: [0, 0, 4], fov: 50 }}
        style={{
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <hemisphereLight
            skyColor='#ffffff'
            groundColor='#dcdcdc'
            intensity={0.6}
          />
          <directionalLight
            position={[5, 8, 5]}
            intensity={4}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <directionalLight position={[-4, 6, -4]} intensity={1.5} />

          {preview && <Frame3D imageUrl={preview} shape={shape} />}

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
      <div className='absolute top-4 left-4 z-50 flex items-start gap-2'>
        <div className='relative group'>
          <button className='bg-white/80 backdrop-blur-sm rounded-full p-3 shadow-lg border border-gray-200/50'>
            <svg
              className='w-6 h-6 text-gray-700'
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
          </button>
          <div className='absolute top-0 left-full ml-2 bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-gray-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-x-2 group-hover:translate-x-0'>
            <div className='flex flex-col gap-1'>
              <button
                onClick={handleCenter}
                className='text-gray-700 hover:bg-gray-200/60 rounded-lg p-2 transition-colors flex items-center gap-2'
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
                <span className='text-sm font-medium whitespace-nowrap'>
                  Center
                </span>
              </button>
              <button
                onClick={() => handleZoom(0.7)}
                className='text-gray-700 hover:bg-gray-200/60 rounded-lg p-2 transition-colors flex items-center gap-2'
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
                <span className='text-sm font-medium whitespace-nowrap'>
                  Zoom In
                </span>
              </button>
              <button
                onClick={() => handleZoom(1.4)}
                className='text-gray-700 hover:bg-gray-200/60 rounded-lg p-2 transition-colors flex items-center gap-2'
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
                <span className='text-sm font-medium whitespace-nowrap'>
                  Zoom Out
                </span>
              </button>
              <button
                onClick={handleAutoRotate}
                className={`text-gray-700 hover:bg-gray-200/60 rounded-lg p-2 transition-colors flex items-center gap-2 ${isAutoRotating ? 'bg-blue-100 text-blue-600' : ''}`}
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
                    d='M4 12a8 8 0 0 1 8-8V2.5M20 12a8 8 0 0 1-8 8v1.5M8 6l4-4 4 4M16 18l-4 4-4-4'
                  />
                </svg>
                <span className='text-sm font-medium whitespace-nowrap'>
                  {isAutoRotating ? 'Stop' : 'Rotate'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeDCanvas;
