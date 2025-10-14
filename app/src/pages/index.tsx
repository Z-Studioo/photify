import { useNavigate } from 'react-router';
import { useUpload } from '@/context/UploadContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crop, Image, Info, Scan, ShoppingBag } from 'lucide-react';

const Page = () => {
  const { file: _file, setFile, preview, setPreview } = useUpload();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const navigate = useNavigate();

  return (
    <div className='w-full min-h-screen flex flex-col items-center justify-center font-[var(--font-heading)] p-4 md:p-0 m-0'>
      <h1 className='text-2xl md:text-3xl font-bold mb-6 text-center'>
        Upload your photo
      </h1>

      {/* Image section */}
      <Card className='w-full max-w-[744px] mx-auto flex flex-col items-center border-none p-4 md:p-0 shadow-none'>
        {!preview ? (
          <>
            <label
              htmlFor='file-upload'
              className='w-full h-[200px] md:h-[300px] border border-dashed border-gray-300 rounded-[var(--radius-lg)] flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:border-gray-400 transition bg-[#FCFCFD]'
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
            <Button
              className={`w-full md:w-auto h-12 mt-3 px-6 md:px-14 rounded-[var(--radius-lg)] text-base ${!preview ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => preview && navigate('/dashboard')}
              disabled={!preview}
            >
              Continue
            </Button>
          </>
        ) : (
          <div>
            <img
              src={preview}
              alt='Preview'
              className='rounded-lg object-contain w-full max-w-[744px] h-[180px] md:h-[300px] bg-white'
            />
            {/* Stack upload/change and continue vertically */}
            <div className='mt-3 flex flex-col items-center gap-3'>
              <div className='flex items-center'>
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

              <div className='flex flex-col sm:flex-row gap-3'>
                <Button
                  className='w-full sm:w-auto h-12 px-6 md:px-14 rounded-[var(--radius-lg)] text-base'
                  onClick={() => navigate('/dashboard')}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Steps */}
      <Card className='mt-16 p-0 flex flex-col justify-center items-center border-none shadow-none w-full max-w-[744px]'>
        <span className='text-[var(--muted-foreground)] text-lg'>
          Just 3 more steps to go
        </span>

        <div className='flex w-full justify-center items-center px-2'>
          <div className='relative flex flex-row md:flex-row items-center justify-around w-full gap-4 py-4'>
            {/* First Icon */}
            <div className='flex flex-col items-center gap-2 z-10'>
              <div className='w-12 h-12 md:w-16 md:h-16 flex justify-center items-center rounded-full bg-[#3AF66C]'>
                <span className='!text-white '>
                  <Scan />
                </span>
              </div>
              <span className='text-sm text-center'>Adjust</span>
            </div>

            {/* Second Icon */}
            <div className='flex flex-col items-center gap-2 z-10'>
              <div className='w-12 h-12 md:w-16 md:h-16 flex justify-center items-center rounded-full bg-[#B625FE]'>
                <span className='!text-white '>
                  <Crop />
                </span>
              </div>
              <span className='text-sm w-22 text-center'>Select size</span>
            </div>

            {/* Third Icon */}
            <div className='flex flex-col items-center gap-2 z-10'>
              <div className='w-12 h-12 md:w-16 md:h-16 flex justify-center items-center rounded-full bg-[#F63A53]'>
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
      <Alert className='mt-6 bg-[#FFF9DA] text-yellow-700 border-[#FFF9DA] w-full max-w-[744px] flex justify-center gap-2 px-4'>
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
