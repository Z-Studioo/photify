import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crop, Image, Info, Scan, ShoppingBag } from 'lucide-react';

const Page = () => {
  const [, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  return (
    <div className='w-full min-h-screen flex flex-col items-center justify-center font-[var(--font-heading)] p-0 m-0'>
      <h1 className='text-2xl font-bold mb-8'>Upload your photo</h1>

      {/* Image section */}
      <Card className='w-[744px] mx-auto flex flex-col items-center border-none p-0 shadow-none'>
        {!preview ? (
          <>
            <label
              htmlFor='file-upload'
              className='w-[744px] h-[300px] border-1 border-dashed border-gray-300 rounded-[var(--radius-lg)] flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:border-gray-400 transition bg-[#FCFCFD]'
            >
              <div className='flex flex-col justify-center items-center gap-4'>
                <span className='border-px rounded-full p-3 bg-[var(--accent)] text-[#98A2B3]'>
                  <Image size={32} />
                </span>
                <div className='flex flex-row justify-center items-center gap-1'>
                  <span className='font-bold text-[var(--primary)]'>
                    Click to upload{' '}
                  </span>
                  <span className='font-semibold'>or drag and drop</span>
                </div>
              </div>
            </label>
            <Input
              id='file-upload'
              type='file'
              accept='image/*'
              className='hidden'
              onChange={handleFileChange}
            />
            <Button className='w-auto h-12 mt-1 px-14 rounded-[var(--radius-lg)] text-base'>
              Continue
            </Button>
          </>
        ) : (
          <div>
            <img
              src={preview}
              alt='Preview'
              className='rounded-lg object-cover w-[744px] h-[300px]'
            />
            <div className='flex justify-end mt-2'>
              <Button
                variant='link'
                className='cursor-pointer text-[var(--foreground)] underline'
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
              >
                Change photo
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Steps */}
      <Card className='mt-16 p-0 flex flex-col justify-center items-center border-none shadow-none'>
        <span className='text-[var(--muted-foreground)] text-lg'>
          Just 3 more steps to go
        </span>

        <div className='flex flex-row justify-center items-center'>
          <div className='relative flex items-center justify-around w-138'>
            <div className='absolute w-full h-16 flex top-0 items-center z-1'>
              <hr className='w-full border-t border-[#E0E3E7] border-dashed z-1' />
            </div>

            {/* First Icon */}
            <div className='flex flex-col items-center gap-2 z-2'>
              <div className='w-16 h-16 flex justify-center items-center rounded-full bg-[#3AF66C]'>
                <span className='!text-white '>
                  <Scan />
                </span>
              </div>
              <span className='text-sm text-center'>Adjust</span>
            </div>

            {/* Second Icon */}
            <div className='flex flex-col items-center gap-2 z-2'>
              <div className='w-16 h-16 flex justify-center items-center rounded-full bg-[#B625FE]'>
                <span className='!text-white '>
                  <Crop />
                </span>
              </div>
              <span className='text-sm w-22 text-center'>Select size</span>
            </div>

            {/* Third Icon */}
            <div className='flex flex-col items-center gap-2 z-2'>
              <div className='w-16 h-16 flex justify-center items-center rounded-full bg-[#F63A53]'>
                <span className='!text-white'>
                  <ShoppingBag />
                </span>
              </div>
              <span className='text-sm'>Checkout</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Info Alert */}
      <Alert className='mt-6 bg-[#FFF9DA] text-yellow-700 border-[#FFF9DA] w-138 flex justify-center gap-2'>
        <span className='text-[var(--chart-4)]'>
          <Info />
        </span>
        <AlertDescription className='text-[var(--foreground)]'>
          The area inside pink borders is primarily visible and the area in the
          shadow will be used to fold the canvas.
        </AlertDescription>
      </Alert>
    </div>
  );
};
export default Page;
