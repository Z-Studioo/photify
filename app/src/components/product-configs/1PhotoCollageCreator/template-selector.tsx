import { motion } from 'framer-motion';
import { Check, Grid3x3, Maximize2, LayoutGrid } from 'lucide-react';
import { type CollageTemplate, PREDEFINED_TEMPLATES } from './types';
import { getCanvasDimensionsFromAspectRatio } from './config';

interface TemplateSelectorProps {
  selectedTemplate: CollageTemplate | null;
  onSelectTemplate: (template: CollageTemplate) => void;
}

export function TemplateSelector({
  selectedTemplate,
  onSelectTemplate,
}: TemplateSelectorProps) {
  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'grid':
        return <Grid3x3 className='w-5 h-5' />;
      case 'freeform':
        return <Maximize2 className='w-5 h-5' />;
      case 'fixed-slots':
        return <LayoutGrid className='w-5 h-5' />;
      default:
        return <Grid3x3 className='w-5 h-5' />;
    }
  };

  const getTemplatePreview = (template: CollageTemplate) => {
    const { type, config } = template;

    if (type === 'grid') {
      const { rows, columns } = config as any;
      return (
        <div
          className='grid gap-1 p-3'
          style={{
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
          }}
        >
          {Array.from({ length: rows * columns }).map((_, i) => (
            <div key={i} className='bg-gray-300 rounded aspect-square' />
          ))}
        </div>
      );
    }

    if (type === 'freeform') {
      return (
        <div className='relative p-3 h-24'>
          <div className='absolute top-2 left-2 w-12 h-12 bg-gray-300 rounded transform rotate-6' />
          <div className='absolute top-4 right-3 w-10 h-10 bg-gray-400 rounded transform -rotate-12' />
          <div className='absolute bottom-2 left-4 w-14 h-10 bg-gray-350 rounded transform rotate-3' />
        </div>
      );
    }

    if (type === 'fixed-slots') {
      const { slots } = config as any;

      // Calculate preview dimensions (scale down to fit in preview)
      const maxX = Math.max(...slots.map((s: any) => s.x + s.width));
      const maxY = Math.max(...slots.map((s: any) => s.y + s.height));
      const scale = 100 / Math.max(maxX, maxY); // Scale to fit in ~100px preview

      return (
        <div className='relative w-full h-24 p-2 overflow-hidden'>
          {slots.map((slot: any, i: number) => {
            const colors = [
              'bg-gray-300',
              'bg-gray-400',
              'bg-gray-350',
              'bg-gray-500',
              'bg-gray-450',
            ];
            return (
              <div
                key={slot.id}
                className={`absolute ${colors[i % colors.length]} rounded shadow-sm`}
                style={{
                  left: `${slot.x * scale}px`,
                  top: `${slot.y * scale}px`,
                  width: `${slot.width * scale}px`,
                  height: `${slot.height * scale}px`,
                  transform: `rotate(${slot.rotation || 0}deg)`,
                  transformOrigin: 'center center',
                }}
              />
            );
          })}
        </div>
      );
    }

    return null;
  };

  return (
    <div className='space-y-3'>
      {/* Show predefined templates if any exist */}
      {PREDEFINED_TEMPLATES.map(template => {
        const isSelected = selectedTemplate?.id === template.id;

        return (
          <motion.button
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className={`relative w-full text-left rounded-lg border-2 transition-all overflow-hidden ${
              isSelected
                ? 'border-[#f63a9e] shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Selected Checkmark */}
            {isSelected && (
              <div className='absolute top-2 right-2 w-6 h-6 bg-[#f63a9e] rounded-full flex items-center justify-center z-10'>
                <Check className='w-4 h-4 text-white' />
              </div>
            )}

            {/* Template Preview */}
            <div className={`bg-white ${isSelected ? 'bg-pink-50' : ''}`}>
              {getTemplatePreview(template)}
            </div>

            {/* Template Info */}
            <div
              className={`px-3 py-2 border-t ${isSelected ? 'border-pink-200 bg-pink-50' : 'border-gray-100'}`}
            >
              <div className='flex items-center gap-2'>
                <div
                  className={isSelected ? 'text-[#f63a9e]' : 'text-gray-600'}
                >
                  {getTemplateIcon(template.type)}
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2'>
                    <h3 className='font-semibold text-sm text-gray-900'>
                      {template.name}
                    </h3>
                    <span className='text-[10px] font-semibold text-[#f63a9e] bg-pink-50 px-1.5 py-0.5 rounded-full shrink-0'>
                      {
                        getCanvasDimensionsFromAspectRatio(
                          template.aspectRatio
                        ).label.split(' ')[0]
                      }
                    </span>
                  </div>
                  {template.description && (
                    <p className='text-xs text-gray-500 mt-0.5'>
                      {template.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
