import { useNavigate, useSearchParams } from 'react-router';
import { useUpload } from '@/context/UploadContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crop, Image, Info, Scan, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/header';

const Page = () => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (!f.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      const newPreview = URL.createObjectURL(f);
      setFile(f);
      setPreview(newPreview);
    }
  };

  const handleContinue = () => {
    console.log('Continuing with file:', _file, 'and preview:', preview);
    if (_file && preview) {
      navigate('/crop');
    }
  };

  const resetUpload = () => {
    setFile(null);
    setPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const navigate = useNavigate();

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

  const stepVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.15,
        duration: 0.5,
        ease: [0.34, 1.56, 0.64, 1],
      },
    }),
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
    <div className='min-h-screen flex flex-col'>
      <Header />
      <motion.div
        className='w-full flex-grow flex flex-col items-center justify-center font-[var(--font-heading)] p-4 m-0'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        <motion.h1
          className='text-2xl md:text-3xl font-bold mb-8'
          variants={itemVariants}
        >
          Upload your photo
        </motion.h1>

        <motion.div variants={itemVariants} className='w-full max-w-[744px]'>
          <Card className='w-full mx-auto flex flex-col items-center border-none p-0 shadow-none'>
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
                    className='w-full h-[220px] md:h-[300px] border-2 border-dashed border-gray-300 rounded-[var(--radius-lg)] flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:border-gray-400 transition-colors bg-[#FCFCFD] relative overflow-hidden'
                    whileHover={{ borderColor: '#9ca3af' }}
                  >
                    <motion.div
                      className='absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50 opacity-0'
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                    <div className='flex flex-col justify-center items-center gap-4 relative z-10'>
                      <motion.div
                        className='rounded-full p-3 bg-[var(--accent)] text-[#98A2B3]'
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 10,
                        }}
                      >
                        <Image size={32} />
                      </motion.div>
                      <div className='flex flex-col items-center gap-1'>
                        <div className='flex flex-row justify-center items-center gap-1'>
                          <span className='font-bold text-[var(--primary)] text-base'>
                            Click to upload
                          </span>
                        </div>
                        <span className='font-medium text-sm text-gray-400'>
                          or drag and drop
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
                  <div className='flex items-center justify-center'>
                    <Button
                      className={`w-full md:w-auto h-12 mt-4 px-6 md:px-14 rounded-[var(--radius-lg)] text-base font-semibold ${!preview ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={handleContinue}
                      disabled={!preview}
                    >
                      Continue
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
                      className='w-full h-[220px] md:h-[300px] object-contain'
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
                      <Button
                        variant='link'
                        className='cursor-pointer text-[var(--foreground)] underline text-sm'
                        onClick={() => {
                          setFile(null);
                          setPreview(null);
                        }}
                      >
                        Change photo
                      </Button>
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
                      <Button
                        className='w-full h-12 px-6 rounded-[var(--radius-lg)] text-base font-semibold'
                        onClick={handleContinue}
                      >
                        Continue
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className='w-full max-w-[744px] mt-16'
        >
          <Card className='p-0 flex flex-col justify-center items-center border-none shadow-none w-full'>
            <span className='text-[var(--muted-foreground)] text-base mb-6'>
              Just 3 more steps to go
            </span>

            <div className='flex w-full justify-center items-center px-4'>
              <div className='relative flex flex-row items-center justify-between w-full gap-4 md:gap-0'>
                <div className='absolute flex w-full h-16 top-0 items-center z-0'>
                  <motion.hr
                    className='w-full border-t border-[#E0E3E7] border-dashed z-0'
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      delay: 0.8,
                      duration: 0.8,
                      ease: 'easeInOut',
                    }}
                  />
                </div>

                <motion.div
                  className='flex flex-col items-center gap-2 z-10'
                  custom={0}
                  variants={stepVariants}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <motion.div
                    className='w-14 h-14 md:w-16 md:h-16 flex justify-center items-center rounded-full bg-[#3AF66C] shadow-md'
                    whileHover={{
                      boxShadow: '0 10px 30px rgba(58, 246, 108, 0.25)',
                    }}
                  >
                    <span className='!text-white'>
                      <Scan size={24} />
                    </span>
                  </motion.div>
                  <span className='text-xs font-medium text-center'>
                    Adjust
                  </span>
                </motion.div>

                <motion.div
                  className='flex flex-col items-center gap-2 z-10'
                  custom={1}
                  variants={stepVariants}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <motion.div
                    className='w-14 h-14 md:w-16 md:h-16 flex justify-center items-center rounded-full bg-[#B625FE] shadow-md'
                    whileHover={{
                      boxShadow: '0 10px 30px rgba(182, 37, 254, 0.25)',
                    }}
                  >
                    <span className='!text-white'>
                      <Crop size={24} />
                    </span>
                  </motion.div>
                  <span className='text-xs font-medium text-center'>
                    Select size
                  </span>
                </motion.div>

                <motion.div
                  className='flex flex-col items-center gap-2 z-10'
                  custom={2}
                  variants={stepVariants}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <motion.div
                    className='w-14 h-14 md:w-16 md:h-16 flex justify-center items-center rounded-full bg-[#F63A53] shadow-md'
                    whileHover={{
                      boxShadow: '0 10px 30px rgba(246, 58, 83, 0.25)',
                    }}
                  >
                    <span className='!text-white'>
                      <ShoppingBag size={24} />
                    </span>
                  </motion.div>
                  <span className='text-xs font-medium'>Checkout</span>
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className='w-full max-w-[744px] mt-12'
        >
          <Alert className='bg-[#FFF9DA] text-yellow-700 border-[#FFF9DA] w-full flex gap-2 px-4 py-3 rounded-lg'>
            <span className='text-[var(--chart-4)] mt-0.5'>
              <Info size={18} />
            </span>
            <AlertDescription className='text-[var(--foreground)] text-xs leading-relaxed'>
              The area inside pink borders is primarily visible and the area in
              the shadow will be used to fold the canvas.
            </AlertDescription>
          </Alert>
        </motion.div>
      </motion.div>
    </div>
  );
};
export default Page;
