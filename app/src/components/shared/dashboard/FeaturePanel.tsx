import { ChevronLeft } from 'lucide-react';
import { useFeature } from '@/context/dashboard/FeatureContext';
import SelectPhoto from '@/components/shared/dashboard/SelectPhoto';
import RatioSizePanel from '@/components/shared/dashboard/RatioSizePanel';
import EdgeSelector from './EdgeSelector';
import { useView } from '@/context/ViewContext';
import OptimizationControl from './OptimizationControl';
import { useEdge } from '@/context/EdgeContext';
import { useUpload } from '@/context/UploadContext';

const FeaturePanel = () => {
  const { selectedFeature, setSelectedFeature } = useFeature();
  const { selectedView, setSelectedView } = useView();
  const { cancelPendingEdgeType } = useEdge();
  const { quality, setPendingQuality, cancelPendingCropChanges } = useUpload();

  if (!selectedFeature) return null;

  const renderFeatureContent = () => {
    switch (selectedFeature.name) {
      case 'SELECT PHOTO':
        return <SelectPhoto />;
      case 'IMAGE SIZE AND CROP PHOTO':
        return <RatioSizePanel />;
      case 'SIDE APPEARANCE':
        return <EdgeSelector />;
      case 'IMAGE OPTIMIZATION':
        return <OptimizationControl />;
      case 'ROUND FORMATS AND SHAPES':
        return <EdgeSelector />;

      default:
        return (
          <div className='text-gray-500 text-center'>
            Feature configuration coming soon
          </div>
        );
    }
  };

  const handleGoBack = () => {
    if (selectedFeature?.name === 'SIDE APPEARANCE') {
      cancelPendingEdgeType();
    }

    if (selectedFeature?.name === 'IMAGE OPTIMIZATION') {
      setPendingQuality(quality);
    }

    if (selectedFeature?.name === 'IMAGE SIZE AND CROP PHOTO') {
      cancelPendingCropChanges();
    }

    if (
      selectedView === 'crop' ||
      selectedView === 'optimization' ||
      selectedFeature?.name === 'SIDE APPEARANCE'
    )
      setSelectedView('3droom');
    setSelectedFeature(null);
  };

  return (
    <div
      className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
        selectedFeature ? 'translate-x-0' : '-translate-x-full'
      } bg-gray-50 flex flex-col h-full`}
    >
      <div className='relative flex items-center p-4 flex-shrink-0'>
        <ChevronLeft
          className='h-4 w-4 text-gray-600 cursor-pointer'
          onClick={handleGoBack}
        />
        <h3
          className={`absolute left-1/2 transform -translate-x-1/2 text-lg font-bold text-center whitespace-nowrap px-2`}
        >
          {selectedFeature.name}
        </h3>
      </div>

      <div className='flex-1 overflow-auto px-4 pb-40'>
        {renderFeatureContent()}
      </div>
    </div>
  );
};

export default FeaturePanel;
