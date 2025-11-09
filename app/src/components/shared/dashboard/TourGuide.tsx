import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TourStep {
  id: string;
  title: string;
  description: string;
}

interface TourGuideProps {
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
}

const TOUR_STORAGE_KEY = 'dashboard-tour-completed';
const TOUR_SHOW_DELAY = 1000;

const TourGuide: React.FC<TourGuideProps> = ({ steps, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!tourCompleted && steps.length > 0) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, TOUR_SHOW_DELAY);
      return () => clearTimeout(timer);
    }
  }, [steps.length]);

  const closeTour = () => {
    setIsVisible(false);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      closeTour();
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    closeTour();
    onSkip?.();
  };

  if (!isVisible || steps.length === 0) return null;

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
        className='fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]'
      >
        <div className='bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden'>
          {/* Progress bar */}
          <div className='h-1 bg-gray-100 relative overflow-hidden'>
            <motion.div
              className='absolute inset-y-0 left-0 bg-primary'
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Content */}
          <div className='p-6'>
            {/* Header */}
            <div className='flex items-start justify-between mb-4'>
              <div className='flex-1'>
                <div className='flex items-center gap-2 mb-1'>
                  <span className='text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full'>
                    Step {currentStep + 1} of {steps.length}
                  </span>
                </div>
                <h3 className='text-lg font-bold text-gray-900'>
                  {currentStepData.title}
                </h3>
              </div>
              <button
                onClick={handleSkip}
                className='text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded'
                aria-label='Close tour'
                type='button'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            {/* Description */}
            <p className='text-gray-600 text-sm leading-relaxed mb-6'>
              {currentStepData.description}
            </p>

            {/* Navigation */}
            <div className='flex items-center justify-between gap-3'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleSkip}
                className='text-gray-600 hover:text-gray-900'
              >
                Skip Tour
              </Button>

              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handlePrevious}
                  disabled={isFirstStep}
                  className='disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <ChevronLeft className='h-4 w-4 mr-1' />
                  Previous
                </Button>
                <Button
                  variant='default'
                  size='sm'
                  onClick={handleNext}
                  className='bg-primary hover:bg-primary/90'
                >
                  {isLastStep ? (
                    'Finish'
                  ) : (
                    <>
                      Next
                      <ChevronRight className='h-4 w-4 ml-1' />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Step indicators */}
          <div className='flex items-center justify-center gap-1.5 px-6 pb-4'>
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    isActive
                      ? 'w-8 bg-primary'
                      : isCompleted
                        ? 'w-1.5 bg-primary/50'
                        : 'w-1.5 bg-gray-300'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                  type='button'
                />
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TourGuide;
