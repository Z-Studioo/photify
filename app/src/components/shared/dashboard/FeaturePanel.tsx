import { ChevronLeft } from 'lucide-react';
import { useFeature } from '@/context/dashboard/FeatureContext';
import SelectPhoto from '@/components/shared/dashboard/SelectPhoto';
import ShapeSelector from '@/components/shared/dashboard/ShapeSelector';
import RatioSizePanel from '@/components/shared/dashboard/RatioSizePanel';
import EdgeSelector from './EdgeSelector';
import { useView } from '@/context/ViewContext';

const FeaturePanel = () => {
  const { selectedFeature, setSelectedFeature } = useFeature();
  const { selectedView, setSelectedView } = useView();

  if (!selectedFeature) return null;

  const renderFeatureContent = () => {
    switch (selectedFeature.name) {
      case 'SELECT PHOTO':
        return (
          <div data-tour='feature-select-photo'>
            <SelectPhoto />
          </div>
        );
      case 'IMAGE SIZE AND CROP PHOTO':
        return (
          <div data-tour='feature-ratio-size'>
            <RatioSizePanel />
          </div>
        );
      case 'ROUND FORMATS AND SHAPES':
        return (
          <div data-tour='feature-shape-selector'>
            <ShapeSelector />
          </div>
        );
      case 'SIDE APPEARANCE':
        return (
          <div data-tour='feature-edge-selector'>
            <EdgeSelector />
          </div>
        );
      default:
        return (
          <div
            data-tour='feature-coming-soon'
            className='text-gray-500 text-center py-4'
          >
            Feature configuration coming soon
          </div>
        );
    }
  };

  const handleGoBack = () => {
    if (selectedView === 'crop') setSelectedView('room');
    setSelectedFeature(null);
  };

  return (
    <div
      className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
        selectedFeature ? 'translate-x-0' : 'translate-x-full'
      } bg-gray-50 flex flex-col h-full`}
      data-tour='feature-panel'
    >
      {/* Header */}
      <div className='relative flex items-center p-4 flex-shrink-0'>
        <ChevronLeft
          className='h-4 w-4 text-gray-600 cursor-pointer'
          onClick={handleGoBack}
          data-tour='feature-back-btn'
        />
        <h3
          className='absolute left-1/2 transform -translate-x-1/2 text-lg font-bold text-center'
          data-tour='feature-title'
        >
          {selectedFeature.name}
        </h3>
      </div>

      {/* Scrollable content */}
      <div className='flex-1 overflow-auto p-4'>{renderFeatureContent()}</div>
    </div>
  );
};

export default FeaturePanel;
