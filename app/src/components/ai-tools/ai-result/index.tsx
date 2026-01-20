import { useState } from 'react';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import { X, RotateCcw, Check, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function AIResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prompt = searchParams.get('prompt');
  const layout = searchParams.get('layout');

  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  // Template images for generated results
  const generatedImages = [
    'https://images.unsplash.com/photo-1741298166997-665f850b8f28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNpZ24lMjB0ZW1wbGF0ZSUyMGNvbG9yZnVsfGVufDF8fHx8MTc2MDg3MzU0MHww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1699568542323-ff98aca8ea6a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGFydCUyMGNvbG9yZnVsfGVufDF8fHx8MTc2MDgxNDcyNHww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1756459007612-6b5a921ca894?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcnQlMjBwb3N0ZXJ8ZW58MXx8fHwxNzYwODczNTQwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1759265686020-0e69c0f2bc9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFwaGljJTIwZGVzaWduJTIwcGF0dGVybnxlbnwxfHx8fDE3NjA4MDM2NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  ];

  const handleStartOver = () => {
    navigate('/ai-generate');
  };

  const handleNext = () => {
    if (selectedImage === null) return;
    const params = new URLSearchParams();
    if (prompt) params.set('prompt', prompt);
    if (layout) params.set('layout', layout);
    params.set('image', selectedImage.toString());
    navigate(`/ai-print-size?${params.toString()}`);
  };

  return (
    <div className="min-h-screen relative overflow-y-auto bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/30 font-['Mona_Sans',_sans-serif]">
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
        onClick={() => navigate(-1)}
        className='fixed top-6 left-6 z-30 w-11 h-11 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all border border-gray-200/50'
      >
        <X className='w-5 h-5 text-gray-700' />
      </motion.button>

      {/* Main Content */}
      <div className='relative z-20 flex flex-col items-center px-6 py-16'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className='text-center mb-6'
        >
          <h1
            className="font-['Bricolage_Grotesque',_sans-serif] bg-gradient-to-r from-[#f63a9e] to-purple-600 bg-clip-text text-transparent mb-2"
            style={{ fontSize: '40px', lineHeight: '1.1', fontWeight: '700' }}
          >
            Choose Your Favorite ✨
          </h1>
          <p className='text-gray-600 max-w-xl mx-auto'>
            We've generated 4 unique variations. Select the one you love most.
          </p>
        </motion.div>

        {/* Prompt Display */}
        {prompt && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-3 mb-6 max-w-2xl'
          >
            <p className='text-sm text-gray-600'>
              <strong className='text-gray-900'>Your prompt:</strong> {prompt}
            </p>
          </motion.div>
        )}

        {/* Grid of Generated Images */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className='grid grid-cols-4 gap-3 mb-6 max-w-5xl w-full'
        >
          {generatedImages.map((img, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className='relative'
            >
              <button
                onClick={() => setSelectedImage(index)}
                className={`relative w-full aspect-[3/4] rounded-xl overflow-hidden border-3 transition-all ${
                  selectedImage === index
                    ? 'border-[#f63a9e] shadow-2xl shadow-[#f63a9e]/30'
                    : 'border-white/50 hover:border-[#f63a9e]/50 shadow-xl'
                }`}
              >
                <ImageWithFallback
                  src={img}
                  alt={`Generated artwork ${index + 1}`}
                  className='w-full h-full object-cover'
                />

                {/* Overlay on hover */}
                <div
                  className={`absolute inset-0 bg-black/0 hover:bg-black/10 transition-all ${
                    selectedImage === index ? 'bg-[#f63a9e]/10' : ''
                  }`}
                />

                {/* Selected Check Mark */}
                {selectedImage === index && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className='absolute top-2 right-2 w-8 h-8 bg-[#f63a9e] rounded-full flex items-center justify-center shadow-lg'
                  >
                    <Check className='w-4 h-4 text-white' />
                  </motion.div>
                )}

                {/* Option Number */}
                <div className='absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs'>
                  Option {index + 1}
                </div>
              </button>
            </motion.div>
          ))}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className='flex gap-3 max-w-5xl w-full mb-8'
        >
          <Button
            onClick={handleStartOver}
            variant='outline'
            className='flex-1 border-2'
            style={{ height: '50px' }}
          >
            <RotateCcw className='w-5 h-5 mr-2' />
            Start Over
          </Button>

          <Button
            onClick={handleNext}
            disabled={selectedImage === null}
            className='flex-1 bg-gradient-to-r from-[#f63a9e] to-purple-600 hover:from-[#e02d8d] hover:to-purple-700 text-white disabled:from-gray-300 disabled:to-gray-400'
            style={{ height: '50px' }}
          >
            Next
            <ArrowRight className='w-5 h-5 ml-2' />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
