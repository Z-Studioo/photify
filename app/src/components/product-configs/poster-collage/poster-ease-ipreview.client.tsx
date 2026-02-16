import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

interface PosterEaselPreviewProps {
  imageUrl: string | null;
  width: number; // Poster width in inches
  height: number; // Poster height in inches
  showRuler?: boolean;
  wallColor?: string;
}

// Poster on Canvas Mesh (on easel stand)
function PosterCanvasMesh({
  imageUrl,
  width,
  height,
}: {
  imageUrl: string | null;
  width: number;
  height: number;
}) {
  const INCHES_TO_UNITS = 0.1;
  const CANVAS_DEPTH = 0.75; // inches (thinner for poster)

  const canvasWidth = width * INCHES_TO_UNITS;
  const canvasHeight = height * INCHES_TO_UNITS;
  const canvasDepth = CANVAS_DEPTH * INCHES_TO_UNITS;

  // Load poster image texture
  const imageTexture = useMemo(() => {
    if (!imageUrl) return null;
    const loader = new THREE.TextureLoader();
    const texture = loader.load(imageUrl);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [imageUrl]);

  // Rounded box geometry for canvas
  const roundedBoxGeometry = useMemo(() => {
    const cornerRadius = Math.min(
      0.01,
      canvasDepth * 0.5,
      canvasWidth * 0.01,
      canvasHeight * 0.01
    );
    return new RoundedBoxGeometry(
      canvasWidth,
      canvasHeight,
      canvasDepth,
      8,
      cornerRadius
    );
  }, [canvasWidth, canvasHeight, canvasDepth]);

  // Position: On easel, resting on the ledge
  // Ledge is at Y=1.15, support pegs at Z=-0.08
  // Calculate poster center position dynamically based on height
  const LEDGE_HEIGHT = 1.15;
  const TILT_OFFSET = 0.05; // Small offset to account for backward tilt
  const posterCenterY = LEDGE_HEIGHT + canvasHeight / 2 + TILT_OFFSET;
  const posterPosition: [number, number, number] = [0, posterCenterY, -0.1]; // Resting on ledge, aligned with support
  const posterRotation: [number, number, number] = [-0.15, 0, 0]; // Tilt BACKWARD (negative = lean back)

  if (!imageTexture) {
    return (
      <mesh
        position={posterPosition}
        castShadow
        receiveShadow
        geometry={roundedBoxGeometry}
      >
        <meshStandardMaterial color='#f0f0f0' roughness={0.7} metalness={0.0} />
      </mesh>
    );
  }

  return (
    <group position={posterPosition} rotation={posterRotation}>
      {/* Base canvas (white sides) */}
      <mesh geometry={roundedBoxGeometry} castShadow receiveShadow>
        <meshStandardMaterial color='#ffffff' roughness={0.7} metalness={0.0} />
      </mesh>

      {/* Front image overlay */}
      <mesh position={[0, 0, canvasDepth / 2 + 0.001]}>
        <planeGeometry args={[canvasWidth * 0.99, canvasHeight * 0.99]} />
        <meshStandardMaterial
          map={imageTexture}
          toneMapped={false}
          roughness={0.5}
          metalness={0.0}
        />
      </mesh>
    </group>
  );
}

// Wooden Easel Stand
function EaselStand({ posterHeight }: { posterHeight: number }) {
  const INCHES_TO_UNITS = 0.1;
  const posterHeightUnits = posterHeight * INCHES_TO_UNITS;

  // Easel dimensions
  const legWidth = 0.04;
  const legDepth = 0.03;
  const easelHeight = posterHeightUnits + 0.8; // Taller than poster
  const easelBaseWidth = 0.7;

  // Wood material
  const woodMaterial = useMemo(
    () => (
      <meshStandardMaterial
        color='#c9a86a' // Medium wood color
        roughness={0.85}
        metalness={0.0}
      />
    ),
    []
  );

  return (
    <group position={[0, 0, 0]}>
      {/* Back left leg - BEHIND the canvas */}
      <mesh position={[-easelBaseWidth / 2, easelHeight / 2, -0.25]} castShadow>
        <boxGeometry args={[legWidth, easelHeight, legDepth]} />
        {woodMaterial}
      </mesh>

      {/* Back right leg - BEHIND the canvas */}
      <mesh position={[easelBaseWidth / 2, easelHeight / 2, -0.25]} castShadow>
        <boxGeometry args={[legWidth, easelHeight, legDepth]} />
        {woodMaterial}
      </mesh>

      {/* Front center leg - moved back, supports from below */}
      <mesh
        position={[0, easelHeight / 2 - 0.5, 0.15]}
        rotation={[-Math.PI * 0.15, 0, 0]}
        castShadow
      >
        <boxGeometry args={[legWidth, easelHeight - 1.0, legDepth]} />
        {woodMaterial}
      </mesh>

      {/* Top crossbar - connects back legs, BEHIND canvas */}
      <mesh position={[0, easelHeight - 0.15, -0.25]} castShadow>
        <boxGeometry args={[easelBaseWidth + 0.15, legWidth, legDepth]} />
        {woodMaterial}
      </mesh>

      {/* Upper middle support bar - BEHIND canvas */}
      <mesh position={[0, easelHeight * 0.65, -0.22]} castShadow>
        <boxGeometry
          args={[easelBaseWidth - 0.1, legWidth * 0.7, legDepth * 0.8]}
        />
        {woodMaterial}
      </mesh>

      {/* Canvas ledge/support - BEHIND canvas, holds it up */}
      <mesh position={[0, 1.15, -0.15]} castShadow>
        <boxGeometry args={[easelBaseWidth - 0.1, 0.05, 0.12]} />
        {woodMaterial}
      </mesh>

      {/* Additional support pegs (small blocks that canvas rests on) */}
      <mesh position={[-0.3, 1.15, -0.08]} castShadow>
        <boxGeometry args={[0.06, 0.03, 0.06]} />
        {woodMaterial}
      </mesh>
      <mesh position={[0.3, 1.15, -0.08]} castShadow>
        <boxGeometry args={[0.06, 0.03, 0.06]} />
        {woodMaterial}
      </mesh>
    </group>
  );
}

// Room Environment with floor
function StudioRoomEnvironment({ wallColor }: { wallColor: string }) {
  // Floor
  const floorMaterial = useMemo(
    () => (
      <meshStandardMaterial
        color='#e8d5b7' // Light wood floor
        roughness={0.9}
        metalness={0.0}
      />
    ),
    []
  );

  // Wall material
  const wallMaterial = useMemo(
    () => (
      <meshStandardMaterial
        color={wallColor}
        roughness={0.95}
        metalness={0.0}
      />
    ),
    [wallColor]
  );

  return (
    <group>
      {/* Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        {floorMaterial}
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 2.5, -3]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        {wallMaterial}
      </mesh>

      {/* Left wall */}
      <mesh
        position={[-6, 2.5, 5]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[20, 10]} />
        {wallMaterial}
      </mesh>

      {/* Optional: Decorative plant */}
      <group position={[-2.2, 0, 0.8]}>
        {/* Pot */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.2, 0.4, 16]} />
          <meshStandardMaterial color='#d4c5b0' roughness={0.7} />
        </mesh>
        {/* Plant leaves */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <sphereGeometry args={[0.3, 10, 10]} />
          <meshStandardMaterial color='#5a8f6a' roughness={0.85} />
        </mesh>
        <mesh position={[0.1, 0.75, -0.1]} castShadow>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color='#6ba87d' roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

// Camera Animation
function CameraAnimator({
  posterCenterY,
  onComplete,
}: {
  posterCenterY: number;
  onComplete?: () => void;
}) {
  const { camera } = useThree();
  const progressRef = useRef(0);
  const hasCompleted = useRef(false);
  const hasStarted = useRef(false);

  const duration = 4; // seconds
  const startPosition: [number, number, number] = [-2.5, 2, 3.5];
  const endPosition: [number, number, number] = [0.8, 1.8, 3];
  const lookAtTarget: [number, number, number] = [0, posterCenterY, -0.1]; // Look at poster center (dynamic)

  useEffect(() => {
    camera.position.set(...startPosition);
    camera.lookAt(new THREE.Vector3(...lookAtTarget));
    camera.updateProjectionMatrix();
    hasStarted.current = true;
  }, []);

  useFrame((_, delta) => {
    if (!hasStarted.current) return;

    if (progressRef.current === 0) {
      camera.position.set(...startPosition);
      camera.lookAt(new THREE.Vector3(...lookAtTarget));
    }

    if (progressRef.current >= duration) {
      if (!hasCompleted.current) {
        hasCompleted.current = true;
        onComplete?.();
      }
      return;
    }

    progressRef.current = Math.min(progressRef.current + delta, duration);
    const progress = progressRef.current / duration;
    const eased = 1 - Math.pow(1 - progress, 3); // Ease-out cubic

    const position = new THREE.Vector3(
      THREE.MathUtils.lerp(startPosition[0], endPosition[0], eased),
      THREE.MathUtils.lerp(startPosition[1], endPosition[1], eased),
      THREE.MathUtils.lerp(startPosition[2], endPosition[2], eased)
    );

    camera.position.copy(position);
    camera.lookAt(new THREE.Vector3(...lookAtTarget));
  });

  return null;
}

// Ruler Overlay (simpler for easel view)
function RulerOverlay({
  posterWidth,
  posterHeight,
  posterCenterY,
  showRuler,
}: {
  posterWidth: number;
  posterHeight: number;
  posterCenterY: number;
  showRuler: boolean;
}) {
  if (!showRuler) return null;

  const INCHES_TO_UNITS = 0.1;
  const widthInUnits = posterWidth * INCHES_TO_UNITS;
  const heightInUnits = posterHeight * INCHES_TO_UNITS;
  const posterPos: [number, number, number] = [0, posterCenterY, -0.1];

  return (
    <group>
      {/* Horizontal ruler (width) */}
      <group
        position={[
          posterPos[0],
          posterPos[1] - heightInUnits / 2 - 0.2,
          posterPos[2],
        ]}
      >
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[widthInUnits, 0.01, 0.01]} />
          <meshBasicMaterial color='#f63a9e' />
        </mesh>
        {/* End caps */}
        <mesh position={[-widthInUnits / 2, 0, 0]}>
          <boxGeometry args={[0.01, 0.1, 0.01]} />
          <meshBasicMaterial color='#f63a9e' />
        </mesh>
        <mesh position={[widthInUnits / 2, 0, 0]}>
          <boxGeometry args={[0.01, 0.1, 0.01]} />
          <meshBasicMaterial color='#f63a9e' />
        </mesh>
      </group>

      {/* Vertical ruler (height) */}
      <group
        position={[
          posterPos[0] + widthInUnits / 2 + 0.2,
          posterPos[1],
          posterPos[2],
        ]}
      >
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.01, heightInUnits, 0.01]} />
          <meshBasicMaterial color='#f63a9e' />
        </mesh>
        {/* End caps */}
        <mesh position={[0, -heightInUnits / 2, 0]}>
          <boxGeometry args={[0.1, 0.01, 0.01]} />
          <meshBasicMaterial color='#f63a9e' />
        </mesh>
        <mesh position={[0, heightInUnits / 2, 0]}>
          <boxGeometry args={[0.1, 0.01, 0.01]} />
          <meshBasicMaterial color='#f63a9e' />
        </mesh>
      </group>
    </group>
  );
}

export default function PosterEaselPreview({
  imageUrl,
  width,
  height,
  showRuler = false,
  wallColor = '#e8e4d8', // Warm beige/cream
}: PosterEaselPreviewProps) {
  const [animationComplete, setAnimationComplete] = useState(false);

  // Calculate dynamic poster center Y position (same as in PosterCanvasMesh)
  const INCHES_TO_UNITS = 0.1;
  const LEDGE_HEIGHT = 1.15;
  const TILT_OFFSET = 0.05;
  const canvasHeight = height * INCHES_TO_UNITS;
  const posterCenterY = LEDGE_HEIGHT + canvasHeight / 2 + TILT_OFFSET;

  return (
    <div className='w-full h-full'>
      <Canvas
        shadows
        camera={{
          position: [-2.5, 2, 3.5],
          fov: 50,
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        {/* Ambient light - soft overall illumination */}
        <ambientLight intensity={1.8} color='#fff8f0' />

        {/* Main directional light (window light from left) */}
        <directionalLight
          position={[-4, 4, 2]}
          intensity={1.2}
          color='#fff5e6'
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
        />

        {/* Fill light from right (softer) */}
        <pointLight
          position={[3, 2.5, 1]}
          intensity={0.6}
          distance={8}
          color='#ffffff'
          decay={2}
        />

        {/* Spotlight on poster */}
        <spotLight
          position={[0, 3.5, 2]}
          intensity={0.8}
          angle={Math.PI / 5}
          penumbra={0.5}
          distance={10}
          target-position={[0, posterCenterY, -0.1]}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* Studio Room Environment */}
        <StudioRoomEnvironment wallColor={wallColor} />

        {/* Easel Stand */}
        <EaselStand posterHeight={height} />

        {/* Poster on Canvas */}
        <PosterCanvasMesh imageUrl={imageUrl} width={width} height={height} />

        {/* Ruler Overlay */}
        <RulerOverlay
          posterWidth={width}
          posterHeight={height}
          posterCenterY={posterCenterY}
          showRuler={showRuler}
        />

        {/* Camera Animation */}
        {!animationComplete && (
          <CameraAnimator
            posterCenterY={posterCenterY}
            onComplete={() => setAnimationComplete(true)}
          />
        )}

        {/* Orbit Controls */}
        <OrbitControls
          enabled={animationComplete}
          target={[0, posterCenterY, -0.1]}
          minDistance={2.5}
          maxDistance={6}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.1}
          enablePan={true}
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}
