'use client';
import { ChevronLeft } from 'lucide-react';
import { useFeature } from '@/context/dashboard/FeatureContext';
import SelectPhoto from '@/components/shared/dashboard/SelectPhoto';
import ShapeSelector from '@/components/shared/dashboard/ShapeSelector';

const FeaturePanel = () => {
  const { selectedFeature, setSelectedFeature } = useFeature();

  if (!selectedFeature) return null;

  const renderFeatureContent = () => {
    switch (selectedFeature.name) {
      case 'SELECT PHOTO':
        return <SelectPhoto />; // render your SelectPhoto component
      case 'ROUND FORMATS AND SHAPES':
        return <ShapeSelector />;
      default:
        return (
          <div className='text-gray-500'>Feature configuration coming soon</div>
        );
    }
  };

  return (
    <div
      className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
        selectedFeature ? 'translate-x-0' : 'translate-x-full'
      } bg-gray-50 flex flex-col h-full`}
    >
      {/* Header */}
      <div className='relative flex items-center p-4 flex-shrink-0'>
        <ChevronLeft
          className='h-4 w-4 text-gray-600 cursor-pointer'
          onClick={() => setSelectedFeature(null)}
        />
        <h3 className='absolute left-1/2 transform -translate-x-1/2 text-lg font-bold text-center'>
          {selectedFeature.name}
        </h3>
      </div>

      {/* Scrollable content */}
      <div className='flex-1 overflow-auto p-4'>{renderFeatureContent()}</div>
    </div>
  );
};

export default FeaturePanel;
