import { Html } from '@react-three/drei';

interface RulerOverlayProps {
  canvasWidth: number; // in inches
  canvasHeight: number; // in inches
  canvasPosition?: [number, number, number]; // 3D position [x, y, z]
  showRuler: boolean;
  showFurnitureRulers?: boolean; // Optional: show console table rulers
}

export function RulerOverlay({
  canvasWidth,
  canvasHeight,
  canvasPosition = [0, 2.2, -4.9645], // Default from single-canvas
  showRuler,
  showFurnitureRulers = true,
}: RulerOverlayProps) {
  if (!showRuler) return null;

  const widthInUnits = canvasWidth / 10;
  const heightInUnits = canvasHeight / 10;
  const [canvasX, canvasY, canvasZ] = canvasPosition;

  const widthInches = canvasWidth.toFixed(1);
  const heightInches = canvasHeight.toFixed(1);

  return (
    <group>
      {/* Top width ruler - positioned ABOVE canvas */}
      <group position={[canvasX, canvasY + heightInUnits / 2 + 0.5, canvasZ]}>
        {/* Horizontal line - Half thickness */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[widthInUnits, 0.015, 0.015]} />
          <meshBasicMaterial color='#f63a9e' />
        </mesh>

        {/* Left end cap */}
        <mesh position={[-widthInUnits / 2, 0, 0]}>
          <boxGeometry args={[0.015, 0.2, 0.015]} />
          <meshBasicMaterial color='#f63a9e' />
        </mesh>

        {/* Right end cap */}
        <mesh position={[widthInUnits / 2, 0, 0]}>
          <boxGeometry args={[0.015, 0.2, 0.015]} />
          <meshBasicMaterial color='#f63a9e' />
        </mesh>

        {/* Width label */}
        <Html center position={[0, 0.3, 0]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#f63a9e',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              border: '2px solid #f63a9e',
            }}
          >
            {widthInches}&quot;
          </div>
        </Html>
      </group>

      {/* Right height ruler - positioned RIGHT of canvas */}
      <group position={[canvasX + widthInUnits / 2 + 0.5, canvasY, canvasZ]}>
        {/* Vertical line - Half thickness */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.015, heightInUnits, 0.015]} />
          <meshBasicMaterial color='#f63a9e' />
        </mesh>

        {/* Top end cap */}
        <mesh position={[0, heightInUnits / 2, 0]}>
          <boxGeometry args={[0.2, 0.015, 0.015]} />
          <meshBasicMaterial color='#f63a9e' />
        </mesh>

        {/* Bottom end cap */}
        <mesh position={[0, -heightInUnits / 2, 0]}>
          <boxGeometry args={[0.2, 0.015, 0.015]} />
          <meshBasicMaterial color='#f63a9e' />
        </mesh>

        {/* Height label */}
        <Html center position={[0.4, 0, 0]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#f63a9e',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              border: '2px solid #f63a9e',
            }}
          >
            {heightInches}&quot;
          </div>
        </Html>
      </group>

      {/* Optional: Console table rulers */}
      {showFurnitureRulers && (
        <>
          {/* Console table width ruler (horizontal - ABOVE table, close to wall) */}
          <group position={[0, 0.2, -4.8]}>
            {/* Horizontal line - 48" = 4.8 units - Half thickness */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[4.8, 0.015, 0.015]} />
              <meshBasicMaterial color='#f63a9e' />
            </mesh>

            {/* Left end cap */}
            <mesh position={[-2.4, 0, 0]}>
              <boxGeometry args={[0.015, 0.2, 0.015]} />
              <meshBasicMaterial color='#f63a9e' />
            </mesh>

            {/* Right end cap */}
            <mesh position={[2.4, 0, 0]}>
              <boxGeometry args={[0.015, 0.2, 0.015]} />
              <meshBasicMaterial color='#f63a9e' />
            </mesh>

            {/* Width label */}
            <Html
              center
              position={[0, 0.3, 0]}
              style={{ pointerEvents: 'none' }}
            >
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#f63a9e',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  border: '2px solid #f63a9e',
                }}
              >
                48&quot;
              </div>
            </Html>
          </group>

          {/* Console table height ruler (vertical - RIGHT of table, close to wall) */}
          <group position={[3.2, -1.3, -4.8]}>
            {/* Vertical line - 12" = 1.2 units - Half thickness */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.015, 1.2, 0.015]} />
              <meshBasicMaterial color='#f63a9e' />
            </mesh>

            {/* Top end cap */}
            <mesh position={[0, 0.6, 0]}>
              <boxGeometry args={[0.2, 0.015, 0.015]} />
              <meshBasicMaterial color='#f63a9e' />
            </mesh>

            {/* Bottom end cap */}
            <mesh position={[0, -0.6, 0]}>
              <boxGeometry args={[0.2, 0.015, 0.015]} />
              <meshBasicMaterial color='#f63a9e' />
            </mesh>

            {/* Height label */}
            <Html
              center
              position={[0.4, 0, 0]}
              style={{ pointerEvents: 'none' }}
            >
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#f63a9e',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  border: '2px solid #f63a9e',
                }}
              >
                12&quot;
              </div>
            </Html>
          </group>
        </>
      )}
    </group>
  );
}
