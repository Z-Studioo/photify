interface AspectRatioIconProps {
  ratio: string; // e.g. "16:9", "3:4", etc.
  size?: number; // overall max size in px (default 20)
}

export function AspectRatioIcon({
  ratio,
  size = 20,
}: AspectRatioIconProps) {
  const [w, h] = ratio.split(':').map(Number);

  const maxSide = Math.max(w, h);
  const width = (w / maxSide) * size;
  const height = (h / maxSide) * size;

  return (
    <div
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div
        className="border-[3px] rounded-xs border-gray-700"
        style={{
          width,
          height,
        }}
      />
    </div>
  );
}
