import { Square, Circle, Hexagon, Octagon } from 'lucide-react';
import { useUpload, type CanvasShape } from '@/context/UploadContext';

const shapes: {
  id: CanvasShape;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}[] = [
  { id: 'rectangle', name: 'Rectangle', icon: Square },
  { id: 'round', name: 'Round', icon: Circle },
  { id: 'hexagon', name: 'Hexagon', icon: Hexagon },
  { id: 'octagon', name: 'Octagon', icon: Octagon },
  { id: 'dodecagon', name: 'Dodecagon', icon: Octagon }, // Using Octagon icon as closest match
];

const ShapeSelector = () => {
  const { shape, setShape } = useUpload();

  return (
    <div className='space-y-4'>
      <div className='text-sm text-gray-600 mb-4'>
        Choose the shape for your canvas:
      </div>

      <div className='grid grid-cols-2 gap-3'>
        {shapes.map(shapeOption => (
          <div
            key={shapeOption.id}
            className={`
              flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all
              ${
                shape === shapeOption.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }
            `}
            onClick={() => setShape(shapeOption.id)}
          >
            <shapeOption.icon className='h-8 w-8 mb-2' />
            <span className='text-xs font-medium text-center'>
              {shapeOption.name}
            </span>
          </div>
        ))}
      </div>

      <div className='mt-6 p-3 bg-gray-50 rounded-lg'>
        <p className='text-xs text-gray-600'>
          <strong>Selected:</strong>{' '}
          {shapes.find(s => s.id === shape)?.name || 'Rectangle'}
        </p>
        <p className='text-xs text-gray-500 mt-1'>
          The canvas will be rendered in the selected shape format.
        </p>
      </div>
    </div>
  );
};

export default ShapeSelector;
