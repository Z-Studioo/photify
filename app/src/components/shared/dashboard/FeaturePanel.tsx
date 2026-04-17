import { ChevronLeft } from 'lucide-react';
import { useFeature } from '@/context/dashboard/FeatureContext';
import SelectPhoto from '@/components/shared/dashboard/SelectPhoto';
import RatioSizePanel from '@/components/shared/dashboard/RatioSizePanel';
import EdgeSelector from './EdgeSelector';
import { useView } from '@/context/ViewContext';
import OptimizationControl from './OptimizationControl';
import { useEdge } from '@/context/EdgeContext';
import { useUpload } from '@/context/UploadContext';

/** Readable titles for the slide-over header (constants use ALL CAPS). */
const FEATURE_PANEL_TITLE: Record<string, string> = {
  'SELECT PHOTO': 'Photo and crop',
  'IMAGE SIZE AND CROP PHOTO': 'Canvas size',
  'SIDE APPEARANCE': 'Side appearance',
  'IMAGE OPTIMIZATION': 'Image optimization',
  'ROUND FORMATS AND SHAPES': 'Round formats & shapes',
  CORNERS: 'Corners',
  MULTIPANEL: 'Multipanel',
};

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
      } bg-zinc-50/95 flex flex-col h-full border-r border-zinc-100`}
    >
      <div className='grid grid-cols-[3rem_1fr_3rem] items-center gap-2 px-3 py-3.5 flex-shrink-0 border-b border-zinc-100/90 bg-white/80 backdrop-blur-sm'>
        <button
          type='button'
          onClick={handleGoBack}
          className='group flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-zinc-200/90 bg-white text-zinc-700 shadow-sm transition hover:border-primary/45 hover:bg-primary/[0.08] hover:text-primary hover:shadow-md active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2'
          aria-label='Back'
        >
          <ChevronLeft
            className='h-7 w-7 transition-transform group-hover:-translate-x-0.5'
            strokeWidth={2.25}
          />
        </button>
        <h3 className='min-w-0 text-center font-semibold text-[15px] leading-snug tracking-tight text-zinc-900 truncate px-1'>
          {FEATURE_PANEL_TITLE[selectedFeature.name] ?? selectedFeature.name}
        </h3>
        <span className='w-12 shrink-0' aria-hidden />
      </div>

      <div className='flex-1 overflow-auto px-4 pb-4'>
        {renderFeatureContent()}
      </div>
    </div>
  );
};

export default FeaturePanel;
