import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Upload,
  X,
  Loader2,
  GripVertical,
  Image as ImageIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AdminProductImageManagerProps {
  productId: string;
}

interface ImageItem {
  id: string;
  url: string;
}

function SortableImageItem({
  image,
  onDelete,
}: {
  image: ImageItem;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group bg-white border-2 rounded-lg overflow-hidden ${
        isDragging ? 'border-[#f63a9e] shadow-lg' : 'border-gray-200'
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className='absolute top-2 left-2 z-10 bg-white/90 rounded p-1.5 cursor-move hover:bg-white shadow-sm'
      >
        <GripVertical className='w-4 h-4 text-gray-600' />
      </div>

      {/* Delete Button */}
      <button
        onClick={() => onDelete(image.id)}
        className='absolute top-2 right-2 z-10 bg-red-500 text-white rounded p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600'
      >
        <X className='w-4 h-4' />
      </button>

      {/* Image */}
      <div className='aspect-square'>
        <ImageWithFallback
          src={image.url}
          alt='Product image'
          className='w-full h-full object-cover'
        />
      </div>
    </div>
  );
}

export function AdminProductImageManager({
  productId,
}: AdminProductImageManagerProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch existing images
  useEffect(() => {
    fetchImages();
  }, [productId]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('images')
        .eq('id', productId)
        .single();

      if (error) throw error;

      if (data?.images && Array.isArray(data.images)) {
        // Convert array of URLs to ImageItem objects
        const imageItems: ImageItem[] = data.images.map(
          (url: string, index: number) => ({
            id: `image-${index}-${Date.now()}`,
            url,
          })
        );
        setImages(imageItems);
      }
    } catch (error: any) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate file types
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      const uploadPromises = validFiles.map(async file => {
        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `product-${productId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        // Upload to Supabase Storage bucket "photify"
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { error: uploadError } = await supabase.storage
          .from('photify')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('photify').getPublicUrl(filePath);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Add new images to the list
      const newImages: ImageItem[] = uploadedUrls.map((url, index) => ({
        id: `image-${Date.now()}-${index}`,
        url,
      }));

      setImages([...images, ...newImages]);
      setHasChanges(true);
      toast.success(`${validFiles.length} image(s) uploaded successfully`);
    } catch (error: any) {
      console.error('Error uploading images:', error);

      if (error.message?.includes('Bucket not found')) {
        toast.error('Storage bucket "photify" not found');
        toast.info('Please create a "photify" bucket in Supabase Storage');
      } else if (error.message?.includes('policy')) {
        toast.error('Storage permissions error');
        toast.info('Check storage policies for the "photify" bucket');
      } else {
        toast.error('Failed to upload images: ' + error.message);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setImages(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        setHasChanges(true);
        return reordered;
      });
    }
  };

  const handleDelete = async (imageId: string) => {
    const imageToDelete = images.find(img => img.id === imageId);
    if (!imageToDelete) return;

    // Confirm deletion
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      // Delete from storage (optional - you may want to keep files)
      // await supabase.storage.from('photify').remove([filePath]);

      // Remove from local state
      setImages(images.filter(img => img.id !== imageId));
      setHasChanges(true);
      toast.success('Image removed');
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast.error('Failed to remove image');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert ImageItem[] back to string[]
      const imageUrls = images.map(img => img.url);

      // Update database
      const { error } = await supabase
        .from('products')
        .update({ images: imageUrls })
        .eq('id', productId);

      if (error) throw error;

      setHasChanges(false);
      toast.success('Images saved successfully');
    } catch (error: any) {
      console.error('Error saving images:', error);
      toast.error('Failed to save images');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='w-6 h-6 animate-spin text-[#f63a9e]' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Upload Section */}
      <Card className='p-6'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <Label className='text-base font-semibold'>Product Images</Label>
              <p className='text-sm text-gray-500 mt-1'>
                Upload multiple images. The first image will be the featured
                image.
              </p>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className='bg-[#f63a9e] hover:bg-[#e02d8d]'
            >
              {uploading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className='w-4 h-4 mr-2' />
                  Upload Images
                </>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              multiple
              onChange={handleFileUpload}
              className='hidden'
            />
          </div>

          {/* Upload Instructions */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <h4 className='text-sm font-semibold text-blue-900 mb-2'>
              Upload Guidelines
            </h4>
            <ul className='text-sm text-blue-800 space-y-1'>
              <li>• Maximum file size: 5MB per image</li>
              <li>• Accepted formats: JPG, PNG, WebP, GIF</li>
              <li>• Recommended size: 1200×1200px or larger</li>
              <li>• You can upload multiple images at once</li>
              <li>• Drag images to reorder (first image = featured image)</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Image Gallery */}
      {images.length > 0 ? (
        <Card className='p-6'>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-base font-semibold'>
                  Image Gallery ({images.length}{' '}
                  {images.length === 1 ? 'image' : 'images'})
                </Label>
                <p className='text-sm text-gray-500 mt-1'>
                  Drag to reorder • First image is the featured image
                </p>
              </div>
              {hasChanges && (
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className='bg-green-600 hover:bg-green-700'
                >
                  {saving ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              )}
            </div>

            {/* Sortable Grid */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={images.map(img => img.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                  {images.map((image, index) => (
                    <div key={image.id} className='relative'>
                      <SortableImageItem
                        image={image}
                        onDelete={handleDelete}
                      />
                      {index === 0 && (
                        <div className='absolute -top-2 -left-2 z-20 bg-[#f63a9e] text-white text-xs font-bold px-2 py-1 rounded shadow-lg'>
                          Featured
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </Card>
      ) : (
        <Card className='p-12'>
          <div className='text-center'>
            <ImageIcon className='w-16 h-16 text-gray-300 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              No images uploaded yet
            </h3>
            <p className='text-gray-600 mb-6'>
              Upload product images to display in the product gallery
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className='bg-[#f63a9e] hover:bg-[#e02d8d]'
            >
              <Upload className='w-4 h-4 mr-2' />
              Upload Your First Image
            </Button>
          </div>
        </Card>
      )}

      {/* Save Reminder */}
      {hasChanges && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-yellow-800'>
              ⚠️ You have unsaved changes. Click &quot;Save Changes&quot; to update the
              product.
            </p>
            <Button
              onClick={handleSave}
              disabled={saving}
              size='sm'
              className='bg-green-600 hover:bg-green-700'
            >
              {saving ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
