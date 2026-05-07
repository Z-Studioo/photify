import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Sparkles, Type } from 'lucide-react';
import {
  EVENT_CANVAS_OCCASIONS,
  EVENT_CANVAS_TEMPLATES,
  type EventCanvasOccasion,
  type EventCanvasTemplate,
} from './templates';

interface TemplateGalleryProps {
  selectedTemplateId?: string | null;
  onSelect: (template: EventCanvasTemplate) => void;
}

/**
 * Browseable template gallery grouped by occasion. Lets the customer pick a
 * static design before they enter the editor (TemplateDesigner) to personalise
 * its text + photo slots.
 */
export function TemplateGallery({
  selectedTemplateId,
  onSelect,
}: TemplateGalleryProps) {
  const occasionsWithTemplates = useMemo(
    () =>
      EVENT_CANVAS_OCCASIONS.filter(occasion =>
        EVENT_CANVAS_TEMPLATES.some(t => t.occasion === occasion.id)
      ),
    []
  );

  const [activeOccasion, setActiveOccasion] = useState<EventCanvasOccasion>(
    () => occasionsWithTemplates[0]?.id ?? 'birthday'
  );

  const visibleTemplates = useMemo(
    () => EVENT_CANVAS_TEMPLATES.filter(t => t.occasion === activeOccasion),
    [activeOccasion]
  );

  const activeMeta = useMemo(
    () => occasionsWithTemplates.find(o => o.id === activeOccasion),
    [activeOccasion, occasionsWithTemplates]
  );

  return (
    <div className='w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8'>
      <div className='text-center mb-4 sm:mb-6 md:mb-8'>
        <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-[#f63a9e] text-[11px] sm:text-xs font-semibold mb-2'>
          <Sparkles className='w-3 h-3' />
          Step 2 of 3
        </div>
        <h2
          className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 text-xl sm:text-2xl md:text-3xl mb-1.5"
          style={{ fontWeight: '700' }}
        >
          Pick a template to start from
        </h2>
        <p className='text-xs sm:text-sm text-gray-600 max-w-xl mx-auto'>
          Choose a design for your occasion. You&apos;ll be able to change the
          text and add your own photos in the next step.
        </p>
      </div>

      {/* Occasion tabs */}
      <div className='flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 mb-4 sm:mb-6 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide'>
        {occasionsWithTemplates.map(occasion => {
          const isActive = occasion.id === activeOccasion;
          return (
            <button
              key={occasion.id}
              onClick={() => setActiveOccasion(occasion.id)}
              className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs md:text-sm font-semibold transition-all border-2 ${
                isActive
                  ? 'bg-[#f63a9e] text-white border-[#f63a9e] shadow-md shadow-pink-200/50'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-[#f63a9e] hover:text-[#f63a9e]'
              }`}
            >
              {occasion.label}
            </button>
          );
        })}
      </div>

      {activeMeta && (
        <p className='text-[11px] sm:text-xs text-gray-500 mb-3 sm:mb-4 px-1'>
          {activeMeta.description}
        </p>
      )}

      {/* Template grid */}
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5'>
        {visibleTemplates.map((template, index) => {
          const isSelected = template.id === selectedTemplateId;
          return (
            <motion.button
              key={template.id}
              type='button'
              onClick={() => onSelect(template)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
              whileHover={{ y: -2 }}
              className={`group relative text-left rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all bg-white ${
                isSelected
                  ? 'border-[#f63a9e] shadow-lg shadow-pink-200/50'
                  : 'border-gray-200 hover:border-[#f63a9e] shadow-sm hover:shadow-md'
              }`}
            >
              <div className='relative aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden'>
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  loading='lazy'
                  onError={e => {
                    // Fallback when the asset hasn't been added yet — keep the
                    // card usable instead of breaking the gallery.
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback =
                      target.parentElement?.querySelector('[data-fallback]');
                    if (fallback instanceof HTMLElement) {
                      fallback.style.display = 'flex';
                    }
                  }}
                  className='absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
                />
                <div
                  data-fallback
                  className='absolute inset-0 hidden flex-col items-center justify-center text-gray-400 p-3 text-center'
                >
                  <ImageIcon className='w-8 h-8 mb-1.5' />
                  <span className='text-[10px] sm:text-xs font-medium'>
                    Preview coming soon
                  </span>
                </div>

                {/* Slot badges */}
                <div className='absolute top-2 left-2 flex items-center gap-1'>
                  {template.editableTexts.length > 0 && (
                    <span className='inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/90 backdrop-blur text-[9px] sm:text-[10px] font-semibold text-gray-700 shadow-sm'>
                      <Type className='w-2.5 h-2.5' />
                      {template.editableTexts.length}
                    </span>
                  )}
                  {template.photoSlots.length > 0 && (
                    <span className='inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/90 backdrop-blur text-[9px] sm:text-[10px] font-semibold text-gray-700 shadow-sm'>
                      <ImageIcon className='w-2.5 h-2.5' />
                      {template.photoSlots.length}
                    </span>
                  )}
                </div>

                {isSelected && (
                  <div className='absolute inset-0 ring-4 ring-[#f63a9e] ring-inset pointer-events-none' />
                )}
              </div>

              <div className='px-2.5 sm:px-3 py-2 sm:py-2.5'>
                <h3 className='text-xs sm:text-sm font-semibold text-gray-900 truncate'>
                  {template.name}
                </h3>
                <p className='text-[10px] sm:text-[11px] text-gray-500 mt-0.5'>
                  {template.editableTexts.length} text ·{' '}
                  {template.photoSlots.length} photo slot
                  {template.photoSlots.length === 1 ? '' : 's'}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {visibleTemplates.length === 0 && (
        <div className='text-center py-12 text-sm text-gray-500'>
          No templates yet for this occasion.
        </div>
      )}
    </div>
  );
}
