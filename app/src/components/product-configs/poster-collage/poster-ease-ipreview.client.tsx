import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
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
  const BASE_LEDGE_HEIGHT = 1.15;
  const TILT_OFFSET = 0.05; // Small offset to account for backward tilt
  
  // For larger posters, raise the ledge height to keep poster higher up
  // This keeps the stand base visible in frame
  const REFERENCE_HEIGHT_FOR_LIFT = 24; // inches
  const heightRatio = height / REFERENCE_HEIGHT_FOR_LIFT;
  const ledgeHeightAdjustment = heightRatio > 1 ? (heightRatio - 1) * 0.8 : 0; // Raise ledge for posters taller than 24"
  const LEDGE_HEIGHT = BASE_LEDGE_HEIGHT + ledgeHeightAdjustment;
  
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

  // ── Front leg: derived from two anchor points so it never detaches ──
  // Anchor 1 (top): where the front leg meets the top crossbar (same Z as back legs)
  const frontLegPivotY = easelHeight - 0.15;
  const frontLegPivotZ = -0.25;
  // Anchor 2 (bottom): floor contact — spreads backward proportionally with height
  const frontLegFloorZ = -(0.3 + easelHeight * 0.24);
  // Derive length, angle, and center-point from the two anchors
  const flDeltaY = frontLegPivotY;                          // bottom is at y=0
  const flDeltaZ = frontLegPivotZ - frontLegFloorZ;         // positive: pivot is less-negative (closer to cam)
  const frontLegLength = Math.sqrt(flDeltaY * flDeltaY + flDeltaZ * flDeltaZ);
  const frontLegAngle = Math.atan2(flDeltaZ, flDeltaY);     // rotation.x — +θ tilts top toward cam
  const frontLegCenterY = frontLegPivotY / 2;
  const frontLegCenterZ = (frontLegPivotZ + frontLegFloorZ) / 2;

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

      {/* Front center leg — mathematically derived so it always connects top crossbar → floor */}
      <mesh
        position={[0, frontLegCenterY, frontLegCenterZ]}
        rotation={[frontLegAngle, 0, 0]}
        castShadow
      >
        <boxGeometry args={[legWidth, frontLegLength, legDepth]} />
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
      <mesh position={[-0.3, 1.15, -0.13]} castShadow>
        <boxGeometry args={[0.06, 0.03, 0.06]} />
        {woodMaterial}
      </mesh>
      <mesh position={[0.3, 1.15, -0.13]} castShadow>
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
  orbitTargetY,
  startPosition,
  endPosition,
  onComplete,
}: {
  orbitTargetY: number;
  startPosition: [number, number, number];
  endPosition: [number, number, number];
  onComplete?: () => void;
}) {
  const { camera } = useThree();
  const progressRef = useRef(0);
  const hasCompleted = useRef(false);
  const hasStarted = useRef(false);

  const duration = 4; // seconds
  const lookAtTarget: [number, number, number] = [0, orbitTargetY, -0.1]; // Look at orbit target (dynamic)

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
        {/* Width measurement text */}
        <Text
          position={[0, -0.15, 0]}
          fontSize={0.12}
          color='#f63a9e'
          anchorX='center'
          anchorY='top'
          fontWeight='bold'
        >
          {posterWidth}″
        </Text>
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
        {/* Height measurement text */}
        <Text
          position={[0.15, 0, 0]}
          fontSize={0.12}
          color='#f63a9e'
          anchorX='left'
          anchorY='middle'
          fontWeight='bold'
          rotation={[0, 0, 0]}
        >
          {posterHeight}″
        </Text>
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
  const BASE_LEDGE_HEIGHT = 1.15;
  const TILT_OFFSET = 0.05;
  
  // For larger posters, raise the ledge height to keep poster higher up
  const REFERENCE_HEIGHT_FOR_LIFT = 24; // inches
  const heightRatio = height / REFERENCE_HEIGHT_FOR_LIFT;
  const ledgeHeightAdjustment = heightRatio > 1 ? (heightRatio - 1) * 0.8 : 0;
  const LEDGE_HEIGHT = BASE_LEDGE_HEIGHT + ledgeHeightAdjustment;
  
  const canvasHeight = height * INCHES_TO_UNITS;
  const posterCenterY = LEDGE_HEIGHT + canvasHeight / 2 + TILT_OFFSET;

  // ===== REFERENCE SIZE: 18x24 (works perfectly) =====
  const REFERENCE_WIDTH = 18;
  const REFERENCE_HEIGHT = 24;
  const REFERENCE_MAX = Math.max(REFERENCE_WIDTH, REFERENCE_HEIGHT); // 24
  
  // Calculate scale ratio compared to reference size
  const maxDimension = Math.max(width, height);
  const scaleRatio = maxDimension / REFERENCE_MAX;
  
  // ===== CAMERA POSITIONS (from 18x24 perfect setup) =====
  // These are the perfect values for 18x24
  const REF_START_POS: [number, number, number] = [-2.5, 2, 3.5];
  const REF_END_POS: [number, number, number] = [0.8, 1.8, 3];
  
  // Scale camera positions proportionally
  const startCameraPosition: [number, number, number] = [
    REF_START_POS[0] * scaleRatio * 1.2, // Further to the side
    REF_START_POS[1] + (scaleRatio - 1) * 3.5, // MUCH higher camera for larger posters
    REF_START_POS[2] * scaleRatio * 1.8, // VERY far back
  ];
  const endCameraPosition: [number, number, number] = [
    REF_END_POS[0],
    REF_END_POS[1] + (scaleRatio - 1) * 2.5, // MUCH higher end position
    REF_END_POS[2] * scaleRatio * 2.0, // EXTREMELY far back for end position
  ];

  // ===== FOV (from 18x24 perfect setup) =====
  const REF_FOV = 50;
  const dynamicFOV = Math.min(85, REF_FOV + (scaleRatio - 1) * 20); // VERY wide FOV for larger posters

  // ===== ORBIT CONTROLS (from 18x24 perfect setup) =====
  const REF_MIN_DISTANCE = 2.5;
  const REF_MAX_DISTANCE = 6;
  const dynamicMinDistance = REF_MIN_DISTANCE * scaleRatio * 0.7;
  const dynamicMaxDistance = REF_MAX_DISTANCE * scaleRatio * 0.9; // Restrict zoom-out to just beyond the animation end position

  // ===== ORBIT TARGET (from 18x24 perfect setup) =====
  // Now that we're lifting the poster for larger sizes, we can target closer to center
  // but still keep it conservative to ensure stand visibility
  const orbitTargetY = scaleRatio <= 1.0
    ? posterCenterY // Smaller than or equal to reference
    : posterCenterY * 0.75; // For larger posters, focus on lower 3/4 of poster (since poster is now lifted higher)

  return (
    <div className='w-full h-full'>
      <Canvas
        shadows
        camera={{
          position: startCameraPosition,
          fov: dynamicFOV,
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
            orbitTargetY={orbitTargetY}
            startPosition={startCameraPosition}
            endPosition={endCameraPosition}
            onComplete={() => setAnimationComplete(true)}
          />
        )}

        {/* Orbit Controls */}
        <OrbitControls
          enabled={animationComplete}
          target={[0, orbitTargetY, -0.1]}
          minDistance={dynamicMinDistance}
          maxDistance={dynamicMaxDistance}
          minPolarAngle={Math.PI / 3.5} // Prevent going too low (floor view)
          maxPolarAngle={Math.PI / 2.05} // Prevent going behind (back of stand)
          minAzimuthAngle={-Math.PI / 2.5} // Limit left rotation
          maxAzimuthAngle={Math.PI / 2.5} // Limit right rotation
          enablePan={false}
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}
