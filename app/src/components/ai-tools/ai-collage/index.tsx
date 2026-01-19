import { useState, useRef } from 'react';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import {
  X,
  Upload,
  Download,
  Grid3x3,
  LayoutGrid,
  Sparkles,
  Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

type CollageLayout =
  | 'grid-2x2'
  | 'grid-3x3'
  | 'pinterest'
  | 'mosaic'
  | 'horizontal'
  | 'vertical';

export function AICollageMakerPage() {
  const navigate = useNavigate();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedLayout, setSelectedLayout] =
    useState<CollageLayout>('grid-2x2');
  const [generatedCollage, setGeneratedCollage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const layouts = [
    {
      id: 'grid-2x2',
      name: '2×2 Grid',
      description: '4 photos in a square grid',
      icon: Grid3x3,
      minPhotos: 4,
    },
    {
      id: 'grid-3x3',
      name: '3×3 Grid',
      description: '9 photos in a square grid',
      icon: LayoutGrid,
      minPhotos: 9,
    },
    {
      id: 'pinterest',
      name: 'Pinterest Style',
      description: 'Masonry layout with varying sizes',
      icon: LayoutGrid,
      minPhotos: 5,
    },
    {
      id: 'mosaic',
      name: 'Mosaic',
      description: 'Creative mixed sizes layout',
      icon: Grid3x3,
      minPhotos: 6,
    },
    {
      id: 'horizontal',
      name: 'Horizontal Strip',
      description: 'Photos in a horizontal row',
      icon: LayoutGrid,
      minPhotos: 3,
    },
    {
      id: 'vertical',
      name: 'Vertical Strip',
      description: 'Photos in a vertical column',
      icon: Grid3x3,
      minPhotos: 3,
    },
  ];

  const templateCollages = [
    'https://images.unsplash.com/photo-1594383169997-250ec3fdd48d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90byUyMGNvbGxhZ2UlMjBsYXlvdXR8ZW58MXx8fHwxNzYwOTY2MDEwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800',
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800',
    'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=800',
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800',
    'https://images.unsplash.com/photo-1542435503-956c469947f6?w=800',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const readers = files.map(file => {
      return new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(images => {
      setUploadedImages(prev => [...prev, ...images]);
    });
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateCollage = () => {
    // Simulate collage generation
    setGeneratedCollage(uploadedImages[0] || templateCollages[0]);
  };

  const currentLayout = layouts.find(l => l.id === selectedLayout);
  const canCreateCollage =
    uploadedImages.length >= (currentLayout?.minPhotos || 0);

  return (
    <div className="min-h-screen relative overflow-auto bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/30 font-['Mona_Sans',_sans-serif]">
      {/* Decorative gradient orbs */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-pink-200/20 to-purple-300/20 rounded-full blur-3xl' />
        <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-cyan-300/20 rounded-full blur-3xl' />
      </div>

      {/* Background Grid with Template Collages */}
      <div className='fixed inset-0 overflow-hidden opacity-8'>
        <div className='grid grid-cols-6 gap-4 p-4 -rotate-3 scale-110'>
          {[
            ...templateCollages,
            ...templateCollages,
            ...templateCollages,
            ...templateCollages,
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
                alt='Template'
                className='w-full h-full object-cover'
              />
            </motion.div>
          ))}
        </div>
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
            <LayoutGrid className='w-5 h-5 text-[#f63a9e]' />
            <span className='text-gray-700' style={{ fontWeight: '600' }}>
              AI Collage Maker
            </span>
          </div>
          <h1
            className="text-gray-900 mb-4 font-['Bricolage_Grotesque',_sans-serif]"
            style={{ fontWeight: '800' }}
          >
            Create Beautiful Photo Collages
          </h1>
          <p className='text-gray-600 max-w-2xl mx-auto'>
            Combine multiple photos into stunning collages with AI-powered
            layouts and automatic arrangement.
          </p>
        </motion.div>

        <div className='grid grid-cols-3 gap-8'>
          {/* Left Column - Upload & Photos */}
          <div className='col-span-1 space-y-6'>
            {/* Upload Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                multiple
                onChange={handleFileChange}
                className='hidden'
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className='bg-white/70 backdrop-blur-sm border-2 border-dashed border-gray-300 rounded-3xl p-8 text-center cursor-pointer hover:border-[#f63a9e]/50 hover:bg-[#FFF5FB]/30 transition-all group'
              >
                <div className='flex flex-col items-center gap-4'>
                  <div className='w-16 h-16 rounded-full bg-gradient-to-br from-[#f63a9e]/10 to-purple-100/50 flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <Upload className='w-8 h-8 text-[#f63a9e]' />
                  </div>
                  <div>
                    <p
                      className='text-gray-900 mb-2'
                      style={{ fontWeight: '700' }}
                    >
                      Upload Photos
                    </p>
                    <p className='text-gray-600 text-sm'>
                      Click to add multiple images
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Uploaded Images Grid */}
            {uploadedImages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50'
              >
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-gray-900' style={{ fontWeight: '700' }}>
                    Your Photos ({uploadedImages.length})
                  </h3>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant='ghost'
                    size='sm'
                    className='h-8 text-[#f63a9e] hover:bg-[#FFF5FB]'
                  >
                    <Plus className='w-4 h-4 mr-1' />
                    Add More
                  </Button>
                </div>
                <div className='grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto'>
                  {uploadedImages.map((img, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className='relative aspect-square rounded-xl overflow-hidden group'
                    >
                      <ImageWithFallback
                        src={img}
                        alt={`Photo ${index + 1}`}
                        className='w-full h-full object-cover'
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className='absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Middle Column - Layout Selection */}
          <div className='col-span-1'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className='bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-200/50 sticky top-6'
            >
              <h3 className='text-gray-900 mb-6' style={{ fontWeight: '700' }}>
                Choose Layout
              </h3>
              <RadioGroup
                value={selectedLayout}
                onValueChange={(value: any) => setSelectedLayout(value)}
              >
                <div className='space-y-4'>
                  {layouts.map(layout => (
                    <div
                      key={layout.id}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        selectedLayout === layout.id
                          ? 'border-[#f63a9e] bg-[#FFF5FB]/50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() =>
                        setSelectedLayout(layout.id as CollageLayout)
                      }
                    >
                      <div className='flex items-start gap-3'>
                        <RadioGroupItem
                          value={layout.id}
                          id={layout.id}
                          className='mt-1'
                        />
                        <div className='flex-1'>
                          <Label htmlFor={layout.id} className='cursor-pointer'>
                            <div className='flex items-center gap-2 mb-1'>
                              <layout.icon className='w-4 h-4 text-[#f63a9e]' />
                              <p
                                className='text-gray-900'
                                style={{ fontWeight: '600' }}
                              >
                                {layout.name}
                              </p>
                            </div>
                            <p className='text-gray-600 text-xs mb-2'>
                              {layout.description}
                            </p>
                            <p className='text-gray-500 text-xs'>
                              Requires {layout.minPhotos}+ photos
                            </p>
                          </Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              <div className='mt-8 space-y-3'>
                <Button
                  onClick={handleCreateCollage}
                  disabled={!canCreateCollage}
                  className='w-full bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl h-[50px] disabled:opacity-50 disabled:cursor-not-allowed'
                  style={{ fontWeight: '700' }}
                >
                  <Sparkles className='w-5 h-5 mr-2' />
                  Create Collage
                </Button>
                {!canCreateCollage && (
                  <p className='text-center text-sm text-gray-500'>
                    Add{' '}
                    {(currentLayout?.minPhotos || 0) - uploadedImages.length}{' '}
                    more photo
                    {(currentLayout?.minPhotos || 0) - uploadedImages.length > 1
                      ? 's'
                      : ''}
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Preview */}
          <div className='col-span-1'>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className='bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50 sticky top-6'
            >
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-gray-900' style={{ fontWeight: '700' }}>
                  Preview
                </h3>
                {generatedCollage && (
                  <Button
                    className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl h-[40px] px-5'
                    style={{ fontWeight: '700' }}
                  >
                    <Download className='w-4 h-4 mr-2' />
                    Download
                  </Button>
                )}
              </div>

              <AnimatePresence mode='wait'>
                {generatedCollage ? (
                  <motion.div
                    key='collage'
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className='aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-lg'
                  >
                    <ImageWithFallback
                      src={generatedCollage}
                      alt='Generated Collage'
                      className='w-full h-full object-cover'
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key='placeholder'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='aspect-square rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300'
                  >
                    <div className='text-center p-8'>
                      <LayoutGrid className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                      <p
                        className='text-gray-600'
                        style={{ fontWeight: '600' }}
                      >
                        Your collage will appear here
                      </p>
                      <p className='text-gray-500 text-sm mt-2'>
                        Upload photos and select a layout to get started
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
