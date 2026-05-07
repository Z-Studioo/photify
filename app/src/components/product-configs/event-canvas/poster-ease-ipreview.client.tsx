import { useRef, useMemo, useState, useEffect, Suspense } from 'react';
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
  // Ledge is at Y=1.15, support pegs at Z=-0.13
  // Calculate poster center position dynamically based on height
  const BASE_LEDGE_HEIGHT = 1.15;
  const LEDGE_THICKNESS = 0.05; // Thickness of the wooden ledge

  // For larger posters, raise the ledge height to keep poster higher up
  // This keeps the stand base visible in frame
  const REFERENCE_HEIGHT_FOR_LIFT = 24; // inches
  const heightRatio = height / REFERENCE_HEIGHT_FOR_LIFT;
  const ledgeHeightAdjustment = heightRatio > 1 ? (heightRatio - 1) * 0.8 : 0; // Raise ledge for posters taller than 24"
  const LEDGE_HEIGHT = BASE_LEDGE_HEIGHT + ledgeHeightAdjustment;

  // Poster should rest ON TOP of the ledge (accounting for ledge thickness)
  // and be aligned with the support pegs at Z=-0.13
  const posterBottomY = LEDGE_HEIGHT + LEDGE_THICKNESS / 2;
  const posterCenterY = posterBottomY + canvasHeight / 2;
  const posterPosition: [number, number, number] = [0, posterCenterY, -0.13]; // Resting on ledge, aligned with support pegs

  // Calculate the proper tilt angle to match the easel's front leg
  // The front leg is angled backward to support the leaning poster
  // A tilt of -0.12 radians provides a natural lean without being too extreme
  const posterRotation: [number, number, number] = [-0.12, 0, 0]; // Tilt BACKWARD (negative = lean back)

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
function EaselStand({ posterHeight, ledgeHeightAdjustment }: { posterHeight: number; ledgeHeightAdjustment: number }) {
  const INCHES_TO_UNITS = 0.1;
  const posterHeightUnits = posterHeight * INCHES_TO_UNITS;

  // Easel dimensions
  const legWidth = 0.04;
  const legDepth = 0.03;
  const easelHeight = posterHeightUnits + 0.8; // Taller than poster
  const easelBaseWidth = 0.7;

  // Ledge height - moves up for larger posters to keep them in view
  const BASE_LEDGE_HEIGHT = 1.15;
  const ledgeHeight = BASE_LEDGE_HEIGHT + ledgeHeightAdjustment;

  // Poster tilt angle (same as in PosterCanvasMesh)
  const POSTER_TILT = -0.12; // radians, backward tilt

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
      {/* Back left leg - BEHIND the canvas, tilted backward */}
      <mesh position={[-easelBaseWidth / 2, easelHeight / 2, -0.25]} rotation={[POSTER_TILT, 0, 0]} castShadow>
        <boxGeometry args={[legWidth, easelHeight, legDepth]} />
        {woodMaterial}
      </mesh>

      {/* Back right leg - BEHIND the canvas, tilted backward */}
      <mesh position={[easelBaseWidth / 2, easelHeight / 2, -0.25]} rotation={[POSTER_TILT, 0, 0]} castShadow>
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

      {/* Top crossbar - connects back legs, BEHIND canvas, tilted backward */}
      <mesh position={[0, easelHeight - 0.15, -0.25]} rotation={[POSTER_TILT, 0, 0]} castShadow>
        <boxGeometry args={[easelBaseWidth + 0.15, legWidth, legDepth]} />
        {woodMaterial}
      </mesh>

      {/* Upper middle support bar - BEHIND canvas, tilted backward */}
      <mesh position={[0, easelHeight * 0.65, -0.22]} rotation={[POSTER_TILT, 0, 0]} castShadow>
        <boxGeometry
          args={[easelBaseWidth - 0.1, legWidth * 0.7, legDepth * 0.8]}
        />
        {woodMaterial}
      </mesh>

      {/* Canvas ledge/support - BEHIND canvas, holds it up */}
      <mesh position={[0, ledgeHeight, -0.15]} castShadow>
        <boxGeometry args={[easelBaseWidth - 0.1, 0.05, 0.12]} />
        {woodMaterial}
      </mesh>

      {/* Additional support pegs (small blocks that canvas rests on) */}
      <mesh position={[-0.3, ledgeHeight, -0.13]} castShadow>
        <boxGeometry args={[0.06, 0.03, 0.06]} />
        {woodMaterial}
      </mesh>
      <mesh position={[0.3, ledgeHeight, -0.13]} castShadow>
        <boxGeometry args={[0.06, 0.03, 0.06]} />
        {woodMaterial}
      </mesh>
    </group>
  );
}

// ── Floral pedestal: tall white plinth with a clustered floral arrangement
// on top. Used to flank the easel and immediately signal "event venue" —
// this shape is universal across weddings, birthdays, anniversaries, etc.
function FloralPedestal({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      {/* Square base / plinth */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.24, 0.6]} />
        <meshStandardMaterial color='#efe7d4' roughness={0.55} />
      </mesh>
      {/* Column shaft */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.2, 2.2, 24]} />
        <meshStandardMaterial color='#f5efe0' roughness={0.5} />
      </mesh>
      {/* Top capital */}
      <mesh position={[0, 2.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.55, 0.22, 0.55]} />
        <meshStandardMaterial color='#efe7d4' roughness={0.55} />
      </mesh>

      {/* Greenery base of arrangement */}
      <mesh position={[0, 2.85, 0]} castShadow>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color='#4a6b3f' roughness={0.95} />
      </mesh>
      {/* White roses scattered through the cluster */}
      {[
        [0.22, 3.05, 0.12],
        [-0.22, 2.95, 0.18],
        [0.12, 3.18, -0.18],
        [-0.12, 3.1, -0.12],
        [0.32, 2.85, -0.05],
        [0, 3.22, 0.0],
        [-0.32, 2.9, 0.05],
        [0.05, 2.85, 0.32],
      ].map((p, i) => (
        <mesh key={`w-${i}`} position={p as [number, number, number]} castShadow>
          <sphereGeometry args={[0.13, 12, 12]} />
          <meshStandardMaterial color='#fbf2e8' roughness={0.9} />
        </mesh>
      ))}
      {/* Soft pink accent blooms */}
      {[
        [0.18, 2.95, 0.25],
        [-0.28, 3.12, 0.0],
        [0.05, 3.05, -0.3],
      ].map((p, i) => (
        <mesh key={`p-${i}`} position={p as [number, number, number]} castShadow>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color='#f2c4cf' roughness={0.9} />
        </mesh>
      ))}
      {/* Trailing eucalyptus / cascading greenery */}
      {[
        [0.42, 2.6, 0.0],
        [-0.42, 2.55, 0.05],
        [0.32, 2.5, 0.22],
        [-0.3, 2.55, -0.18],
      ].map((p, i) => (
        <mesh key={`g-${i}`} position={p as [number, number, number]} castShadow>
          <sphereGeometry args={[0.16, 10, 10]} />
          <meshStandardMaterial color='#7a9b6e' roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

// Room Environment — designed as an event entry area: red carpet runner
// leading to the easel, draped fabric backdrop, floral pedestals flanking
// the banner, fairy lights, and warm uplighting on the back wall.
function StudioRoomEnvironment({ wallColor }: { wallColor: string }) {
  // Room dimensions in scene units (1 unit ≈ 25 cm). Sized generously so
  // even the orbit camera at maximum distance for large posters stays
  // inside the room.
  const ROOM_WIDTH = 22; // x extent (≈ 5.5 m)
  const ROOM_DEPTH = 16; // z extent (≈ 4 m)
  const ROOM_HEIGHT = 12; // y extent (≈ 3 m ceiling)
  const ROOM_Z_CENTER = 3; // shift the room toward the camera so the easel
  // sits comfortably between the back wall and the camera path
  const BACK_Z = ROOM_Z_CENTER - ROOM_DEPTH / 2; // back wall z
  const FRONT_Z = ROOM_Z_CENTER + ROOM_DEPTH / 2; // front wall z (behind camera)
  const HALF_W = ROOM_WIDTH / 2;

  // Materials
  // Polished dark wood — feels like a venue / event hall floor and makes the
  // red carpet pop on top of it.
  const floorMaterial = useMemo(
    () => (
      <meshStandardMaterial
        color='#3b2a1d'
        roughness={0.45}
        metalness={0.1}
      />
    ),
    []
  );

  // Pre-compute fairy light bulb positions once so they don't jitter on each
  // render. Slight vertical variance gives them an organic "draped" feel.
  const fairyLights = useMemo(() => {
    const N = 16;
    const arr: { pos: [number, number, number]; size: number }[] = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const x = -6 + t * 12;
      // Catenary-ish droop in two strands so it reads as fairy lights, not a
      // straight LED bar.
      const droop = Math.sin(t * Math.PI) * 0.35;
      const y = ROOM_HEIGHT - 2.2 - droop;
      arr.push({
        pos: [x, y, BACK_Z + 0.6],
        size: 0.06 + ((i * 37) % 100) / 1000, // tiny size variance
      });
    }
    return arr;
  }, [ROOM_HEIGHT, BACK_Z]);

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

  const ceilingMaterial = useMemo(
    () => (
      <meshStandardMaterial
        color='#fbf6ee' // Slightly warmer than walls — feels lit
        roughness={1.0}
        metalness={0.0}
      />
    ),
    []
  );

  const trimColor = '#fdfaf3'; // Warm white skirting / cornice

  // Skirting (baseboard) helper
  const Skirting = ({
    position,
    rotation,
    length,
  }: {
    position: [number, number, number];
    rotation?: [number, number, number];
    length: number;
  }) => (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={[length, 0.18, 0.04]} />
      <meshStandardMaterial color={trimColor} roughness={0.75} />
    </mesh>
  );

  return (
    <group>
      {/* Floor */}
      <mesh
        position={[0, 0, ROOM_Z_CENTER]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        {floorMaterial}
      </mesh>

      {/* ── Red carpet runner — runs from underneath the easel forward
              through the entire camera path. Universal "event entry" cue. */}
      <mesh
        position={[0, 0.01, 4]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[3, 13]} />
        <meshStandardMaterial color='#7a1f24' roughness={1.0} />
      </mesh>
      {/* Gold trim along the carpet edges */}
      <mesh
        position={[-1.5, 0.012, 4]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[0.08, 13]} />
        <meshStandardMaterial
          color='#caa66b'
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      <mesh
        position={[1.5, 0.012, 4]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[0.08, 13]} />
        <meshStandardMaterial
          color='#caa66b'
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Ceiling */}
      <mesh
        position={[0, ROOM_HEIGHT, ROOM_Z_CENTER]}
        rotation={[Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        {ceilingMaterial}
      </mesh>

      {/* Back wall */}
      <mesh
        position={[0, ROOM_HEIGHT / 2, BACK_Z]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        {wallMaterial}
      </mesh>

      {/* Left wall */}
      <mesh
        position={[-HALF_W, ROOM_HEIGHT / 2, ROOM_Z_CENTER]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        {wallMaterial}
      </mesh>

      {/* Right wall */}
      <mesh
        position={[HALF_W, ROOM_HEIGHT / 2, ROOM_Z_CENTER]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        {wallMaterial}
      </mesh>

      {/* Front wall — only ever visible if a peripheral camera angle catches
          it. BackSide so the camera can sit just outside without the wall
          intersecting the view. */}
      <mesh position={[0, ROOM_HEIGHT / 2, FRONT_Z]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial
          color={wallColor}
          roughness={0.95}
          metalness={0.0}
          side={THREE.BackSide}
        />
      </mesh>

      {/* ── Skirting / baseboards (warm white trim) ───────────────────── */}
      <Skirting position={[0, 0.09, BACK_Z + 0.02]} length={ROOM_WIDTH} />
      <Skirting
        position={[-HALF_W + 0.02, 0.09, ROOM_Z_CENTER]}
        rotation={[0, Math.PI / 2, 0]}
        length={ROOM_DEPTH}
      />
      <Skirting
        position={[HALF_W - 0.02, 0.09, ROOM_Z_CENTER]}
        rotation={[0, -Math.PI / 2, 0]}
        length={ROOM_DEPTH}
      />

      {/* ── Ceiling cornice (subtle trim where wall meets ceiling) ────── */}
      <mesh position={[0, ROOM_HEIGHT - 0.08, BACK_Z + 0.02]}>
        <boxGeometry args={[ROOM_WIDTH, 0.16, 0.05]} />
        <meshStandardMaterial color={trimColor} roughness={0.85} />
      </mesh>
      <mesh
        position={[-HALF_W + 0.02, ROOM_HEIGHT - 0.08, ROOM_Z_CENTER]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <boxGeometry args={[ROOM_DEPTH, 0.16, 0.05]} />
        <meshStandardMaterial color={trimColor} roughness={0.85} />
      </mesh>
      <mesh
        position={[HALF_W - 0.02, ROOM_HEIGHT - 0.08, ROOM_Z_CENTER]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <boxGeometry args={[ROOM_DEPTH, 0.16, 0.05]} />
        <meshStandardMaterial color={trimColor} roughness={0.85} />
      </mesh>

      {/* ── Draped fabric backdrop on back wall — vertical half-cylinders
              read as soft drape folds without needing a real cloth sim. ── */}
      <group position={[0, 0, BACK_Z + 0.05]}>
        {Array.from({ length: 12 }, (_, i) => {
          const totalSpan = ROOM_WIDTH * 0.95;
          const step = totalSpan / 11;
          const x = -totalSpan / 2 + i * step;
          // Small alternating depth offset so folds don't read as a flat row
          const zJitter = (i % 2 === 0 ? 0 : 0.05);
          // Slight radius variance for a more organic look
          const radius = 0.32 + (i % 3) * 0.04;
          return (
            <mesh
              key={`drape-${i}`}
              position={[x, ROOM_HEIGHT * 0.48, radius + zJitter]}
              receiveShadow
            >
              {/* Open vertical half-cylinder facing the room */}
              <cylinderGeometry
                args={[
                  radius,
                  radius,
                  ROOM_HEIGHT * 0.92,
                  10,
                  1,
                  true,
                  0,
                  Math.PI,
                ]}
              />
              <meshStandardMaterial
                color='#efe2c4'
                roughness={0.95}
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        })}
        {/* Decorative curtain rod above the drape */}
        <mesh position={[0, ROOM_HEIGHT - 0.6, 0.4]} castShadow>
          <cylinderGeometry
            args={[0.08, 0.08, ROOM_WIDTH * 0.95, 16]}
          />
          <meshStandardMaterial
            color='#caa66b'
            roughness={0.35}
            metalness={0.45}
          />
        </mesh>
        {/* Curtain rod end caps */}
        <mesh
          position={[-(ROOM_WIDTH * 0.95) / 2, ROOM_HEIGHT - 0.6, 0.4]}
          castShadow
        >
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial
            color='#caa66b'
            roughness={0.35}
            metalness={0.45}
          />
        </mesh>
        <mesh
          position={[(ROOM_WIDTH * 0.95) / 2, ROOM_HEIGHT - 0.6, 0.4]}
          castShadow
        >
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial
            color='#caa66b'
            roughness={0.35}
            metalness={0.45}
          />
        </mesh>
      </group>

      {/* ── Fairy lights strung in front of the drape ───────────────── */}
      {fairyLights.map((b, i) => (
        <mesh key={`fl-${i}`} position={b.pos}>
          <sphereGeometry args={[b.size, 10, 10]} />
          <meshStandardMaterial
            color='#fff5d4'
            emissive='#ffd28a'
            emissiveIntensity={3.0}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* ── Floral pedestals flanking the easel ──────────────────────── */}
      <FloralPedestal position={[-2.6, 0, -0.4]} />
      <FloralPedestal position={[2.6, 0, -0.4]} />

      {/* ── Warm uplights at the base of the back wall (event uplighting
              that classic venues use to wash the wall in colour) ──── */}
      <pointLight
        position={[-4.5, 0.6, BACK_Z + 1.2]}
        intensity={1.4}
        distance={5}
        color='#ffb070'
        decay={2}
      />
      <pointLight
        position={[0, 0.6, BACK_Z + 1.2]}
        intensity={1.2}
        distance={4.5}
        color='#ffc78a'
        decay={2}
      />
      <pointLight
        position={[4.5, 0.6, BACK_Z + 1.2]}
        intensity={1.4}
        distance={5}
        color='#ffb070'
        decay={2}
      />

      {/* ── Subtle scatter of fairy-light glow at the room level ───── */}
      <pointLight
        position={[0, ROOM_HEIGHT - 2.5, BACK_Z + 1]}
        intensity={0.5}
        distance={6}
        color='#ffd9a0'
        decay={2}
      />
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
  const lookAtTarget: [number, number, number] = [0, orbitTargetY, -0.13]; // Look at orbit target (dynamic, aligned with poster)

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
  const posterPos: [number, number, number] = [0, posterCenterY, -0.13]; // Aligned with poster position

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
  const LEDGE_THICKNESS = 0.05;

  // For larger posters, raise the ledge height to keep poster higher up
  const REFERENCE_HEIGHT_FOR_LIFT = 24; // inches
  const heightRatio = height / REFERENCE_HEIGHT_FOR_LIFT;
  const ledgeHeightAdjustment = heightRatio > 1 ? (heightRatio - 1) * 0.8 : 0;
  const LEDGE_HEIGHT = BASE_LEDGE_HEIGHT + ledgeHeightAdjustment;

  const canvasHeight = height * INCHES_TO_UNITS;
  const posterBottomY = LEDGE_HEIGHT + LEDGE_THICKNESS / 2;
  const posterCenterY = posterBottomY + canvasHeight / 2;

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
          toneMappingExposure: 1.05,
        }}
      >
        {/* Ambient light — gentle, slightly warm event-hall glow */}
        <ambientLight intensity={0.5} color='#fff1de' />

        {/* Hemisphere light — soft sky/ground bounce so underside of the
            easel and floor near the carpet aren't pitch black */}
        <hemisphereLight color='#fff2dc' groundColor='#3a2418' intensity={0.4} />

        {/* Key light — overhead venue lighting, slightly warm and angled to
            cast the easel's shadow forward onto the carpet */}
        <directionalLight
          position={[-3, 8, 5]}
          intensity={1.1}
          color='#ffe9c8'
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-2}
          shadow-bias={-0.0005}
        />

        {/* Fill light from the opposite side — cooler and dimmer to keep the
            scene from going entirely orange */}
        <directionalLight
          position={[5, 4, 4]}
          intensity={0.35}
          color='#e6efff'
        />

        {/* Spotlight aimed at the poster — main focal pop, like a venue
            spotlight on the welcome banner */}
        <spotLight
          position={[0, 5.5, 3.5]}
          intensity={0.9}
          angle={Math.PI / 5.5}
          penumbra={0.6}
          distance={14}
          target-position={[0, posterCenterY, -0.13]}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0005}
        />

        {/* Studio Room Environment */}
        <StudioRoomEnvironment wallColor={wallColor} />

        {/* Easel Stand */}
        <EaselStand posterHeight={height} ledgeHeightAdjustment={ledgeHeightAdjustment} />

        {/* Poster on Canvas */}
        <PosterCanvasMesh imageUrl={imageUrl} width={width} height={height} />

        {/* Ruler Overlay — wrapped in a local Suspense so the font loading
            of <Text /> doesn't bubble up to the outer Suspense and replace
            the entire Canvas with the loading spinner. */}
        <Suspense fallback={null}>
          <RulerOverlay
            posterWidth={width}
            posterHeight={height}
            posterCenterY={posterCenterY}
            showRuler={showRuler}
          />
        </Suspense>

        {/* Camera Animation */}
        {!animationComplete && (
          <CameraAnimator
            orbitTargetY={orbitTargetY}
            startPosition={startCameraPosition}
            endPosition={endCameraPosition}
            onComplete={() => setAnimationComplete(true)}
          />
        )}

        {/* Orbit Controls — tightened so the camera always stays inside the
            room and looks at the easel from a comfortable angle */}
        <OrbitControls
          enabled={animationComplete}
          target={[0, orbitTargetY, -0.13]}
          minDistance={dynamicMinDistance}
          maxDistance={dynamicMaxDistance}
          minPolarAngle={Math.PI / 3.2} // not too high (avoid ceiling clip)
          maxPolarAngle={Math.PI / 2.1} // not too low (stay above floor)
          minAzimuthAngle={-Math.PI / 3} // ~60° left
          maxAzimuthAngle={Math.PI / 3} // ~60° right
          enablePan={false}
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}
