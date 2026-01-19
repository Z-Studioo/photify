import { useMemo } from 'react';

interface RulerOverlay2DProps {
  showRulers: boolean;
  containerWidth: number;
  containerHeight: number;
  canvasPositions: Array<{ x: number; y: number }>;
  canvasDims: { width: number; height: number };
  customSpacing: number;
  scale: number; // Viewport scale factor
  canvasWidth: number; // Canvas width in inches
  canvasHeight: number; // Canvas height in inches
}

export function RulerOverlay2D({ 
  showRulers, 
  canvasPositions,
  canvasDims,
  customSpacing,
  scale,
  canvasWidth,
  canvasHeight
}: RulerOverlay2DProps) {

  // Calculate ruler positions for all canvases
  const rulers = useMemo(() => {
    if (!showRulers || canvasPositions.length === 0) return null;

    const firstCanvas = canvasPositions[0];
    const lastCanvas = canvasPositions[canvasPositions.length - 1];
    
    // Scaled dimensions
    const scaledWidth = canvasDims.width * scale;
    const scaledHeight = canvasDims.height * scale;
    
    // Top horizontal rulers (one for EACH canvas width)
    const topRulers = canvasPositions.map((canvas) => {
      const scaledCanvas = {
        x: canvas.x * scale,
        y: canvas.y * scale
      };
      
      return {
        startX: scaledCanvas.x,
        startY: scaledCanvas.y - 40,
        endX: scaledCanvas.x + scaledWidth,
        endY: scaledCanvas.y - 40,
        label: `${canvasWidth}"`,
      };
    });

    // Right vertical ruler (for canvas height)
    const scaledLastCanvas = {
      x: lastCanvas.x * scale,
      y: lastCanvas.y * scale
    };
    
    const rightRuler = {
      startX: scaledLastCanvas.x + scaledWidth + 40,
      startY: scaledLastCanvas.y,
      endX: scaledLastCanvas.x + scaledWidth + 40,
      endY: scaledLastCanvas.y + scaledHeight,
      label: `${canvasHeight}"`,
    };

    // Bottom horizontal ruler (total width including all canvases + spacing)
    const scaledFirstCanvas = {
      x: firstCanvas.x * scale,
      y: firstCanvas.y * scale
    };
    
    const totalWidth = (canvasWidth * canvasPositions.length) + (customSpacing * (canvasPositions.length - 1));
    const bottomRuler = {
      startX: scaledFirstCanvas.x,
      startY: scaledFirstCanvas.y + scaledHeight + 60,
      endX: scaledLastCanvas.x + scaledWidth,
      endY: scaledFirstCanvas.y + scaledHeight + 60,
      label: `${totalWidth}" (including ${customSpacing}" spacing)`,
    };

    return { topRulers, rightRuler, bottomRuler };
  }, [showRulers, canvasPositions, canvasDims, scale, canvasWidth, canvasHeight, customSpacing]);

  if (!showRulers || !rulers) return null;

  const { topRulers, rightRuler, bottomRuler } = rulers;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Top Horizontal Rulers (one per canvas) */}
      {topRulers.map((topRuler, index) => (
        <g key={`top-ruler-${index}`}>
          {/* Main horizontal line */}
          <line
            x1={topRuler.startX}
            y1={topRuler.startY}
            x2={topRuler.endX}
            y2={topRuler.endY}
            stroke="#f63a9e"
            strokeWidth="3"
          />
          
          {/* Start cap (vertical line) */}
          <line
            x1={topRuler.startX}
            y1={topRuler.startY - 12}
            x2={topRuler.startX}
            y2={topRuler.startY + 12}
            stroke="#f63a9e"
            strokeWidth="3"
          />
          
          {/* End cap (vertical line) */}
          <line
            x1={topRuler.endX}
            y1={topRuler.endY - 12}
            x2={topRuler.endX}
            y2={topRuler.endY + 12}
            stroke="#f63a9e"
            strokeWidth="3"
          />
          
          {/* Label background */}
          <rect
            x={(topRuler.startX + topRuler.endX) / 2 - 30}
            y={topRuler.startY - 18}
            width="60"
            height="28"
            fill="white"
            stroke="#f63a9e"
            strokeWidth="2"
            rx="6"
          />
          
          {/* Label text */}
          <text
            x={(topRuler.startX + topRuler.endX) / 2}
            y={topRuler.startY - 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#f63a9e"
            fontSize="14"
            fontWeight="700"
            fontFamily="'Mona Sans', sans-serif"
          >
            {topRuler.label}
          </text>
        </g>
      ))}

      {/* Right Vertical Ruler */}
      <g>
        {/* Main vertical line */}
        <line
          x1={rightRuler.startX}
          y1={rightRuler.startY}
          x2={rightRuler.endX}
          y2={rightRuler.endY}
          stroke="#f63a9e"
          strokeWidth="3"
        />
        
        {/* Start cap (horizontal line) */}
        <line
          x1={rightRuler.startX - 12}
          y1={rightRuler.startY}
          x2={rightRuler.startX + 12}
          y2={rightRuler.startY}
          stroke="#f63a9e"
          strokeWidth="3"
        />
        
        {/* End cap (horizontal line) */}
        <line
          x1={rightRuler.endX - 12}
          y1={rightRuler.endY}
          x2={rightRuler.endX + 12}
          y2={rightRuler.endY}
          stroke="#f63a9e"
          strokeWidth="3"
        />
        
        {/* Label background */}
        <rect
          x={rightRuler.startX + 4}
          y={(rightRuler.startY + rightRuler.endY) / 2 - 16}
          width="60"
          height="28"
          fill="white"
          stroke="#f63a9e"
          strokeWidth="2"
          rx="6"
        />
        
        {/* Label text */}
        <text
          x={rightRuler.startX + 34}
          y={(rightRuler.startY + rightRuler.endY) / 2 - 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#f63a9e"
          fontSize="14"
          fontWeight="700"
          fontFamily="'Mona Sans', sans-serif"
        >
          {rightRuler.label}
        </text>
      </g>

      {/* Bottom Horizontal Ruler (total width with spacing) */}
      <g>
        {/* Main horizontal line */}
        <line
          x1={bottomRuler.startX}
          y1={bottomRuler.startY}
          x2={bottomRuler.endX}
          y2={bottomRuler.endY}
          stroke="#f63a9e"
          strokeWidth="3"
        />
        
        {/* Start cap (vertical line) */}
        <line
          x1={bottomRuler.startX}
          y1={bottomRuler.startY - 12}
          x2={bottomRuler.startX}
          y2={bottomRuler.startY + 12}
          stroke="#f63a9e"
          strokeWidth="3"
        />
        
        {/* End cap (vertical line) */}
        <line
          x1={bottomRuler.endX}
          y1={bottomRuler.endY - 12}
          x2={bottomRuler.endX}
          y2={bottomRuler.endY + 12}
          stroke="#f63a9e"
          strokeWidth="3"
        />
        
        {/* Label background (wider for longer text) */}
        <rect
          x={(bottomRuler.startX + bottomRuler.endX) / 2 - 90}
          y={bottomRuler.startY + 4}
          width="180"
          height="32"
          fill="white"
          stroke="#f63a9e"
          strokeWidth="2"
          rx="8"
        />
        
        {/* Label text */}
        <text
          x={(bottomRuler.startX + bottomRuler.endX) / 2}
          y={bottomRuler.startY + 20}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#f63a9e"
          fontSize="13"
          fontWeight="700"
          fontFamily="'Mona Sans', sans-serif"
        >
          {bottomRuler.label}
        </text>
      </g>
    </svg>
  );
}

