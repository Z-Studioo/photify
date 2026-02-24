import { useMemo } from 'react';

interface RulerOverlay2DProps {
  showRulers: boolean;
  containerWidth: number;
  containerHeight: number;
  canvasPositions: Array<{ x: number; y: number }>;
  canvasDims: { width: number; height: number };
  customSpacing: number;
  scale: number;
  canvasWidth: number;
  canvasHeight: number;
  offsetX?: number;
  offsetY?: number;
}

export function RulerOverlay2D({ 
  showRulers, 
  canvasPositions,
  canvasDims,
  customSpacing,
  scale,
  canvasWidth,
  canvasHeight,
  offsetX = 0,
  offsetY = 0,
}: RulerOverlay2DProps) {

  // Calculate ruler positions for all canvases
  const rulers = useMemo(() => {
    if (!showRulers || canvasPositions.length === 0) return null;

    const isMobile = window.innerWidth < 640;

    const rulerGap      = isMobile ? 14 : 28; // px between canvas edge and ruler line
    const capHalf       = isMobile ? 5  : 10; // half-length of the end-cap tick mark
    const strokeW       = isMobile ? 1.5 : 3;
    const fontSize      = isMobile ? 9   : 14;
    const fontWeight    = '700';
    const labelH        = isMobile ? 16  : 28;
    const labelPadX     = isMobile ? 6   : 12; // horizontal padding inside label box
    const labelRx       = isMobile ? 3   : 6;
    const labelStrokeW  = isMobile ? 1   : 2;

    const firstCanvas = canvasPositions[0];
    const lastCanvas = canvasPositions[canvasPositions.length - 1];
    
    // Scaled dimensions
    const scaledWidth  = canvasDims.width  * scale;
    const scaledHeight = canvasDims.height * scale;
    
    // Top horizontal rulers (one for EACH canvas width)
    const topRulers = canvasPositions.map((canvas) => {
      const scaledCanvas = {
        x: canvas.x * scale + offsetX,
        y: canvas.y * scale + offsetY
      };
      
      return {
        startX: scaledCanvas.x,
        startY: scaledCanvas.y - rulerGap,
        endX: scaledCanvas.x + scaledWidth,
        endY: scaledCanvas.y - rulerGap,
        label: `${canvasWidth}"`,
      };
    });

    // Right vertical ruler (for canvas height)
    const scaledLastCanvas = {
      x: lastCanvas.x * scale + offsetX,
      y: lastCanvas.y * scale + offsetY
    };
    
    const rightRuler = {
      startX: scaledLastCanvas.x + scaledWidth + rulerGap,
      startY: scaledLastCanvas.y,
      endX: scaledLastCanvas.x + scaledWidth + rulerGap,
      endY: scaledLastCanvas.y + scaledHeight,
      label: `${canvasHeight}"`,
    };

    // Bottom horizontal ruler (total width including all canvases + spacing)
    const scaledFirstCanvas = {
      x: firstCanvas.x * scale + offsetX,
      y: firstCanvas.y * scale + offsetY
    };
    
    const totalWidth = (canvasWidth * canvasPositions.length) + (customSpacing * (canvasPositions.length - 1));
    // On mobile use a shorter label to fit inside the narrow label box
    const bottomLabel = isMobile
      ? `${totalWidth}" total`
      : `${totalWidth}" (including ${customSpacing}" spacing)`;

    const bottomRuler = {
      startX: scaledFirstCanvas.x,
      startY: scaledFirstCanvas.y + scaledHeight + rulerGap,
      endX: scaledLastCanvas.x + scaledWidth,
      endY: scaledFirstCanvas.y + scaledHeight + rulerGap,
      label: bottomLabel,
    };

    return { topRulers, rightRuler, bottomRuler, capHalf, strokeW, fontSize, fontWeight, labelH, labelPadX, labelRx, labelStrokeW };
  }, [showRulers, canvasPositions, canvasDims, scale, canvasWidth, canvasHeight, customSpacing, offsetX, offsetY]);

  if (!showRulers || !rulers) return null;

  const { topRulers, rightRuler, bottomRuler, capHalf, strokeW, fontSize, fontWeight, labelH, labelPadX, labelRx, labelStrokeW } = rulers;

  // Helper: measure approximate label width based on character count
  const approxLabelWidth = (text: string) => Math.max(text.length * fontSize * 0.62 + labelPadX * 2, labelH * 2);

  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Top Horizontal Rulers (one per canvas) */}
      {topRulers.map((topRuler) => {
        const midX = (topRuler.startX + topRuler.endX) / 2;
        const lw = approxLabelWidth(topRuler.label);
        return (
        <g key={`top-ruler-${topRuler.startX}-${topRuler.startY}`}>
          {/* Main horizontal line */}
          <line
            x1={topRuler.startX}
            y1={topRuler.startY}
            x2={topRuler.endX}
            y2={topRuler.endY}
            stroke="#f63a9e"
            strokeWidth={strokeW}
          />
          {/* Start cap */}
          <line
            x1={topRuler.startX}
            y1={topRuler.startY - capHalf}
            x2={topRuler.startX}
            y2={topRuler.startY + capHalf}
            stroke="#f63a9e"
            strokeWidth={strokeW}
          />
          {/* End cap */}
          <line
            x1={topRuler.endX}
            y1={topRuler.endY - capHalf}
            x2={topRuler.endX}
            y2={topRuler.endY + capHalf}
            stroke="#f63a9e"
            strokeWidth={strokeW}
          />
          {/* Label background */}
          <rect
            x={midX - lw / 2}
            y={topRuler.startY - labelH / 2 - labelH * 0.1}
            width={lw}
            height={labelH}
            fill="white"
            stroke="#f63a9e"
            strokeWidth={labelStrokeW}
            rx={labelRx}
          />
          {/* Label text */}
          <text
            x={midX}
            y={topRuler.startY + labelH * 0.1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#f63a9e"
            fontSize={fontSize}
            fontWeight={fontWeight}
            fontFamily="'Mona Sans', sans-serif"
          >
            {topRuler.label}
          </text>
        </g>
        );
      })}

      {/* Right Vertical Ruler */}
      <g>
        {/* Main vertical line */}
        <line
          x1={rightRuler.startX}
          y1={rightRuler.startY}
          x2={rightRuler.endX}
          y2={rightRuler.endY}
          stroke="#f63a9e"
          strokeWidth={strokeW}
        />
        {/* Start cap */}
        <line
          x1={rightRuler.startX - capHalf}
          y1={rightRuler.startY}
          x2={rightRuler.startX + capHalf}
          y2={rightRuler.startY}
          stroke="#f63a9e"
          strokeWidth={strokeW}
        />
        {/* End cap */}
        <line
          x1={rightRuler.endX - capHalf}
          y1={rightRuler.endY}
          x2={rightRuler.endX + capHalf}
          y2={rightRuler.endY}
          stroke="#f63a9e"
          strokeWidth={strokeW}
        />
        {/* Label background */}
        {(() => {
          const midY = (rightRuler.startY + rightRuler.endY) / 2;
          const lw = approxLabelWidth(rightRuler.label);
          return (
            <>
              <rect
                x={rightRuler.startX + labelStrokeW + 2}
                y={midY - labelH / 2}
                width={lw}
                height={labelH}
                fill="white"
                stroke="#f63a9e"
                strokeWidth={labelStrokeW}
                rx={labelRx}
              />
              <text
                x={rightRuler.startX + labelStrokeW + 2 + lw / 2}
                y={midY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#f63a9e"
                fontSize={fontSize}
                fontWeight={fontWeight}
                fontFamily="'Mona Sans', sans-serif"
              >
                {rightRuler.label}
              </text>
            </>
          );
        })()}
      </g>

      {/* Bottom Horizontal Ruler */}
      <g>
        {/* Main horizontal line */}
        <line
          x1={bottomRuler.startX}
          y1={bottomRuler.startY}
          x2={bottomRuler.endX}
          y2={bottomRuler.endY}
          stroke="#f63a9e"
          strokeWidth={strokeW}
        />
        {/* Start cap */}
        <line
          x1={bottomRuler.startX}
          y1={bottomRuler.startY - capHalf}
          x2={bottomRuler.startX}
          y2={bottomRuler.startY + capHalf}
          stroke="#f63a9e"
          strokeWidth={strokeW}
        />
        {/* End cap */}
        <line
          x1={bottomRuler.endX}
          y1={bottomRuler.endY - capHalf}
          x2={bottomRuler.endX}
          y2={bottomRuler.endY + capHalf}
          stroke="#f63a9e"
          strokeWidth={strokeW}
        />
        {/* Label background */}
        {(() => {
          const midX = (bottomRuler.startX + bottomRuler.endX) / 2;
          const lw = approxLabelWidth(bottomRuler.label);
          return (
            <>
              <rect
                x={midX - lw / 2}
                y={bottomRuler.startY + labelStrokeW + 2}
                width={lw}
                height={labelH}
                fill="white"
                stroke="#f63a9e"
                strokeWidth={labelStrokeW}
                rx={labelRx}
              />
              <text
                x={midX}
                y={bottomRuler.startY + labelStrokeW + 2 + labelH / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#f63a9e"
                fontSize={fontSize}
                fontWeight={fontWeight}
                fontFamily="'Mona Sans', sans-serif"
              >
                {bottomRuler.label}
              </text>
            </>
          );
        })()}
      </g>
    </svg>
  );
}