import React, { useState, useEffect } from 'react';
import { ImagePlus, Layout, Crop, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MyPhotos from '@/components/shared/dashboard/MyPhotos';
import { useUpload } from '@/context/UploadContext';

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
}

interface SelectPhotoProps {
  onPhotoSelected?: (file: File) => void;
}

const canvasOptions = [
  { id: 'landscape', label: 'Landscape', icon: <Layout className='h-6 w-6' /> },
  { id: 'portrait', label: 'Portrait', icon: <Crop className='h-6 w-6' /> },
  { id: 'square', label: 'Square', icon: <Square className='h-6 w-6' /> },
];

const SelectPhoto: React.FC<SelectPhotoProps> = ({ onPhotoSelected }) => {
  const [selectedCanvas, setSelectedCanvas] = useState<string>('landscape');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const { setPendingFile, setPendingPreview } = useUpload();

  // Local storage key for uploaded images
  const STORAGE_KEY = 'photify_uploaded_images';

  // Load images from localStorage on component mount
  useEffect(() => {
    const savedImages = localStorage.getItem(STORAGE_KEY);
    if (savedImages) {
      try {
        const parsedImages = JSON.parse(savedImages) as UploadedImage[];
        setUploadedImages(parsedImages);
      } catch (error) {
        console.error('Error loading images from localStorage:', error);
      }
    }
  }, []);

  // Save images to localStorage whenever uploadedImages changes
  useEffect(() => {
    if (uploadedImages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(uploadedImages));
    }
  }, [uploadedImages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageId = Date.now().toString();
      const imageUrl = URL.createObjectURL(file);

      const newImage: UploadedImage = {
        id: imageId,
        file,
        url: imageUrl,
        name: file.name,
      };

      setUploadedImages(prev => [...prev, newImage]);
      setSelectedImageId(imageId);

      // Store as pending photo - don't update main context yet
      setPendingFile(file);
      setPendingPreview(imageUrl);

      onPhotoSelected?.(file);
    }
  };

  const triggerFileUpload = () => {
    const fileInput = document.getElementById(
      'select-photo-input'
    ) as HTMLInputElement;
    fileInput?.click();
  };

  //Required later
  // const handleUploadMore = () => {
  //   triggerFileUpload()
  // }

  const handleMultipleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages: UploadedImage[] = [];

      files.forEach(file => {
        const imageId =
          Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const imageUrl = URL.createObjectURL(file);

        const newImage: UploadedImage = {
          id: imageId,
          file,
          url: imageUrl,
          name: file.name,
        };
        newImages.push(newImage);
      });

      setUploadedImages(prev => [...prev, ...newImages]);

      // Select the first newly uploaded image if none is selected
      if (!selectedImageId && newImages.length > 0) {
        setSelectedImageId(newImages[0].id);
        onPhotoSelected?.(newImages[0].file);
      }

      // Clear the input value so the same file can be selected again
      e.target.value = '';
    }
  };

  const handleImageSelect = (imageId: string) => {
    setSelectedImageId(imageId);

    // Store as pending photo - don't update main context yet
    const selectedImage = uploadedImages.find(img => img.id === imageId);
    if (selectedImage) {
      setPendingFile(selectedImage.file);
      setPendingPreview(selectedImage.url);
      onPhotoSelected?.(selectedImage.file);
    }
  };

  const handleConfirmSelection = () => {
    const selectedImage = uploadedImages.find(
      img => img.id === selectedImageId
    );
    if (selectedImage) {
      // Store as pending photo - don't update main context yet
      setPendingFile(selectedImage.file);
      setPendingPreview(selectedImage.url);
      onPhotoSelected?.(selectedImage.file);
    }
    // Don't close the panel - stay in MyPhotos view
  };

  const handleDeleteImage = (imageId: string) => {
    const updatedImages = uploadedImages.filter(img => img.id !== imageId);
    setUploadedImages(updatedImages);

    // Update localStorage
    if (updatedImages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedImages));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    // If the deleted image was selected, clear selection
    if (selectedImageId === imageId) {
      setSelectedImageId(null);
      setPendingFile(null);
      setPendingPreview(null);
    }
  };

  const handleGoBackToUpload = () => {
    // Clear all uploaded images to go back to SelectPhoto view
    setUploadedImages([]);
    setSelectedImageId(null);
    // Clear localStorage as well
    localStorage.removeItem(STORAGE_KEY);
  };

  // If user has uploaded at least one image, show MyPhotos component
  if (uploadedImages.length > 0) {
    return (
      <div className='relative overflow-auto p-4'>
        {/* Hidden file input for MyPhotos upload more functionality */}
        <input
          type='file'
          id='my-photos-input'
          className='hidden'
          accept='image/*'
          multiple
          onChange={handleMultipleFileChange}
        />

        <MyPhotos
          uploadedImages={uploadedImages}
          selectedImageId={selectedImageId}
          onImageSelect={handleImageSelect}
          onUploadMore={() => {
            const fileInput = document.getElementById(
              'my-photos-input'
            ) as HTMLInputElement;
            fileInput?.click();
          }}
          onClose={handleGoBackToUpload}
          onConfirm={handleConfirmSelection}
          onDeleteImage={handleDeleteImage}
        />
      </div>
    );
  }

  // If no images uploaded, show SelectPhoto component
  return (
    <div className='relative overflow-auto p-4'>
      {/* Main Content */}
      <div className='flex flex-col space-y-6'>
        {/* Dotted bordered section */}
        <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center space-y-4 bg-white'>
          <ImagePlus className='h-10 w-10 text-gray-400' />
          <p className='text-lg font-light text-gray-700'>
            Drag and Drop Your Files Here
          </p>
          <p className='text-xs text-gray-500 text-center'>
            JPG, PNG format, min 700x700px, max 50000x50000px or 1000MP, max
            2GB. <br />
            We save your uploaded photo in your account for 90 days.
          </p>
          <input
            type='file'
            id='select-photo-input'
            className='hidden'
            accept='image/*'
            onChange={handleFileChange}
          />
          <Button
            variant='default'
            onClick={triggerFileUpload}
            className='px-6 py-3 rounded-none'
          >
            Upload Photo
          </Button>
          <p className='text-sm text-gray-500'>
            Please{' '}
            <span className='underline cursor-pointer hover:no-underline'>
              login
            </span>{' '}
            to upload
          </p>
        </div>

        {/* Canvas options */}
        <div className='flex flex-col space-y-3'>
          <h4 className='text-sm font-semibold text-center'>Use one of ours</h4>
          <div className='flex flex-wrap gap-4'>
            {canvasOptions.map(option => (
              <div
                key={option.id}
                onClick={() => setSelectedCanvas(option.id)}
                className={`flex-1 min-w-[100px] cursor-pointer border rounded-none p-4 flex flex-col items-center justify-center text-center transition ${
                  selectedCanvas === option.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-500'
                }`}
              >
                <span>{option.icon}</span>
                <span className='mt-1 text-sm'>{option.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectPhoto;
