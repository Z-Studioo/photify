import React from 'react';
import { Upload, Check, X } from 'lucide-react';

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
}

interface ImageSelectionPanelProps {
  uploadedImages: UploadedImage[];
  selectedImageId: string | null;
  onImageSelect: (imageId: string) => void;
  onUploadMore: () => void;
  onClose: () => void;
  onConfirm: () => void;
  onDeleteImage: (imageId: string) => void;
}

const MyPhotos: React.FC<ImageSelectionPanelProps> = ({
  uploadedImages,
  selectedImageId,
  onImageSelect,
  onUploadMore,
  onDeleteImage,
  // onClose,
  // onConfirm
}) => {
  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b'>
        <h3 className='text-lg font-semibold'>
          My Photos ({uploadedImages.length})
        </h3>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-auto p-4'>
        <div className='flex flex-wrap gap-3'>
          {/* Upload More Button */}
          <div
            onClick={onUploadMore}
            className='flex-shrink-0 w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center space-y-1 hover:border-gray-400 cursor-pointer transition-colors'
          >
            <Upload className='h-5 w-5 text-gray-400' />
            <span className='text-xs text-gray-600 text-center'>
              Upload More
            </span>
          </div>

          {/* Uploaded Images Thumbnails */}
          {uploadedImages.map(image => (
            <div
              key={image.id}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden relative cursor-pointer border-2 transition-all group ${
                selectedImageId === image.id
                  ? 'border-primary shadow-md ring-2 ring-primary/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={image.url}
                alt={image.name}
                className='w-full h-full object-cover'
                onClick={() => onImageSelect(image.id)}
              />

              {/* Delete Button */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDeleteImage(image.id);
                }}
                className='absolute top-1 right-1 bg-white bg-opacity-90 hover:bg-opacity-100 text-red-600 rounded-full p-1 shadow-sm opacity-100 group-hover:opacity-100 transition-all z-30'
                title='Delete photo'
                aria-label={`Delete ${image.name}`}
              >
                <X className='h-3 w-3' />
              </button>

              {/* Selection Overlay */}
              <div
                onClick={() => onImageSelect(image.id)}
                className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                  selectedImageId === image.id
                    ? 'bg-primary/20 opacity-100'
                    : 'bg-black/0 opacity-0 hover:bg-black/10 hover:opacity-100'
                } z-20`}
              >
                {selectedImageId === image.id && (
                  <div className='bg-primary rounded-full p-1'>
                    <Check className='h-3 w-3 text-white' />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyPhotos;
