import { useState, useRef } from 'react';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import {
  X,
  Upload,
  Download,
  Sparkles,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

export function AIRestoreImagePage() {
  const navigate = useNavigate();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [restoredImage, setRestoredImage] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [restorationType, setRestorationType] = useState<
    'auto' | 'colorize' | 'enhance'
  >('auto');
  const [intensityLevel, setIntensityLevel] = useState([80]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exampleImages = [
    'https://images.unsplash.com/photo-1758795116399-11d04fb9a5b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwb2xkJTIwcGhvdG8lMjByZXN0b3JhdGlvbnxlbnwxfHx8fDE3NjA5NjYwMDl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800',
    'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800',
    'https://images.unsplash.com/photo-1516981879613-9f5da904015f?w=800',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setRestoredImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRestore = () => {
    if (!uploadedImage) return;

    setIsRestoring(true);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 150);

    // Simulate restoration
    setTimeout(() => {
      clearInterval(interval);
      setRestoredImage(uploadedImage); // In real app, this would be the AI-restored version
      setIsRestoring(false);
    }, 3500);
  };

  const restorationTypes = [
    {
      id: 'auto',
      name: 'Auto Restore',
      description: 'AI-powered automatic restoration',
    },
    {
      id: 'colorize',
      name: 'Colorize',
      description: 'Add color to black & white photos',
    },
    {
      id: 'enhance',
      name: 'Enhance Quality',
      description: 'Sharpen and improve clarity',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-auto bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/30 font-['Mona_Sans',_sans-serif]">
      {/* Decorative gradient orbs */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-pink-200/20 to-purple-300/20 rounded-full blur-3xl'></div>
        <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-cyan-300/20 rounded-full blur-3xl'></div>
      </div>

      {/* Close Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/')}
        className='fixed top-6 left-6 z-30 w-11 h-11 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all border border-gray-200/50'
      >
        <X className='w-5 h-5 text-gray-700' />
      </motion.button>

      {/* Main Content */}
      <div className='relative z-20 max-w-[1400px] mx-auto px-6 py-20'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className='text-center mb-12'
        >
          <div className='inline-flex items-center gap-3 bg-white/70 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-gray-200/50 mb-6'>
            <Sparkles className='w-5 h-5 text-[#f63a9e]' />
            <span className='text-gray-700' style={{ fontWeight: '600' }}>
              AI Photo Restoration
            </span>
          </div>
          <h1
            className="text-gray-900 mb-4 font-['Bricolage_Grotesque',_sans-serif]"
            style={{ fontWeight: '800' }}
          >
            Restore Old Photos with AI
          </h1>
          <p className='text-gray-600 max-w-2xl mx-auto'>
            Bring your cherished memories back to life. Our AI technology
            repairs damage, adds color, and enhances quality.
          </p>
        </motion.div>

        {!uploadedImage ? (
          /* Upload Section */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Upload Area */}
            <div className='max-w-3xl mx-auto mb-12'>
              <div
                onClick={() => fileInputRef.current?.click()}
                className='relative bg-white/70 backdrop-blur-sm border-2 border-dashed border-gray-300 rounded-3xl p-16 text-center cursor-pointer hover:border-[#f63a9e]/50 hover:bg-[#FFF5FB]/30 transition-all group'
              >
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  onChange={handleFileChange}
                  className='hidden'
                />
                <div className='flex flex-col items-center gap-4'>
                  <div className='w-20 h-20 rounded-full bg-gradient-to-br from-[#f63a9e]/10 to-purple-100/50 flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <Upload className='w-10 h-10 text-[#f63a9e]' />
                  </div>
                  <div>
                    <p
                      className='text-gray-900 mb-2'
                      style={{ fontWeight: '700' }}
                    >
                      Upload Your Old Photo
                    </p>
                    <p className='text-gray-600 text-sm'>
                      Click to browse or drag and drop your image here
                    </p>
                  </div>
                  <Button
                    className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl h-[50px] px-8'
                    style={{ fontWeight: '700' }}
                  >
                    Choose File
                  </Button>
                </div>
              </div>
            </div>

            {/* Example Photos */}
            <div className='max-w-5xl mx-auto'>
              <p
                className='text-center text-gray-700 mb-6'
                style={{ fontWeight: '600' }}
              >
                Or try one of our examples
              </p>
              <div className='grid grid-cols-4 gap-6'>
                {exampleImages.map((img, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    onClick={() => setUploadedImage(img)}
                    className='aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-xl transition-all border-2 border-white/50 hover:border-[#f63a9e]/50'
                  >
                    <ImageWithFallback
                      src={img}
                      alt={`Example ${index + 1}`}
                      className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          /* Restoration Interface */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className='grid grid-cols-3 gap-8'
          >
            {/* Left - Settings Panel */}
            <div className='col-span-1 space-y-6'>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className='bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-200/50'
              >
                <h3
                  className='text-gray-900 mb-6'
                  style={{ fontWeight: '700' }}
                >
                  Restoration Type
                </h3>
                <RadioGroup
                  value={restorationType}
                  onValueChange={(value: any) => setRestorationType(value)}
                >
                  <div className='space-y-4'>
                    {restorationTypes.map(type => (
                      <div key={type.id} className='flex items-start space-x-3'>
                        <RadioGroupItem
                          value={type.id}
                          id={type.id}
                          className='mt-1'
                        />
                        <Label
                          htmlFor={type.id}
                          className='cursor-pointer flex-1'
                        >
                          <p
                            className='text-gray-900 mb-1'
                            style={{ fontWeight: '600' }}
                          >
                            {type.name}
                          </p>
                          <p className='text-gray-600 text-xs'>
                            {type.description}
                          </p>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                <div className='mt-8 pt-8 border-t border-gray-200'>
                  <div className='flex items-center justify-between mb-4'>
                    <Label
                      className='text-gray-900'
                      style={{ fontWeight: '600' }}
                    >
                      Intensity Level
                    </Label>
                    <span
                      className='text-[#f63a9e]'
                      style={{ fontWeight: '700' }}
                    >
                      {intensityLevel[0]}%
                    </span>
                  </div>
                  <Slider
                    value={intensityLevel}
                    onValueChange={setIntensityLevel}
                    max={100}
                    step={10}
                    className='mb-2'
                  />
                  <div className='flex justify-between text-xs text-gray-500'>
                    <span>Subtle</span>
                    <span>Strong</span>
                  </div>
                </div>

                <div className='mt-8 space-y-3'>
                  <Button
                    onClick={handleRestore}
                    disabled={isRestoring}
                    className='w-full bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl h-[50px]'
                    style={{ fontWeight: '700' }}
                  >
                    {isRestoring ? (
                      <>
                        <RefreshCw className='w-5 h-5 mr-2 animate-spin' />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <Sparkles className='w-5 h-5 mr-2' />
                        Restore Photo
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => {
                      setUploadedImage(null);
                      setRestoredImage(null);
                      setProgress(0);
                    }}
                    variant='outline'
                    className='w-full border-2 border-gray-200 hover:border-[#f63a9e]/50 rounded-xl h-[50px]'
                    style={{ fontWeight: '600' }}
                  >
                    <RotateCcw className='w-5 h-5 mr-2' />
                    Upload New Photo
                  </Button>
                </div>

                {isRestoring && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className='mt-6'
                  >
                    <Progress value={progress} className='h-2' />
                    <p className='text-center text-gray-600 text-sm mt-3'>
                      Processing your photo...
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Right - Before/After Comparison */}
            <div className='col-span-2 space-y-6'>
              {/* Before */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className='bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50'
              >
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-gray-900' style={{ fontWeight: '700' }}>
                    Original Photo
                  </h3>
                  <span className='text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full'>
                    Before
                  </span>
                </div>
                <div className='aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100'>
                  <ImageWithFallback
                    src={uploadedImage}
                    alt='Original'
                    className='w-full h-full object-contain'
                  />
                </div>
              </motion.div>

              {/* After */}
              <AnimatePresence>
                {restoredImage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className='bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border-2 border-[#f63a9e]/30'
                  >
                    <div className='flex items-center justify-between mb-4'>
                      <h3
                        className='text-gray-900'
                        style={{ fontWeight: '700' }}
                      >
                        Restored Photo
                      </h3>
                      <div className='flex items-center gap-3'>
                        <span
                          className='text-sm text-[#f63a9e] bg-[#FFF5FB] px-3 py-1 rounded-full'
                          style={{ fontWeight: '600' }}
                        >
                          After
                        </span>
                        <Button
                          className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl h-[40px] px-5'
                          style={{ fontWeight: '700' }}
                        >
                          <Download className='w-4 h-4 mr-2' />
                          Download
                        </Button>
                      </div>
                    </div>
                    <div className='aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100'>
                      <ImageWithFallback
                        src={restoredImage}
                        alt='Restored'
                        className='w-full h-full object-contain'
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
