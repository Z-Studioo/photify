import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface UploadModalProps {
  isOpen: boolean;
  canvasId: number;
  onClose: () => void;
  onUpload: (canvasId: number, file: File, imageUrl: string) => void;
}

export function UploadModal({ isOpen, canvasId, onClose, onUpload }: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = async () => {
    if (!selectedFile || !previewUrl) return;

    setUploading(true);
    
    try {
      // Simulate upload delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onUpload(canvasId, selectedFile, previewUrl);
      toast.success(`Image uploaded to Canvas ${canvasId + 1}`);
      handleClose();
    } catch (error) {
      toast.error('Failed to upload image');
      return error;
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setIsDragging(false);
    onClose();
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
                <h3 
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                  style={{ fontSize: '24px', fontWeight: '700' }}
                >
                  Upload Image - Canvas {canvasId + 1}
                </h3>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-8">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />

                {!previewUrl ? (
                  // Upload Area
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-4 border-dashed rounded-2xl p-12 text-center transition-all ${
                      isDragging
                        ? 'border-[#f63a9e] bg-pink-50'
                        : 'border-gray-300 bg-gray-50 hover:border-[#f63a9e] hover:bg-pink-50'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-[#f63a9e]/10 rounded-full flex items-center justify-center mb-4">
                        <Upload className="w-10 h-10 text-[#f63a9e]" />
                      </div>
                      
                      <h4 className="text-xl font-bold text-gray-900 mb-2">
                        {isDragging ? 'Drop your image here' : 'Upload Your Photo'}
                      </h4>
                      
                      <p className="text-gray-600 mb-6">
                        Drag and drop or click to browse
                      </p>
                      
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[#f63a9e] hover:bg-[#e02d8d] text-white h-12 px-8 rounded-xl text-base"
                        style={{ fontWeight: '700' }}
                      >
                        <ImageIcon className="w-5 h-5 mr-2" />
                        Choose Image
                      </Button>
                      
                      <p className="text-sm text-gray-500 mt-4">
                        Supports: JPG, PNG, WebP (Max 10MB)
                      </p>
                    </div>
                  </div>
                ) : (
                  // Preview Area
                  <div className="space-y-6">
                    <div className="relative rounded-2xl overflow-hidden bg-gray-100">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-auto max-h-96 object-contain"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {selectedFile?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setPreviewUrl(null);
                          setSelectedFile(null);
                        }}
                        className="text-sm text-[#f63a9e] hover:text-[#e02d8d] font-semibold"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-gray-200 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 h-12 px-6 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUploadClick}
                  disabled={!selectedFile || uploading}
                  className="bg-[#f63a9e] hover:bg-[#e02d8d] text-white h-12 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontWeight: '700' }}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Image'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

