import React from "react"
import { Upload, Check } from "lucide-react"

interface UploadedImage {
  id: string
  file: File
  url: string
  name: string
}

interface ImageSelectionPanelProps {
  uploadedImages: UploadedImage[]
  selectedImageId: string | null
  onImageSelect: (imageId: string) => void
  onUploadMore: () => void
  onClose: () => void
  onConfirm: () => void
}

const MyPhotos: React.FC<ImageSelectionPanelProps> = ({
  uploadedImages,
  selectedImageId,
  onImageSelect,
  onUploadMore,
  // onClose,
  // onConfirm
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">My Photos ({uploadedImages.length})</h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-wrap gap-3">
          {/* Upload More Button */}
          <div
            onClick={onUploadMore}
            className="flex-shrink-0 w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center space-y-1 hover:border-gray-400 cursor-pointer transition-colors"
          >
            <Upload className="h-5 w-5 text-gray-400" />
            <span className="text-xs text-gray-600 text-center">Upload More</span>
          </div>

          {/* Uploaded Images Thumbnails */}
          {uploadedImages.map((image) => (
            <div
              key={image.id}
              onClick={() => onImageSelect(image.id)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden relative cursor-pointer border-2 transition-all ${
                selectedImageId === image.id
                  ? "border-primary shadow-md ring-2 ring-primary/20"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-full object-cover"
              />

              {/* Selection Overlay */}
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                selectedImageId === image.id
                  ? "bg-primary/20 opacity-100"
                  : "bg-black/0 opacity-0 hover:bg-black/10 hover:opacity-100"
              }`}>
                {selectedImageId === image.id && (
                  <div className="bg-primary rounded-full p-1">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  )
}

export default MyPhotos