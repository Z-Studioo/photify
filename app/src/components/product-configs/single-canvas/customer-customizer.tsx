import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { 
  Upload, 
  Image as ImageIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { SINGLE_CANVAS_PRODUCT } from './config';
import { uploadFileToStorage } from '@/lib/supabase/storage';

interface AspectRatio {
  id: string;
  label: string;
  width_ratio: number;
  height_ratio: number;
  orientation: 'portrait' | 'landscape' | 'square';
  active: boolean;
}

interface Size {
  id: string;
  aspect_ratio_id: string;
  width_in: number;
  height_in: number;
  display_label: string;
  area_in2: number;
  active: boolean;
}

export function SingleCanvasCustomizer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If an art image URL was passed in query params, use it instead of requiring upload
  const artImageUrl = searchParams.get('artImageUrl')
    ? decodeURIComponent(searchParams.get('artImageUrl')!)
    : null;

  // State
  const [aspectRatios, setAspectRatios] = useState<AspectRatio[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch product configuration
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch product configuration
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('config, price')
          .eq('id', SINGLE_CANVAS_PRODUCT.id)
          .single();

        if (productError) throw productError;

        if (productData?.config?.allowedRatios) {
          // Fetch allowed aspect ratios
          const { data: ratiosData, error: ratiosError } = await supabase
            .from('aspect_ratios')
            .select('*')
            .in('id', productData.config.allowedRatios)
            .eq('active', true)
            .order('label');

          if (ratiosError) throw ratiosError;
          setAspectRatios(ratiosData || []);

          // Fetch allowed sizes
          const { data: sizesData, error: sizesError } = await supabase
            .from('sizes')
            .select('*')
            .in('id', productData.config.allowedSizes)
            .eq('active', true)
            .order('area_in2');

          if (sizesError) throw sizesError;
          setSizes(sizesData || []);

          // If an art image URL was passed, auto-navigate to 3D viewer using the best-fit size
          if (artImageUrl && sizesData && sizesData.length > 0 && ratiosData && ratiosData.length > 0) {
            const bestRatio = ratiosData[0];
            const bestSize = sizesData[0];
            const params = new URLSearchParams({
              image: encodeURIComponent(artImageUrl),
              width: bestSize.width_in.toString(),
              height: bestSize.height_in.toString(),
              productId: SINGLE_CANVAS_PRODUCT.id,
              productName: encodeURIComponent(SINGLE_CANVAS_PRODUCT.name),
              aspectRatioId: bestRatio.id,
              wrapImage: 'true',
              enableImageEditor: 'true',
            });
            navigate(`/customize/product-3d-view?${params.toString()}`, { replace: true });
            return;
          }
        }
      } catch (error: any) {
        console.error('Error fetching configuration:', error);
        toast.error('Failed to load product configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle image upload - upload to storage, auto-detect size, and navigate to 3D viewer
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate that we have aspect ratios and sizes configured
    if (aspectRatios.length === 0) {
      toast.error('No aspect ratios configured for this product. Please contact support.');
      console.error('No aspect ratios available:', { aspectRatios, sizes });
      return;
    }

    if (sizes.length === 0) {
      toast.error('No sizes configured for this product. Please contact support.');
      console.error('No sizes available:', { aspectRatios, sizes });
      return;
    }

    // Show uploading toast
    const uploadToast = toast.loading('Uploading image...');

    try {
      // First, upload the image to Supabase storage
      const publicUrl = await uploadFileToStorage(file, 'canvas-uploads');
      
      if (!publicUrl) {
        toast.error('Failed to upload image. Please try again.', { id: uploadToast });
        return;
      }

      toast.loading('Analyzing image...', { id: uploadToast });

      // Create image element to get dimensions and find best matching ratio/size
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        
        const img = new Image();
        img.onload = () => {
          const imageAspectRatio = img.width / img.height;
          
          // Find best matching aspect ratio
          let bestRatio = aspectRatios[0];
          let smallestDiff = Math.abs(imageAspectRatio - (aspectRatios[0].width_ratio / aspectRatios[0].height_ratio));
          
          aspectRatios.forEach(ratio => {
            const ratioValue = ratio.width_ratio / ratio.height_ratio;
            const diff = Math.abs(imageAspectRatio - ratioValue);
            if (diff < smallestDiff) {
              smallestDiff = diff;
              bestRatio = ratio;
            }
          });
          
          
          // Find best matching size for this ratio based on image dimensions
          const availableSizes = sizes.filter(s => s.aspect_ratio_id === bestRatio.id);
          
          // If no sizes available for this specific ratio, try to find any enabled size
          let bestSize = availableSizes.length > 0 ? availableSizes[0] : sizes[0];
          
          if (availableSizes.length > 0) {
            // Calculate estimated print size in inches (assuming 300 DPI)
            const dpi = 300;
            const estimatedWidthIn = img.width / dpi;
            const estimatedHeightIn = img.height / dpi;
            const estimatedAreaIn = estimatedWidthIn * estimatedHeightIn;
            
            // Find size with closest area match
            let smallestAreaDiff = Math.abs(availableSizes[0].area_in2 - estimatedAreaIn);
            
            availableSizes.forEach(size => {
              const areaDiff = Math.abs(size.area_in2 - estimatedAreaIn);
              if (areaDiff < smallestAreaDiff) {
                smallestAreaDiff = areaDiff;
                bestSize = size;
              }
            });
          } else {
            // No sizes for this specific ratio - use any available size as fallback
            console.warn('No sizes found for aspect ratio, using fallback:', bestRatio.label);
          }
          
          // Navigate directly to 3D viewer with auto-selected size and uploaded image URL
          if (bestSize) {
            toast.success(`Auto-selected ${bestSize.display_label} based on your image!`, { id: uploadToast });
            
            const params = new URLSearchParams({
              image: encodeURIComponent(publicUrl), // Use the uploaded public URL
              width: bestSize.width_in.toString(),
              height: bestSize.height_in.toString(),
              productId: SINGLE_CANVAS_PRODUCT.id,
              productName: encodeURIComponent(SINGLE_CANVAS_PRODUCT.name),
              aspectRatioId: bestRatio.id,
              wrapImage: 'true', // Single canvas wraps image around edges
              enableImageEditor: 'true', // Enable crop editor for single canvas
            });
            
            navigate(`/customize/product-3d-view?${params.toString()}`);
          } else {
            // This should never happen now that we have fallback logic
            toast.error('Could not find a suitable canvas size for your image. Please contact support.', { id: uploadToast });
            console.error('No suitable size found despite fallback logic:', { bestRatio, sizes });
          }
        };
        
        img.onerror = () => {
          toast.error('Failed to load image. Please try a different file.', { id: uploadToast });
        };
        
        img.src = imageUrl;
      };
      
      reader.onerror = () => {
        toast.error('Failed to read image file.', { id: uploadToast });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image. Please try again.', { id: uploadToast });
    }
  };

  // Handle drag and drop
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
    if (file) handleImageUpload(file);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FFF5FB]">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-[#f63a9e] border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Loading customizer...</p>
        </div>
      </div>
    );
  }

  // Only show upload screen (no crop screen)
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5FB] via-white to-pink-50 flex items-center justify-center p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 
              className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4"
              style={{ fontSize: '40px', fontWeight: '700', lineHeight: '1.2' }}
            >
              Create Your Canvas Print
            </h1>
            <p className="text-gray-600 text-lg">
              Upload your photo to get started with your custom canvas
            </p>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-4 border-dashed rounded-3xl p-16 text-center transition-all ${
              isDragging
                ? 'border-[#f63a9e] bg-pink-50'
                : 'border-gray-300 bg-white hover:border-[#f63a9e] hover:bg-pink-50'
            }`}
          >
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-[#f63a9e]/10 rounded-full flex items-center justify-center mb-6">
                <Upload className="w-12 h-12 text-[#f63a9e]" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {isDragging ? 'Drop your image here' : 'Upload Your Photo'}
              </h3>
              
              <p className="text-gray-600 mb-6">
                Drag and drop or click to browse
              </p>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#f63a9e] hover:bg-[#e02d8d] text-white h-14 px-10 rounded-xl text-lg font-semibold"
              >
                <ImageIcon className="w-5 h-5 mr-2" />
                Choose Image
              </Button>
              
              <p className="text-sm text-gray-500 mt-6">
                Supports: JPG, PNG, WebP (Max 10MB)
              </p>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-green-600 text-xl">✓</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">High Quality</h4>
              <p className="text-sm text-gray-600">Professional canvas prints</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-blue-600 text-xl">⚡</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Fast Delivery</h4>
              <p className="text-sm text-gray-600">Ships within 2-3 days</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-purple-600 text-xl">🎨</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Easy Customize</h4>
              <p className="text-sm text-gray-600">Crop and adjust your way</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
}
