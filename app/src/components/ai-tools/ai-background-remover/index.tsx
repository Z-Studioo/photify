import { useState, useRef, useEffect } from 'react';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import {
  X,
  Upload,
  Download,
  Sparkles,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { track } from '@/lib/analytics';

export function AIBackgroundRemoverPage() {
  const navigate = useNavigate();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [viewMode, setViewMode] = useState<'result' | 'comparison'>('result');
  const [isMounted, setIsMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fix hydration mismatch by deferring client-only animations
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const exampleImages = [
    'https://images.unsplash.com/photo-1727188211249-1e03a7da60a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHBob3RvZ3JhcGh5JTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3NjA5NjYwMTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
  ];

  const templateBackgrounds = [
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800',
    'https://images.unsplash.com/photo-1557683316-973673baf926?w=800',
    'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800',
    'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=800',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    'https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=800',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBackground = () => {
    if (!uploadedImage) return;

    const startedAt = Date.now();
    setIsProcessing(true);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate background removal
    setTimeout(() => {
      clearInterval(interval);
      setProcessedImage(uploadedImage); // In real app, this would be with transparent background
      setIsProcessing(false);
      try {
        track({
          name: 'ai_tool_used',
          params: {
            tool: 'background_remover',
            duration_ms: Date.now() - startedAt,
            success: true,
          },
        });
      } catch {
        /* swallow */
      }
    }, 2500);
  };

  return (
    <div className="min-h-screen relative overflow-auto bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/30 font-['Mona_Sans',_sans-serif]">
      {/* Decorative gradient orbs */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-pink-200/20 to-purple-300/20 rounded-full blur-3xl' />
        <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-cyan-300/20 rounded-full blur-3xl' />
      </div>

      {/* Background Grid with Template Images */}
      {isMounted && (
        <div className='fixed inset-0 overflow-hidden opacity-8'>
          <div className='grid grid-cols-6 gap-4 p-4 rotate-2 scale-110'>
            {[
              ...templateBackgrounds,
              ...templateBackgrounds,
              ...templateBackgrounds,
              ...templateBackgrounds,
            ].map((img, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: (index % 6) * 0.03 }}
                className='aspect-square rounded-lg overflow-hidden shadow-lg'
              >
                <ImageWithFallback
                  src={img}
                  alt='Background'
                  className='w-full h-full object-cover'
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

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
              AI Background Remover
            </span>
          </div>
          <h1
            className="text-gray-900 mb-4 font-['Bricolage_Grotesque',_sans-serif]"
            style={{ fontWeight: '800' }}
          >
            Remove Backgrounds Instantly
          </h1>
          <p className='text-gray-600 max-w-2xl mx-auto'>
            Remove image backgrounds with AI precision in seconds. Perfect for
            product photos, portraits, and more.
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
                      Upload Your Image
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
          /* Processing Interface */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className='max-w-6xl mx-auto'
          >
            <div className='grid grid-cols-12 gap-8'>
              {/* Main Preview Area */}
              <div className='col-span-9'>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className='bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-200/50'
                >
                  {/* Tabs for View Mode */}
                  {processedImage && (
                    <Tabs
                      value={viewMode}
                      onValueChange={(value: any) => setViewMode(value)}
                      className='mb-6'
                    >
                      <TabsList className='grid w-full max-w-md mx-auto grid-cols-2 h-[50px]'>
                        <TabsTrigger value='result' className='h-[46px]'>
                          Result Only
                        </TabsTrigger>
                        <TabsTrigger value='comparison' className='h-[46px]'>
                          Before & After
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}

                  {/* Image Display */}
                  <AnimatePresence mode='wait'>
                    {!processedImage ? (
                      /* Original Image */
                      <motion.div
                        key='original'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className='aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-4'>
                          <ImageWithFallback
                            src={uploadedImage}
                            alt='Original'
                            className='w-full h-full object-contain'
                          />
                        </div>
                        {isProcessing && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className='space-y-3'
                          >
                            <Progress value={progress} className='h-3' />
                            <div className='flex items-center justify-center gap-3 text-gray-600'>
                              <Loader2 className='w-5 h-5 animate-spin text-[#f63a9e]' />
                              <p style={{ fontWeight: '600' }}>
                                Removing background... {progress}%
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ) : viewMode === 'result' ? (
                      /* Result Only */
                      <motion.div
                        key='result'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className='aspect-[4/3] rounded-2xl overflow-hidden relative'
                        style={{
                          background:
                            'repeating-conic-gradient(#e5e7eb 0% 25%, #f3f4f6 0% 50%) 50% / 20px 20px',
                        }}
                      >
                        <ImageWithFallback
                          src={processedImage}
                          alt='Processed'
                          className='w-full h-full object-contain'
                        />
                        <div
                          className='absolute top-4 right-4 bg-[#f63a9e] text-white px-3 py-1 rounded-full text-sm'
                          style={{ fontWeight: '600' }}
                        >
                          Background Removed
                        </div>
                      </motion.div>
                    ) : (
                      /* Before & After Comparison */
                      <motion.div
                        key='comparison'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className='grid grid-cols-2 gap-4'
                      >
                        <div>
                          <div className='flex items-center gap-2 mb-3'>
                            <span
                              className='text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full'
                              style={{ fontWeight: '600' }}
                            >
                              Before
                            </span>
                          </div>
                          <div className='aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100'>
                            <ImageWithFallback
                              src={uploadedImage}
                              alt='Before'
                              className='w-full h-full object-contain'
                            />
                          </div>
                        </div>
                        <div>
                          <div className='flex items-center gap-2 mb-3'>
                            <span
                              className='text-sm text-[#f63a9e] bg-[#FFF5FB] px-3 py-1 rounded-full'
                              style={{ fontWeight: '600' }}
                            >
                              After
                            </span>
                          </div>
                          <div
                            className='aspect-[4/3] rounded-2xl overflow-hidden'
                            style={{
                              background:
                                'repeating-conic-gradient(#e5e7eb 0% 25%, #f3f4f6 0% 50%) 50% / 20px 20px',
                            }}
                          >
                            <ImageWithFallback
                              src={processedImage}
                              alt='After'
                              className='w-full h-full object-contain'
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Side Panel - Actions */}
              <div className='col-span-3'>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className='bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50 sticky top-6'
                >
                  <h3
                    className='text-gray-900 mb-6'
                    style={{ fontWeight: '700' }}
                  >
                    Actions
                  </h3>

                  <div className='space-y-3'>
                    {!processedImage ? (
                      <Button
                        onClick={handleRemoveBackground}
                        disabled={isProcessing}
                        className='w-full bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl h-[50px]'
                        style={{ fontWeight: '700' }}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Sparkles className='w-5 h-5 mr-2' />
                            Remove Background
                          </>
                        )}
                      </Button>
                    ) : (
                      <>
                        <Button
                          className='w-full bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl h-[50px]'
                          style={{ fontWeight: '700' }}
                        >
                          <Download className='w-5 h-5 mr-2' />
                          Download PNG
                        </Button>
                        <Button
                          variant='outline'
                          className='w-full border-2 border-gray-200 hover:border-[#f63a9e]/50 rounded-xl h-[50px]'
                          style={{ fontWeight: '600' }}
                        >
                          <Download className='w-5 h-5 mr-2' />
                          Download JPG
                        </Button>
                      </>
                    )}

                    <div className='pt-4 border-t border-gray-200'>
                      <Button
                        onClick={() => {
                          setUploadedImage(null);
                          setProcessedImage(null);
                          setProgress(0);
                        }}
                        variant='ghost'
                        className='w-full hover:bg-gray-100 rounded-xl h-[50px]'
                        style={{ fontWeight: '600' }}
                      >
                        <RotateCcw className='w-5 h-5 mr-2' />
                        Upload New Image
                      </Button>
                    </div>
                  </div>

                  {processedImage && (
                    <div className='mt-8 p-4 bg-green-50 rounded-2xl border border-green-200'>
                      <div className='flex items-start gap-3'>
                        <div className='w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0'>
                          <Sparkles className='w-4 h-4 text-green-600' />
                        </div>
                        <div>
                          <p
                            className='text-green-900 text-sm mb-1'
                            style={{ fontWeight: '600' }}
                          >
                            Background Removed!
                          </p>
                          <p className='text-green-700 text-xs'>
                            Your image is ready to download with transparent
                            background.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
