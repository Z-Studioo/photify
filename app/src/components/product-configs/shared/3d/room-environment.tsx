import { useRef, useMemo } from 'react';
import * as THREE from 'three';

/**
 * Room Scene Component with Realistic Scale Reference
 * Scale: 1 Three.js unit = 10 inches (real-world)
 * 
 * Furniture dimensions (real-world):
 * - Armchair: 32" wide x 36" tall x 32" deep (perfect scale reference!)
 * - Side table: 20" wide x 24" tall x 20" deep
 * - Floor lamp: 12" base x 60" tall
 * 
 * Why armchair instead of sofa?
 * - Better scale comparison with small canvases (4x6", 8x10")
 * - Both chair and canvas fit in viewport together
 * - Standard armchair = familiar reference for users
 */
export function RoomEnvironment({ wallColor = '#d4e4d4' }: { wallColor?: string }) {
  const groupRef = useRef<THREE.Group>(null);

  // Create procedural tile texture for floor
  const floorTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Tile size (each tile is 64x64 pixels for 8x8 grid)
    const tileSize = 64;
    const groutWidth = 2; // Grout line width

    // Fill with white tiles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);

    // Draw grout lines (light gray)
    ctx.fillStyle = '#e8e8e8';
    for (let i = 0; i <= 512; i += tileSize) {
      // Vertical lines
      ctx.fillRect(i - groutWidth / 2, 0, groutWidth, 512);
      // Horizontal lines
      ctx.fillRect(0, i - groutWidth / 2, 512, groutWidth);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 10); // Repeat pattern across floor
    return texture;
  }, []);

  return (
    <group ref={groupRef}>
      {/* Floor - White glossy tiles - 480" wide x 400" deep (48 x 40 units) */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -2, 0]} 
        receiveShadow
      >
        <planeGeometry args={[48, 40]} />
        <meshStandardMaterial 
          map={floorTexture}
          color="#ffffff"
          roughness={0.15} // Glossy finish
          metalness={0.3}  // Slight reflective quality
          envMapIntensity={0.8}
        />
      </mesh>

      {/* Main Wall (where canvas hangs) - 480" wide x 400" tall - 4x larger */}
      <mesh 
        position={[0, 3, -5]} 
        receiveShadow
      >
        <planeGeometry args={[48, 40]} />
        <meshStandardMaterial 
          color={wallColor}
          roughness={0.95}
          metalness={0.0}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Baseboard - 480" wide x 6" tall - 4x wider */}
      <mesh position={[0, -1.7, -4.95]} castShadow>
        <boxGeometry args={[48, 0.6, 0.1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>

      {/* ===== REALISTIC-SIZED FURNITURE ===== */}
      
      {/* Modern console table - centered against wall */}
      <group position={[0, -1.8, -3.8]}>
        {/* Table top - 48"W x 2"H x 16"D */}
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.8, 0.2, 1.6]} />
          <meshStandardMaterial 
            color="#2f2f31" 
            roughness={0.6}
            metalness={0.2}
          />
        </mesh>

        {/* Table apron */}
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[4.6, 0.15, 1.4]} />
          <meshStandardMaterial 
            color="#3a3a3d" 
            roughness={0.65}
          />
        </mesh>

        {/* Slender metal legs - 4 legs */}
        {[-2.1, 2.1].map((x) => (
          [-0.6, 0.6].map((z) => (
            <mesh key={`leg-${x}-${z}`} position={[x, 0.1, z]} castShadow>
              <boxGeometry args={[0.1, 1.0, 0.1]} />
              <meshStandardMaterial 
                color="#1f1f21" 
                roughness={0.4}
                metalness={0.4}
              />
            </mesh>
          ))
        ))}

        {/* Decorative books stack */}
        <group position={[-1.2, 1.25, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh key={`book-${i}`} position={[0, i * 0.12, 0]} castShadow>
              <boxGeometry args={[0.8 - i * 0.05, 0.1, 0.5]} />
              <meshStandardMaterial 
                color={i % 2 === 0 ? '#d7d0c5' : '#b8b0a4'} 
                roughness={0.7}
              />
            </mesh>
          ))}
        </group>

        {/* Minimal vase */}
        <group position={[1.3, 1.25, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.25, 0.15, 0.6, 16]} />
            <meshStandardMaterial 
              color="#f1e9da" 
              roughness={0.35}
              metalness={0.05}
            />
          </mesh>
          {/* Simple dried stems */}
          {[0, 1, 2].map((i) => (
            <mesh key={`stem-${i}`} position={[0, 0.4 + i * 0.1, 0]}>
              <cylinderGeometry args={[0.01, 0.01, 0.6, 6]} />
              <meshStandardMaterial color="#c2a27c" roughness={0.6} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Floor Lamp - Left of console table - against wall */}
      <group position={[-3.4, -2, -3.8]}>
        {/* Lamp base - 12" diameter */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.6, 0.6, 0.08, 16]} />
          <meshStandardMaterial color="#2c2c2c" roughness={0.6} metalness={0.4} />
        </mesh>
        
        {/* Lamp pole - 50" tall */}
        <mesh position={[0, 2.5, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 5.0, 16]} />
          <meshStandardMaterial color="#2c2c2c" roughness={0.6} metalness={0.4} />
        </mesh>
        
        {/* Lamp shade - 16" diameter x 10" tall */}
        <mesh position={[0, 5.3, 0]} castShadow>
          <coneGeometry args={[0.8, 1.0, 16, 1, true]} />
          <meshStandardMaterial 
            color="#f5f5dc" 
            roughness={0.9}
            side={THREE.DoubleSide}
            emissive="#ffeecc"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}

