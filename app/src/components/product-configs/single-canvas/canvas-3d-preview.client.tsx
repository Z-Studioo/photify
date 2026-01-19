import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from './room-environment';
import { RulerOverlay } from './ruler-overlay';
import { SingleCanvasMesh } from './single-canvas-mesh';

interface Canvas3DPreviewProps {
  imageUrl: string | null;
  width: number;
  height: number;
  rotation: number;
  zoom: number;
  wrapImage?: boolean; // If false, use solid color sides (default: true for backward compatibility)
  sideColor?: string; // Color for canvas sides when wrapImage is false
  mirrorEdges?: boolean; // If true and wrapImage is true, mirror edges instead of wrapping
  showRuler?: boolean;
  wallColor?: string;
}

// Camera Intro Animation Component with Two Phases
function CameraAnimator({
  phase1Start,
  phase1End,
  phase2End,
  lookAtTarget,
  phase1Duration = 1.2,
  phase2Duration = 0.8,
  onComplete,
}: {
  phase1Start: [number, number, number];
  phase1End: [number, number, number];
  phase2End: [number, number, number];
  lookAtTarget: [number, number, number];
  phase1Duration?: number;
  phase2Duration?: number;
  onComplete?: () => void;
}) {
  const { camera } = useThree();
  const progressRef = useRef(0);
  const hasCompleted = useRef(false);
  const hasStarted = useRef(false);
  const totalDuration = phase1Duration + phase2Duration;

  useEffect(() => {
    // Reset on mount
    progressRef.current = 0;
    hasCompleted.current = false;
    hasStarted.current = false;

    // Force set initial camera position immediately
    camera.position.set(...phase1Start);
    camera.lookAt(new THREE.Vector3(...lookAtTarget));
    camera.updateProjectionMatrix();

    // Start animation immediately
    hasStarted.current = true;
  }, []); // Only run once on mount

  useFrame((_, delta) => {
    // Don't start animating until ready
    if (!hasStarted.current) return;

    // Force camera position on first frame
    if (progressRef.current === 0) {
      camera.position.set(...phase1Start);
      camera.lookAt(new THREE.Vector3(...lookAtTarget));
    }

    if (progressRef.current >= totalDuration) {
      if (!hasCompleted.current) {
        hasCompleted.current = true;
        onComplete?.();
      }
      return;
    }

    // Increment progress (in seconds)
    progressRef.current = Math.min(progressRef.current + delta, totalDuration);

    // Calculate overall progress (0 to 1 across both phases)
    const overallProgress = progressRef.current / totalDuration;

    // Apply easing to overall progress for smooth continuous motion
    const easedOverall = 1 - Math.pow(1 - overallProgress, 3);

    // Calculate phase transition point (0 to 1)
    const phase1Ratio = phase1Duration / totalDuration;

    let position: THREE.Vector3;

    if (easedOverall <= phase1Ratio) {
      // We're in phase 1 - interpolate between start and middle
      const phase1Progress = easedOverall / phase1Ratio;
      position = new THREE.Vector3(
        THREE.MathUtils.lerp(phase1Start[0], phase1End[0], phase1Progress),
        THREE.MathUtils.lerp(phase1Start[1], phase1End[1], phase1Progress),
        THREE.MathUtils.lerp(phase1Start[2], phase1End[2], phase1Progress)
      );
    } else {
      // We're in phase 2 - interpolate between middle and end
      const phase2Progress = (easedOverall - phase1Ratio) / (1 - phase1Ratio);
      position = new THREE.Vector3(
        THREE.MathUtils.lerp(phase1End[0], phase2End[0], phase2Progress),
        THREE.MathUtils.lerp(phase1End[1], phase2End[1], phase2Progress),
        THREE.MathUtils.lerp(phase1End[2], phase2End[2], phase2Progress)
      );
    }

    // Set camera position
    camera.position.copy(position);

    // Always look at the canvas target during animation
    camera.lookAt(new THREE.Vector3(...lookAtTarget));
  });

  return null;
}

function OvalOrbitControls({
  minDistance,
  maxDistance,
  canvasTarget,
  enabled = true,
}: {
  minDistance: number;
  maxDistance: number;
  canvasTarget: [number, number, number];
  enabled?: boolean;
}) {
  const controlsRef = useRef<any>(null);
  const wasEnabled = useRef(false);

  useFrame(() => {
    if (!controlsRef.current) return;

    // When controls are first enabled, update their target without moving camera
    if (enabled && !wasEnabled.current) {
      wasEnabled.current = true;
      controlsRef.current.target.set(...canvasTarget);
      controlsRef.current.update();
      return;
    }

    if (!enabled) return;

    const camera = controlsRef.current.object;
    const distance = camera.position.distanceTo(
      new THREE.Vector3(...canvasTarget)
    );

    const zoomThreshold = minDistance * 1.1;

    if (distance <= zoomThreshold) {
      const target = new THREE.Vector3(...canvasTarget);
      const cameraPos = camera.position.clone();

      const dx = cameraPos.x - target.x;
      const dz = cameraPos.z - target.z;
      const horizontalAngle = Math.atan2(dx, dz - target.z);

      const angleOffset = Math.abs(horizontalAngle);
      const distanceModulation = 1 + Math.sin(angleOffset) * 0.8;

      const direction = cameraPos.clone().sub(target).normalize();
      const newDistance = minDistance * distanceModulation;
      const newPosition = target
        .clone()
        .add(direction.multiplyScalar(newDistance));

      camera.position.lerp(newPosition, 0.1);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={enabled}
      enableZoom={true}
      enablePan={false}
      enableRotate={true}
      minDistance={minDistance}
      maxDistance={maxDistance}
      minPolarAngle={Math.PI / 3.5}
      maxPolarAngle={Math.PI / 1.8}
      minAzimuthAngle={-Math.PI / 5}
      maxAzimuthAngle={Math.PI / 5}
      target={canvasTarget}
      autoRotate={false}
      rotateSpeed={1.0}
      zoomSpeed={1.0}
      enableDamping={true}
      dampingFactor={0.05}
      makeDefault
    />
  );
}

export default function Canvas3DPreview({
  imageUrl,
  width,
  height,
  rotation,
  zoom,
  wrapImage = true,
  sideColor,
  mirrorEdges = false,
  showRuler = false,
  wallColor = '#d4e4d4',
}: Canvas3DPreviewProps) {
  const canvasWidth = width / 10;
  const canvasHeight = height / 10;
  const maxDimension = Math.max(canvasWidth, canvasHeight);

  const minDistanceForFullCanvas = maxDimension * 1.15;

  const minDistance = Math.max(0.8, minDistanceForFullCanvas * 0.4);
  const maxDistance = Math.max(12, minDistanceForFullCanvas * 2);

  const canvasTarget: [number, number, number] = [0, 2.2, -4.9645];

  // Animation state
  const [animationComplete, setAnimationComplete] = useState(false);

  // Camera positions for intro animation (user-specified positions)
  // Phase 1: Zoom in from far away (3.5 seconds)
  const phase1StartPosition: [number, number, number] = [-6.33, 2.05, 5.23];
  const phase1EndPosition: [number, number, number] = [-2.93, 2.13, -0.24];

  // Phase 2: Move to final orbital position (1.5 seconds)
  const phase2EndPosition: [number, number, number] = [3.26, 1.92, -0.47];

  return (
    <div className='w-full h-full bg-gradient-to-b from-slate-100 to-slate-200 overflow-hidden'>
      <Canvas shadows camera={{ position: phase1StartPosition, fov: 50 }}>
        <ambientLight intensity={0.15} />

        <directionalLight
          position={[-2, 8, 3]}
          intensity={2.2}
          color='#ffffff'
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
          shadow-bias={-0.0003}
        />

        <spotLight
          position={[0, 6, -1]}
          target-position={[0, 2.2, -4.9645]}
          angle={0.5}
          penumbra={0.5}
          intensity={3.5}
          color='#ffffff'
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0002}
        />

        <spotLight
          position={[-1, 5, 0]}
          target-position={[0, 2.2, -4.9645]}
          angle={0.4}
          penumbra={0.6}
          intensity={2.5}
          color='#ffffff'
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />

        <directionalLight
          position={[1, 3.5, 4]}
          target-position={[0, 2.2, -5]}
          intensity={1.5}
          color='#ffffff'
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
          shadow-camera-near={0.5}
          shadow-camera-far={20}
          shadow-bias={-0.001}
        />

        <directionalLight
          position={[4, 7, 2]}
          intensity={0.3}
          color='#fff8f0'
        />

        <pointLight
          position={[0, 1, 2]}
          intensity={0.2}
          distance={8}
          color='#ffffff'
          decay={2}
        />

        <pointLight
          position={[-3.4, 3.3, -3.8]}
          intensity={2.5}
          distance={12}
          color='#ffcc80'
          decay={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <pointLight
          position={[-3.4, 2.5, -3.8]}
          intensity={1.2}
          distance={6}
          color='#ffe4b3'
          decay={2}
        />

        <RoomEnvironment wallColor={wallColor} />

        <SingleCanvasMesh
          imageUrl={imageUrl}
          width={width}
          height={height}
          rotation={rotation}
          zoom={zoom}
          wrapImage={wrapImage}
          sideColor={sideColor}
          mirrorEdges={mirrorEdges}
        />

        <RulerOverlay
          canvasWidth={width}
          canvasHeight={height}
          showRuler={showRuler}
        />

        {/* Camera Intro Animation - Two seamless phases */}
        {!animationComplete && (
          <CameraAnimator
            phase1Start={phase1StartPosition}
            phase1End={phase1EndPosition}
            phase2End={phase2EndPosition}
            lookAtTarget={canvasTarget}
            phase1Duration={3.5}
            phase2Duration={1.5}
            onComplete={() => setAnimationComplete(true)}
          />
        )}

        {/* Orbit Controls - disabled during intro animation */}
        <OvalOrbitControls
          minDistance={minDistance}
          maxDistance={maxDistance}
          canvasTarget={canvasTarget}
          enabled={animationComplete}
        />
      </Canvas>
    </div>
  );
}
