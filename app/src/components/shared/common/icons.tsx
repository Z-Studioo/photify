interface AspectRatioIconProps {
  ratio: string;
  size?: number;
}

export function AspectRatioIcon({ ratio, size = 20 }: AspectRatioIconProps) {
  const [w, h] = ratio.split(':').map(Number);
  const maxSide = Math.max(w, h);
  const width = (w / maxSide) * size;
  const height = (h / maxSide) * size;

  return (
    <div
      className='flex items-center justify-center'
      style={{ width: size, height: size }}
    >
      <div
        className='border-[3px] rounded-xs border-current'
        style={{
          width,
          height,
        }}
      />
    </div>
  );
}
