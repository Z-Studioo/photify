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
  base64?: string; // Add base64 for persistence
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
  const { setPendingFile, setPendingPreview, applyPendingChanges } =
    useUpload();

  // Local storage key for uploaded images
  const STORAGE_KEY = 'photify_uploaded_images';

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Helper function to convert base64 to File
  const base64ToFile = (
    base64Data: string,
    fileName: string,
    fileType: string
  ): File => {
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], fileName, { type: fileType });
  };

  // Load images from localStorage on component mount
  useEffect(() => {
    const savedImages = localStorage.getItem(STORAGE_KEY);
    if (savedImages) {
      try {
        const parsedImages = JSON.parse(savedImages);
        const restoredImages: UploadedImage[] = parsedImages.map((img: any) => {
          if (img.base64) {
            // Restore File object from base64
            const restoredFile = base64ToFile(
              img.base64,
              img.name,
              img.file?.type || 'image/jpeg'
            );
            return {
              id: img.id,
              name: img.name,
              file: restoredFile,
              url: img.base64, // Use base64 as URL for persistence
              base64: img.base64,
            };
          }
          return img;
        });
        setUploadedImages(restoredImages);
      } catch (error) {
        console.error('Error loading images from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save images to localStorage whenever uploadedImages changes
  useEffect(() => {
    if (uploadedImages.length > 0) {
      // Create serializable data (exclude File objects)
      const serializableImages = uploadedImages.map(img => ({
        id: img.id,
        name: img.name,
        base64: img.base64,
        url: img.url,
        file: {
          name: img.file.name,
          type: img.file.type,
          size: img.file.size,
        },
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableImages));
    }
  }, [uploadedImages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageId = Date.now().toString();

      try {
        const base64Data = await fileToBase64(file);

        const newImage: UploadedImage = {
          id: imageId,
          file,
          url: base64Data, // Use base64 as URL
          name: file.name,
          base64: base64Data,
        };

        setUploadedImages(prev => [...prev, newImage]);
        setSelectedImageId(imageId);

        // Store as pending photo - don't update main context yet
        setPendingFile(file);
        setPendingPreview(base64Data);

        // ✅ apply immediately so dashboard updates
        applyPendingChanges();

        onPhotoSelected?.(file);
      } catch (error) {
        console.error('Error converting file to base64:', error);
        // Fallback to blob URL if base64 conversion fails
        const imageUrl = URL.createObjectURL(file);
        const newImage: UploadedImage = {
          id: imageId,
          file,
          url: imageUrl,
          name: file.name,
        };

        setUploadedImages(prev => [...prev, newImage]);
        setSelectedImageId(imageId);
        setPendingFile(file);
        setPendingPreview(imageUrl);
        onPhotoSelected?.(file);
      }
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

  const handleMultipleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages: UploadedImage[] = [];

      // Process files sequentially to avoid overwhelming the browser
      for (const file of files) {
        const imageId =
          Date.now().toString() + Math.random().toString(36).substr(2, 9);

        try {
          const base64Data = await fileToBase64(file);
          const newImage: UploadedImage = {
            id: imageId,
            file,
            url: base64Data,
            name: file.name,
            base64: base64Data,
          };
          newImages.push(newImage);
        } catch (error) {
          console.error('Error converting file to base64:', error);
          // Fallback to blob URL
          const imageUrl = URL.createObjectURL(file);
          const newImage: UploadedImage = {
            id: imageId,
            file,
            url: imageUrl,
            name: file.name,
          };
          newImages.push(newImage);
        }
      }

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
