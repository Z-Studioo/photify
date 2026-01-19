import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CollageMeshProps {
  imageUrl: string | null; // Composite collage image from fabric.js
  width: number; // Canvas width in inches
  height: number; // Canvas height in inches
  showCanvas?: boolean; // Whether to show the canvas (for preview)
}

export function CollageMesh({
  imageUrl,
  width,
  height,
  showCanvas = true,
}: CollageMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const canvasWidth = width / 10; // Convert inches to Three.js units
  const canvasHeight = height / 10;
  const canvasDepth = 0.0709; // Standard canvas depth

  const imageTexture = useMemo(() => {
    if (!imageUrl) return null;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(imageUrl);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 16;
    return tex;
  }, [imageUrl]);

  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(canvasWidth, canvasHeight, canvasDepth);
  }, [canvasWidth, canvasHeight, canvasDepth]);

  const materials = useMemo(() => {
    if (!imageTexture) {
      // Placeholder material when no image
      return new THREE.MeshStandardMaterial({
        color: '#f5f5f5',
        roughness: 0.8,
      });
    }

    // Front face material (the collage)
    const frontMaterial = new THREE.MeshStandardMaterial({
      map: imageTexture,
      toneMapped: false,
      roughness: 0.5,
      metalness: 0.0,
    });

    // Edge materials (white canvas sides)
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.7,
      metalness: 0.0,
    });

    // Back material (plain white)
    const backMaterial = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.8,
      metalness: 0.0,
    });

    // Material array for BoxGeometry faces:
    // [right, left, top, bottom, front, back]
    return [
      edgeMaterial, // Right
      edgeMaterial, // Left
      edgeMaterial, // Top
      edgeMaterial, // Bottom
      frontMaterial, // Front (collage)
      backMaterial, // Back
    ];
  }, [imageTexture]);

  useFrame(() => {
    if (meshRef.current) {
      // Keep canvas upright (no rotation)
      meshRef.current.rotation.x = 0;
      meshRef.current.rotation.y = 0;
    }
  });

  if (!showCanvas) return null;

  return (
    <group
      position={[0, 2.2, -4.9645]} // Standard wall hanging position
      rotation={[0, 0, 0]}
    >
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={materials}
        castShadow={true}
        receiveShadow={false}
      />
    </group>
  );
}
