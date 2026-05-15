import { useNavigate, useSearchParams } from 'react-router';
import { useUpload } from '@/context/UploadContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  ImagePlus,
  UploadCloud,
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { toast } from 'sonner';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/header';
import { ClientOnly } from '@/components/shared/client-only';
import { cn } from '@/lib/utils';
import { buildMeta } from '@/lib/seo';
import { track } from '@/lib/analytics';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Upload Your Photo | Photify',
    description: 'Upload a photo to start designing your custom print on Photify.',
    path: '/upload',
    noindex: true,
  });

const UploadPageInner = () => {
  const MAX_FILE_SIZE_MB = 20;
  const {
    file: _file,
    setFile,
    preview,
    setPreview,
    setSelectedProduct,
  } = useUpload();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [searchParams] = useSearchParams();
  const supabase = createClient();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      const errorMessage = 'Please upload a valid image file';
      setUploadError(errorMessage);
      toast.error(errorMessage);
      try {
        track({
          name: 'image_upload_failed',
          params: { reason: 'invalid_type' },
        });
      } catch {
        /* swallow */
      }
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      const errorMessage = `Image is too large. Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`;
      setUploadError(errorMessage);
      toast.error(errorMessage);
      try {
        track({
          name: 'image_upload_failed',
          params: { reason: 'too_large' },
        });
      } catch {
        /* swallow */
      }
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    const newPreview = URL.createObjectURL(file);
    setFile(file);
    setPreview(newPreview);
    setUploadError(null);

    // GA4 image_upload — fires after validation passes. Measuring the
    // image dimensions requires loading it into an Image element; do
    // that asynchronously so the upload UX isn't blocked.
    try {
      const sizeMb = Math.round((file.size / (1024 * 1024)) * 10) / 10;
      const img = new Image();
      img.onload = () => {
        try {
          track({
            name: 'image_upload',
            params: {
              source: 'device',
              mb: sizeMb,
              width: img.naturalWidth,
              height: img.naturalHeight,
            },
          });
        } catch {
          /* swallow */
        }
      };
      img.onerror = () => {
        try {
          track({
            name: 'image_upload',
            params: { source: 'device', mb: sizeMb },
          });
        } catch {
          /* swallow */
        }
      };
      img.src = newPreview;
    } catch {
      /* swallow */
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processFile(selectedFile);
  };

  const handleContinue = () => {
    if (_file && preview) {
      navigate('/canvas-configurer');
    }
  };

  const resetUpload = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setUploadError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const navigate = useNavigate();

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    processFile(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  useEffect(() => {
    resetUpload();
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      const productId = searchParams.get('productId');
      if (!productId) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
      } else {
        setSelectedProduct(data);
      }
    };

    fetchProduct();
  }, [searchParams, supabase, setSelectedProduct]);

  return (
    <div className='h-dvh flex flex-col overflow-hidden'>
      <Header />
      <motion.div
        className='w-full flex-1 min-h-0 flex flex-col items-center justify-center font-[var(--font-heading)] px-4 py-4 md:py-6 m-0 overflow-hidden'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        <motion.h1
          className='text-2xl md:text-3xl font-bold mb-4 md:mb-5'
          variants={itemVariants}
        >
          Upload your photo
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className='text-sm md:text-base text-[var(--muted-foreground)] mb-4 md:mb-5 text-center max-w-xl'
        >
          Start by adding one high-quality image. You can drag and drop it or
          browse your files.
        </motion.p>

        <motion.div variants={itemVariants} className='w-full max-w-[744px]'>
          <Card className='w-full mx-auto flex flex-col items-center border border-border/60 bg-background/60 backdrop-blur-sm p-4 md:p-6 rounded-2xl shadow-sm'>
            <AnimatePresence mode='wait'>
              {!preview ? (
                <motion.div
                  key='upload'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className='w-full'
                >
                  <motion.label
                    htmlFor='file-upload'
                    className={cn(
                      'w-full h-[180px] sm:h-[220px] md:h-[300px] border-2 border-dashed rounded-[var(--radius-lg)] flex flex-col items-center justify-center cursor-pointer text-gray-500 transition-colors bg-[#FCFCFD] relative overflow-hidden',
                      isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-300 hover:border-gray-400',
                    )}
                    whileHover={{ borderColor: isDragging ? undefined : '#9ca3af' }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <motion.div
                      className='absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50 opacity-0'
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                    <div className='flex flex-col justify-center items-center gap-4 relative z-10'>
                      <motion.div
                        className={cn(
                          'rounded-full p-3 text-[#98A2B3]',
                          isDragging ? 'bg-primary/15 text-primary' : 'bg-[var(--accent)]',
                        )}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 10,
                        }}
                      >
                        {isDragging ? (
                          <UploadCloud size={32} />
                        ) : (
                          <ImagePlus size={32} />
                        )}
                      </motion.div>
                      <div className='flex flex-col items-center gap-1'>
                        <div className='flex flex-row justify-center items-center gap-1'>
                          <span className='font-bold text-[var(--primary)] text-base'>
                            {isDragging ? 'Drop image to upload' : 'Click to upload'}
                          </span>
                        </div>
                        <span className='font-medium text-sm text-gray-400'>
                          JPG, PNG, WEBP up to {MAX_FILE_SIZE_MB}MB
                        </span>
                      </div>
                    </div>
                  </motion.label>
                  <Input
                    ref={fileInputRef}
                    id='file-upload'
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={handleFileChange}
                  />
                  <div className='mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
                    <Button
                      variant='outline'
                      type='button'
                      onClick={() => fileInputRef.current?.click()}
                      className='w-full md:w-auto h-11 px-6'
                    >
                      Browse files
                    </Button>
                    <span className='text-xs text-[var(--muted-foreground)] text-center md:text-right'>
                      Tip: use bright, high-resolution photos for best print quality.
                    </span>
                  </div>
                  {uploadError && (
                    <Alert className='mt-4 border-destructive/30 bg-destructive/5 text-destructive'>
                      <AlertDescription>{uploadError}</AlertDescription>
                    </Alert>
                  )}
                  <div className='flex items-center justify-center mt-5'>
                    <Button
                      className='w-full md:w-auto h-12 px-6 md:px-14 rounded-[var(--radius-lg)] text-base font-semibold opacity-50 cursor-not-allowed'
                      onClick={handleContinue}
                      disabled
                    >
                      Select a photo to continue
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key='preview'
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className='w-full'
                >
                  <motion.div
                    className='relative rounded-lg overflow-hidden'
                    layoutId='image-container'
                  >
                    <img
                      src={preview}
                      alt='Preview'
                      className='w-full h-[180px] sm:h-[220px] md:h-[300px] object-contain'
                    />
                    <motion.div
                      className='absolute inset-0 bg-gradient-to-t from-black/10 to-transparent'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    />
                  </motion.div>

                  <motion.div
                    className='mt-4 flex flex-col items-stretch gap-3'
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <div className='flex justify-center'>
                      {_file && (
                        <div className='inline-flex max-w-full items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs text-[var(--foreground)]'>
                          <CheckCircle2 size={14} className='text-primary shrink-0' />
                          <span className='truncate max-w-[220px] md:max-w-[420px]'>
                            {_file.name}
                          </span>
                        </div>
                      )}
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 15,
                      }}
                    >
                      <div className='flex flex-col-reverse md:flex-row gap-3 w-full'>
                        <Button
                          variant='outline'
                          className='w-full md:flex-1 h-12 px-6 rounded-[var(--radius-lg)] text-base font-semibold'
                          onClick={resetUpload}
                        >
                          Change photo
                        </Button>
                        <Button
                          className='w-full md:flex-1 h-12 px-6 rounded-[var(--radius-lg)] text-base font-semibold'
                          onClick={handleContinue}
                        >
                          Continue
                        </Button>
                      </div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};
export default function Page() {
  return (
    <ClientOnly>
      <UploadPageInner />
    </ClientOnly>
  );
}
