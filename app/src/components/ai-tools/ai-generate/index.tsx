import { useState } from 'react';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import { X, Sparkles, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AILoader } from './ai-loader';

export function AIGenerationPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [selectedLayout, setSelectedLayout] = useState<
    'portrait' | 'landscape' | 'square' | null
  >(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress] = useState(0);

  const layouts = [
    {
      id: 'portrait' as const,
      name: 'Portrait',
      ratio: '3:4',
      width: 56,
      height: 75,
    },
    {
      id: 'square' as const,
      name: 'Square',
      ratio: '1:1',
      width: 75,
      height: 75,
    },
    {
      id: 'landscape' as const,
      name: 'Landscape',
      ratio: '4:3',
      width: 90,
      height: 68,
    },
  ];

  const examplePrompts = [
    'Mountain sunset landscape',
    'Abstract geometric art',
    'Peaceful meditation scene',
  ];

  // Template images for Canva-style background grid
  const templateImages = [
    'https://images.unsplash.com/photo-1741298166997-665f850b8f28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNpZ24lMjB0ZW1wbGF0ZSUyMGNvbG9yZnVsfGVufDF8fHx8MTc2MDg3MzU0MHww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1699568542323-ff98aca8ea6a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGFydCUyMGNvbG9yZnVsfGVufDF8fHx8MTc2MDgxNDcyNHww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1756459007612-6b5a921ca894?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcnQlMjBwb3N0ZXJ8ZW58MXx8fHwxNzYwODczNTQwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1759265686020-0e69c0f2bc9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFwaGljJTIwZGVzaWduJTIwcGF0dGVybnxlbnwxfHx8fDE3NjA4MDM2NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1613759007428-9d918fe2d36f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwcG9zdGVyJTIwYXJ0fGVufDF8fHx8MTc2MDg3MzU0MXww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1760691836344-0d7025b8ee1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb250ZW1wb3JhcnklMjB3YWxsJTIwYXJ0fGVufDF8fHx8MTc2MDg3MzU0MXww&ixlib=rb-4.1.0&q=80&w=1080',
  ];

  const handleGenerate = () => {
    if (!prompt.trim() || !selectedLayout) return;

    setIsGenerating(true);

    // Simulate AI generation time (15 seconds)
    setTimeout(() => {
      setIsGenerating(false);

      // Navigate to results page
      // Note: Pass data via URL params or global state instead
      navigate(
        `/ai-results?prompt=${encodeURIComponent(prompt)}&layout=${encodeURIComponent(layouts.find(l => l.id === selectedLayout)?.name || 'Portrait')}`
      );
    }, 15000);
  };

  return (
    <>
      {/* AI Loading Screen */}
      {isGenerating && <AILoader />}

      <div className="h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/30 font-['Mona_Sans',_sans-serif] flex items-center justify-center">
        {/* Canva-style Background Grid with Template Thumbnails */}
        <div className='absolute inset-0 overflow-hidden opacity-8'>
          <div className='grid grid-cols-8 gap-4 p-4 -rotate-6 scale-110'>
            {[
              ...templateImages,
              ...templateImages,
              ...templateImages,
              ...templateImages,
              ...templateImages,
            ].map((img, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: (index % 8) * 0.03 }}
                className='aspect-[3/4] rounded-lg overflow-hidden shadow-xl'
              >
                <ImageWithFallback
                  src={img}
                  alt='Template'
                  className='w-full h-full object-cover'
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Decorative gradient orbs */}
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
          <div className='absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-pink-200/20 to-purple-300/20 rounded-full blur-3xl'/>
          <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-cyan-300/20 rounded-full blur-3xl'/>
        </div>

        {/* Close Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className='absolute top-6 left-6 z-30 w-11 h-11 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all border border-gray-200/50'
        >
          <X className='w-5 h-5 text-gray-700' />
        </motion.button>

        {/* Left Wavy Border */}
        <svg
          className='absolute left-0 top-0 h-full w-16 z-10 opacity-25'
          viewBox='0 0 100 800'
          preserveAspectRatio='none'
        >
          <path
            d='M 0,0 Q 40,100 25,200 T 35,400 Q 50,500 30,600 T 25,800 L 0,800 Z'
            fill='white'
          />
        </svg>

        {/* Right Wavy Border */}
        <svg
          className='absolute right-0 top-0 h-full w-16 z-10 opacity-25'
          viewBox='0 0 100 800'
          preserveAspectRatio='none'
        >
          <path
            d='M 100,0 Q 60,100 75,200 T 65,400 Q 50,500 70,600 T 75,800 L 100,800 Z'
            fill='white'
          />
        </svg>

        {/* Main Content - Vertical Centered Layout */}
        <div className='relative z-20 w-full max-w-3xl px-6'>
          {/* Title Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='text-center mb-8'
          >
            <div className='inline-flex items-center justify-center gap-3 mb-3'>
              <Wand2 className='w-10 h-10 text-[#f63a9e]' />
            </div>
            <h1
              className="font-['Bricolage_Grotesque',_sans-serif] bg-gradient-to-r from-[#f63a9e] to-purple-600 bg-clip-text text-transparent mb-2"
              style={{ fontSize: '44px', lineHeight: '1.1', fontWeight: '700' }}
            >
              Create Whatever You Imagine
            </h1>
            <p
              className='text-gray-600 max-w-xl mx-auto'
              style={{ fontSize: '15px' }}
            >
              Transform your ideas into stunning artwork with AI in seconds
            </p>
          </motion.div>

          {/* Glassmorphic Form Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className='bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50'
          >
            {/* Describe Section */}
            <div className='mb-6'>
              <label
                htmlFor='describe-input'
                className="block mb-2 font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                style={{ fontSize: '18px', fontWeight: '600' }}
              >
                Describe Your Vision
              </label>
              <Textarea
                id='describe-input'
                placeholder='e.g., A serene mountain landscape at sunset with vibrant orange skies...'
                value={prompt}
                onChange={e => setPrompt(e.target.value.slice(0, 500))}
                className='min-h-[100px] resize-none border-2 border-gray-200 focus:border-[#f63a9e] text-gray-900 rounded-xl transition-all text-sm'
              />
              <div className='flex items-center justify-between mt-2'>
                <div className='flex flex-wrap gap-1.5'>
                  {examplePrompts.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(example)}
                      className='px-2.5 py-1 bg-gray-100 hover:bg-[#f63a9e]/10 hover:border-[#f63a9e] border border-gray-200 rounded-full text-xs text-gray-700 hover:text-[#f63a9e] transition-all'
                    >
                      {example}
                    </button>
                  ))}
                </div>
                <span className='text-xs text-gray-500 ml-2'>
                  {prompt.length}/500
                </span>
              </div>
            </div>

            {/* Layout Section */}
            <div className='mb-6'>
              <label
                className="block mb-3 font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                style={{ fontSize: '18px', fontWeight: '600' }}
              >
                Choose Layout
              </label>
              <div className='flex gap-5 items-start justify-center'>
                {layouts.map(layout => (
                  <div
                    key={layout.id}
                    className='flex flex-col items-center gap-2'
                  >
                    <motion.button
                      onClick={() => setSelectedLayout(layout.id)}
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative rounded-xl border-3 transition-all ${
                        selectedLayout === layout.id
                          ? 'border-[#f63a9e] bg-gradient-to-br from-[#f63a9e]/10 to-purple-500/10 shadow-xl shadow-[#f63a9e]/20'
                          : 'border-gray-300 bg-white hover:border-[#f63a9e]/50 hover:shadow-lg'
                      }`}
                      style={{
                        width: `${layout.width}px`,
                        height: `${layout.height}px`,
                        borderWidth: '3px',
                      }}
                    >
                      {selectedLayout === layout.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className='absolute inset-0 flex items-center justify-center'
                        >
                          <div className='w-8 h-8 bg-[#f63a9e] rounded-full flex items-center justify-center shadow-lg'>
                            <Sparkles className='w-4 h-4 text-white' />
                          </div>
                        </motion.div>
                      )}
                    </motion.button>
                    <span
                      className={`text-xs transition-colors ${
                        selectedLayout === layout.id
                          ? 'text-[#f63a9e]'
                          : 'text-gray-700'
                      }`}
                      style={{
                        fontWeight:
                          selectedLayout === layout.id ? '600' : '400',
                      }}
                    >
                      {layout.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className='flex flex-col items-center gap-3 pt-2'>
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || !selectedLayout || isGenerating}
                className='w-full bg-gradient-to-r from-[#f63a9e] to-purple-600 hover:from-[#e02d8d] hover:to-purple-700 text-white disabled:from-gray-300 disabled:to-gray-400 shadow-xl hover:shadow-2xl transition-all'
                style={{ height: '50px', fontSize: '17px', fontWeight: '600' }}
              >
                <Wand2 className='w-5 h-5 mr-2' />
                Generate Artwork
              </Button>

              {/* Progress Bar - Removed as we're using full page loader */}
              {false && isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='w-full'
                >
                  <Progress value={progress} className='h-1.5' />
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Footer Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className='text-center mt-4 flex items-center justify-center gap-2 text-gray-500 text-sm'
          >
            <Sparkles className='w-4 h-4' />
            <span>Powered by AI</span>
          </motion.div>
        </div>
      </div>
    </>
  );
}
