import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from './admin-layout';
import { AdminRoomContentEditor } from './admin-room-content-editor';
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  Image as ImageIcon,
  MapPin,
  Plus,
  X,
  Package,
  Palette,
  Upload,
  FileText,
  Eye,
} from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useProducts, useArt } from '@/lib/supabase/hooks';
interface Hotspot {
  id?: string;
  product_id?: string;
  art_product_id?: string;
  art_size_id?: string;
  position_x: number;
  position_y: number;
  display_order: number;
  label?: string;
  product_name?: string;
  size_name?: string;
  product_image?: string;
  product_slug?: string;
}

export function AdminRoomEditPage() {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const supabase = createClient();
  const isEditing = roomId !== 'new';
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch products for hotspot linking
  const { data: products } = useProducts();
  const { data: artProducts } = useArt();
  const [artSizes, setArtSizes] = useState<any[]>([]);
  const [loadingSizes, setLoadingSizes] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    image: '',
  });

  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [addingHotspot, setAddingHotspot] = useState(false);
  const [newHotspot, setNewHotspot] = useState<Partial<Hotspot>>({
    position_x: 50,
    position_y: 50,
    display_order: 1,
  });

  // Delete confirmation states
  const [showDeleteRoomDialog, setShowDeleteRoomDialog] = useState(false);
  const [showDeleteHotspotDialog, setShowDeleteHotspotDialog] = useState(false);
  const [hotspotToDelete, setHotspotToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Update display_order when hotspots change
  useEffect(() => {
    setNewHotspot(prev => ({
      ...prev,
      display_order: hotspots.length + 1,
    }));
  }, [hotspots.length]);

  // Fetch art sizes when art product is selected
  useEffect(() => {
    const fetchArtSizes = async () => {
      if (!newHotspot.art_product_id || newHotspot.art_product_id === '') {
        setArtSizes([]);
        setLoadingSizes(false);
        return;
      }

      setLoadingSizes(true);
      try {
        const supabaseClient = createClient();

        // First get the art product to access available_sizes JSONB
        const { data: artProduct, error: artError } = await supabaseClient
          .from('art_products')
          .select('available_sizes')
          .eq('id', newHotspot.art_product_id)
          .single();

        if (artError) throw artError;

        // available_sizes is JSONB: [{"size_id": "uuid", "price": 29.99, "image_url": "..."}]
        const availableSizes = artProduct?.available_sizes || [];

        if (availableSizes.length === 0) {
          setArtSizes([]);
          setLoadingSizes(false);
          return;
        }

        // Get the size_ids from available_sizes
        const sizeIds = availableSizes.map((s: any) => s.size_id);

        // Fetch the actual size details from sizes table
        const { data: sizesData, error: sizesError } = await supabaseClient
          .from('sizes')
          .select('*')
          .in('id', sizeIds);

        if (sizesError) throw sizesError;

        // Combine size details with pricing from available_sizes
        const enrichedSizes = (sizesData || []).map((size: any) => {
          const priceInfo = availableSizes.find(
            (s: any) => s.size_id === size.id
          );
          return {
            id: size.id,
            width_in: size.width_in,
            height_in: size.height_in,
            width_cm: Math.round(size.width_in * 2.54),
            height_cm: Math.round(size.height_in * 2.54),
            display_label: size.display_label,
            price: priceInfo?.price || 0,
          };
        });

        setArtSizes(enrichedSizes);
      } catch {
        // Failed to fetch art sizes, reset to empty array
        setArtSizes([]);
      } finally {
        setLoadingSizes(false);
      }
    };

    fetchArtSizes();
  }, [newHotspot.art_product_id]);

  // Fetch room data if editing
  useEffect(() => {
    const fetchRoom = async () => {
      if (!isEditing) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();

        // Fetch room
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .or(`id.eq.${roomId},slug.eq.${roomId}`)
          .single();

        if (roomError) throw roomError;

        if (roomData) {
          setFormData({
            title: roomData.title,
            slug: roomData.slug,
            description: roomData.description || '',
            image: roomData.image,
          });

          // Fetch hotspots directly from table (not using RPC function for edit page)
          const { data: hotspotsData, error: hotspotsError } = await supabase
            .from('room_hotspots')
            .select(
              `
              id,
              product_id,
              art_product_id,
              position_x,
              position_y,
              display_order,
              label,
              products:product_id(name, slug, images),
              art_products:art_product_id(name, slug, images)
            `
            )
            .eq('room_id', roomData.id)
            .order('display_order', { ascending: true });

          if (!hotspotsError && hotspotsData) {
            setHotspots(
              hotspotsData.map((h: any) => {
                const product = h.products || h.art_products;
                return {
                  id: h.id,
                  product_id: h.product_id,
                  art_product_id: h.art_product_id,
                  position_x: h.position_x,
                  position_y: h.position_y,
                  display_order: h.display_order,
                  label: h.label,
                  product_name: product?.name || 'Unknown Product',
                  product_slug: product?.slug,
                  product_image: product?.images?.[0] || null,
                };
              })
            );
          }
        }
      } catch (error) {
        console.error('Error fetching room:', error);
        toast.error('Failed to load room');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId, isEditing]);

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    });
  };

  // Handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `room-${Date.now()}.${fileExt}`;
      const filePath = `rooms/${fileName}`;

      // Upload to Supabase Storage bucket "photify"
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data: uploadData, error: uploadError } = await supabase.storage
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

      setFormData({ ...formData, image: publicUrl });
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading image:', error);

      // Show helpful error messages
      if (error.message?.includes('Bucket not found')) {
        toast.error('Storage bucket "photify" not found.');
        toast.info('Please create a "photify" bucket in Supabase Storage');
      } else if (error.message?.includes('policy')) {
        toast.error('Storage permissions error.');
        toast.info('Check storage policies for the "photify" bucket');
      } else {
        toast.error('Failed to upload image: ' + error.message);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle remove image
  const handleRemoveImage = () => {
    if (confirm('Are you sure you want to remove this image?')) {
      setFormData({ ...formData, image: '' });
      toast.success('Image removed. Remember to save changes.');
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.image.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const roomData = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        image: formData.image,
      };

      if (isEditing) {
        // Update existing room
        const { error } = await supabase
          .from('rooms')
          .update(roomData)
          .eq('id', roomId);

        if (error) throw error;

        toast.success('Room updated successfully');
      } else {
        // Create new room
        const { data: newRoom, error } = await supabase
          .from('rooms')
          .insert(roomData)
          .select()
          .single();

        if (error) throw error;

        toast.success('Room created successfully');

        // Redirect to edit page for newly created room
        if (newRoom) {
          navigate(`/admin/rooms/${newRoom.id}`);
          return;
        }
      }
    } catch (error: any) {
      console.error('Error saving room:', error);
      toast.error(error.message || 'Failed to save room');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async () => {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('rooms').delete().eq('id', roomId);

      if (error) throw error;

      toast.success('Room deleted successfully');
      navigate('/admin/rooms');
    } catch (error) {
      toast.error('Failed to delete room');
      console.warn('Error deleting room:', error);
    } finally {
      setDeleting(false);
      setShowDeleteRoomDialog(false);
    }
  };

  const handleAddHotspot = async () => {
    if (!newHotspot.product_id && !newHotspot.art_product_id) {
      toast.error('Please select a product for the hotspot');
      return;
    }

    // Validate art product has size selected
    if (newHotspot.art_product_id && !newHotspot.art_size_id) {
      toast.error('Please select a size for the art product');
      return;
    }

    if (!isEditing) {
      toast.error('Please save the room first before adding hotspots');
      return;
    }

    try {
      const supabase = createClient();

      // Get actual room ID (in case roomId is slug)
      const { data: roomData } = await supabase
        .from('rooms')
        .select('id')
        .or(`id.eq.${roomId},slug.eq.${roomId}`)
        .single();

      if (!roomData) throw new Error('Room not found');

      const insertData = {
        room_id: roomData.id,
        product_id: newHotspot.product_id || null,
        art_product_id: newHotspot.art_product_id || null,
        art_size_id: newHotspot.art_size_id || null,
        position_x: newHotspot.position_x,
        position_y: newHotspot.position_y,
        display_order: newHotspot.display_order,
        label: newHotspot.label || null,
      };

      console.log('Inserting hotspot:', insertData);

      const { data: insertedData, error } = await supabase
        .from('room_hotspots')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      console.log('Hotspot inserted:', insertedData);

      toast.success('Hotspot added successfully');

      // Refresh hotspots directly from table
      const { data: hotspotsData, error: fetchError } = await supabase
        .from('room_hotspots')
        .select(
          `
          id,
          product_id,
          art_product_id,
          position_x,
          position_y,
          display_order,
          label,
          products:product_id(name, slug, images),
          art_products:art_product_id(name, slug, images)
        `
        )
        .eq('room_id', roomData.id)
        .order('display_order', { ascending: true });

      console.log('Refreshed hotspots data:', hotspotsData);
      console.log('Fetch error:', fetchError);

      if (hotspotsData) {
        const updatedHotspots = hotspotsData.map((h: any) => {
          const product = h.products || h.art_products;
          return {
            id: h.id,
            product_id: h.product_id,
            art_product_id: h.art_product_id,
            position_x: h.position_x,
            position_y: h.position_y,
            display_order: h.display_order,
            label: h.label,
            product_name: product?.name || 'Unknown Product',
            product_slug: product?.slug,
            product_image: product?.images?.[0] || null,
          };
        });

        console.log('Updated hotspots array:', updatedHotspots);
        setHotspots(updatedHotspots);

        // Reset form with updated display_order
        setNewHotspot({
          position_x: 50,
          position_y: 50,
          display_order: updatedHotspots.length + 1,
        });
      }

      // Keep adding mode active for easy multiple additions
      // setAddingHotspot(false);
    } catch (error) {
      console.error('Error adding hotspot:', error);
      toast.error('Failed to add hotspot');
    }
  };

  const handleDeleteHotspot = async () => {
    if (!hotspotToDelete) return;

    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('room_hotspots')
        .delete()
        .eq('id', hotspotToDelete);

      if (error) throw error;

      toast.success('Hotspot deleted successfully');
      setHotspots(hotspots.filter(h => h.id !== hotspotToDelete));
    } catch (error) {
      toast.error('Failed to delete hotspot');
      console.warn('Error deleting hotspot:', error);
    } finally {
      setDeleting(false);
      setShowDeleteHotspotDialog(false);
      setHotspotToDelete(null);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!addingHotspot) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setNewHotspot({
      ...newHotspot,
      position_x: parseFloat(x.toFixed(2)),
      position_y: parseFloat(y.toFixed(2)),
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='w-6 h-6 animate-spin text-[#f63a9e]' />
          <span className='ml-2 text-gray-600'>Loading room...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-6'>
          <Button
            variant='ghost'
            onClick={() => navigate('/admin/rooms')}
            className='mb-4 -ml-2'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Rooms
          </Button>

          <div className='flex items-start justify-between'>
            <div>
              <h1
                className="font-['Bricolage_Grotesque',_sans-serif] mb-2"
                style={{ fontSize: '32px', fontWeight: '600' }}
              >
                {isEditing ? 'Edit Room' : 'Create New Room'}
              </h1>
              <p className='text-gray-600'>
                {isEditing
                  ? 'Update room details and manage hotspots'
                  : 'Add a new room inspiration showcase'}
              </p>
            </div>

            <div className='flex gap-2'>
              {isEditing && (
                <Button
                  variant='outline'
                  onClick={() => setShowDeleteRoomDialog(true)}
                  className='text-red-600 hover:text-red-700 hover:bg-red-50'
                >
                  <Trash2 className='w-4 h-4 mr-2' />
                  Delete Room
                </Button>
              )}

              <Button
                onClick={handleSave}
                disabled={saving}
                className='bg-[#f63a9e] hover:bg-[#e02d8d]'
                style={{ height: '44px' }}
              >
                {saving ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className='w-4 h-4 mr-2' />
                    {isEditing ? 'Update Room' : 'Create Room'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue='details' className='w-full'>
          <TabsList className='mb-6'>
            <TabsTrigger value='details' className='gap-2'>
              <ImageIcon className='w-4 h-4' />
              Room Details
            </TabsTrigger>
            {isEditing && (
              <>
                <TabsTrigger value='content' className='gap-2'>
                  <FileText className='w-4 h-4' />
                  SEO & Content
                </TabsTrigger>
                <TabsTrigger value='hotspots' className='gap-2'>
                  <MapPin className='w-4 h-4' />
                  Hotspots ({hotspots.length})
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Details Tab */}
          <TabsContent value='details'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {/* Main Form */}
              <div className='lg:col-span-2 space-y-6'>
                {/* Basic Information */}
                <div className='bg-white rounded-lg border border-gray-200 p-6'>
                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] mb-4"
                    style={{ fontSize: '18px', fontWeight: '600' }}
                  >
                    Basic Information
                  </h3>

                  <div className='space-y-4'>
                    <div>
                      <Label htmlFor='title'>Room Title *</Label>
                      <Input
                        id='title'
                        value={formData.title}
                        onChange={e => handleTitleChange(e.target.value)}
                        placeholder='e.g., Modern Living Room'
                      />
                    </div>

                    <div>
                      <Label htmlFor='slug'>Slug *</Label>
                      <Input
                        id='slug'
                        value={formData.slug}
                        onChange={e =>
                          setFormData({ ...formData, slug: e.target.value })
                        }
                        placeholder='modern-living-room'
                      />
                      <p className='text-xs text-gray-600 mt-1'>
                        URL-friendly identifier (auto-generated from title)
                      </p>
                    </div>

                    <div>
                      <Label htmlFor='description'>Description</Label>
                      <Textarea
                        id='description'
                        value={formData.description}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder='Brief description of the room setup...'
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                {/* Room Image */}
                <div className='bg-white rounded-lg border border-gray-200 p-6'>
                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] mb-4"
                    style={{ fontSize: '18px', fontWeight: '600' }}
                  >
                    Room Image *
                  </h3>

                  <div className='space-y-4'>
                    {formData.image ? (
                      <div>
                        <Label>Current Image</Label>
                        <div className='mt-2 space-y-3'>
                          <div className='aspect-video rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 relative group'>
                            <ImageWithFallback
                              src={formData.image}
                              alt={formData.title || 'Room preview'}
                              className='w-full h-full object-cover'
                            />
                            <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3'>
                              <Button
                                type='button'
                                variant='outline'
                                onClick={() => fileInputRef.current?.click()}
                                className='bg-white hover:bg-gray-100'
                              >
                                <Upload className='w-4 h-4 mr-2' />
                                Change Image
                              </Button>
                              <Button
                                type='button'
                                variant='outline'
                                onClick={handleRemoveImage}
                                className='bg-white hover:bg-red-50 text-red-600 hover:text-red-700'
                              >
                                <Trash2 className='w-4 h-4 mr-2' />
                                Remove
                              </Button>
                            </div>
                          </div>
                          <p className='text-xs text-gray-500'>
                            Hover over image to change or remove
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label>Upload Image</Label>
                        <div
                          className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#f63a9e] hover:bg-pink-50 transition-colors cursor-pointer'
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {uploading ? (
                            <div className='flex flex-col items-center gap-3'>
                              <Loader2 className='w-12 h-12 text-[#f63a9e] animate-spin' />
                              <p className='text-sm text-gray-600'>
                                Uploading image...
                              </p>
                            </div>
                          ) : (
                            <div className='flex flex-col items-center gap-3'>
                              <Upload className='w-12 h-12 text-gray-400' />
                              <div>
                                <p className='text-sm font-medium text-gray-700'>
                                  Click to upload room image
                                </p>
                                <p className='text-xs text-gray-500 mt-1'>
                                  PNG, JPG, WebP up to 5MB
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type='file'
                      accept='image/*'
                      className='hidden'
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />

                    <p className='text-xs text-gray-600'>
                      Recommended: High-quality image, 1920x1080 or similar
                      aspect ratio
                    </p>
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className='space-y-6'>
                <div className='bg-white rounded-lg border border-gray-200 p-6'>
                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] mb-4"
                    style={{ fontSize: '18px', fontWeight: '600' }}
                  >
                    Room Information
                  </h3>

                  <div className='space-y-3 text-sm'>
                    <div className='flex justify-between items-center py-2 border-b border-gray-100'>
                      <span className='text-gray-600'>Status:</span>
                      <span className='font-semibold text-green-600'>
                        Active
                      </span>
                    </div>

                    {isEditing && (
                      <>
                        <div className='flex justify-between items-center py-2 border-b border-gray-100'>
                          <span className='text-gray-600'>Hotspots:</span>
                          <span className='font-semibold'>
                            {hotspots.length}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                  <h4 className='font-semibold text-blue-900 mb-2 text-sm'>
                    💡 Pro Tips
                  </h4>
                  <ul className='text-xs text-blue-800 space-y-1'>
                    <li>• Use high-quality room images</li>
                    <li>• Add hotspots to link products</li>
                    <li>• Position hotspots on visible products</li>
                    <li>• Save room before adding hotspots</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* SEO & Content Tab */}
          {isEditing && (
            <TabsContent value='content'>
              <AdminRoomContentEditor roomId={roomId as string} />
            </TabsContent>
          )}

          {/* Hotspots Tab */}
          {isEditing && (
            <TabsContent value='hotspots'>
              <div className='space-y-6'>
                {/* Interactive Image */}
                <div className='bg-white rounded-lg border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3
                      className="font-['Bricolage_Grotesque',_sans-serif]"
                      style={{ fontSize: '18px', fontWeight: '600' }}
                    >
                      Interactive Room Image
                    </h3>
                    <Button
                      onClick={() => setAddingHotspot(!addingHotspot)}
                      variant={addingHotspot ? 'outline' : 'default'}
                      className={
                        addingHotspot
                          ? 'border-red-500 text-red-600 hover:bg-red-50'
                          : 'bg-[#f63a9e] hover:bg-[#e02d8d]'
                      }
                    >
                      {addingHotspot ? (
                        <>
                          <X className='w-4 h-4 mr-2' />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Plus className='w-4 h-4 mr-2' />
                          Add Hotspot
                        </>
                      )}
                    </Button>
                  </div>

                  {addingHotspot && (
                    <div className='mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                      <p className='text-sm text-blue-900 font-semibold mb-2'>
                        📍 Click on the image to place a hotspot
                      </p>
                      <p className='text-xs text-blue-800'>
                        Position: {newHotspot.position_x?.toFixed(1)}%,{' '}
                        {newHotspot.position_y?.toFixed(1)}%
                      </p>
                    </div>
                  )}

                  <div
                    className={`aspect-video rounded-lg overflow-hidden bg-gray-100 relative border-2 ${
                      addingHotspot
                        ? 'border-[#f63a9e] cursor-crosshair'
                        : 'border-gray-200'
                    }`}
                    onClick={handleImageClick}
                  >
                    <ImageWithFallback
                      src={formData.image}
                      alt={formData.title}
                      className='w-full h-full object-cover'
                    />

                    {/* Existing hotspots */}
                    {hotspots.map((hotspot, index) => (
                      <div
                        key={hotspot.id || index}
                        className='absolute w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform border-2 border-[#f63a9e]'
                        style={{
                          left: `${hotspot.position_x}%`,
                          top: `${hotspot.position_y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        title={hotspot.product_name}
                      >
                        <span className='text-sm font-semibold text-[#f63a9e]'>
                          {hotspot.display_order}
                        </span>
                      </div>
                    ))}

                    {/* New hotspot preview */}
                    {addingHotspot && (
                      <div
                        className='absolute w-8 h-8 bg-[#f63a9e] rounded-full shadow-lg flex items-center justify-center animate-pulse border-2 border-white'
                        style={{
                          left: `${newHotspot.position_x}%`,
                          top: `${newHotspot.position_y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <Plus className='w-4 h-4 text-white' />
                      </div>
                    )}
                  </div>

                  {addingHotspot && (
                    <div className='mt-4 space-y-3 p-4 bg-gray-50 rounded-lg'>
                      <div>
                        <Label>Select Product Type</Label>
                        <div className='grid grid-cols-2 gap-2 mt-2'>
                          <Button
                            type='button'
                            variant='outline'
                            onClick={() => {
                              setArtSizes([]);
                              setNewHotspot({
                                position_x: newHotspot.position_x,
                                position_y: newHotspot.position_y,
                                display_order: newHotspot.display_order,
                                product_id: '',
                                art_product_id: undefined,
                                art_size_id: undefined,
                              });
                            }}
                            className={
                              newHotspot.product_id !== undefined
                                ? 'border-[#f63a9e] bg-pink-50'
                                : ''
                            }
                          >
                            <Package className='w-4 h-4 mr-2' />
                            Custom Product
                          </Button>
                          <Button
                            type='button'
                            variant='outline'
                            onClick={() => {
                              setNewHotspot({
                                position_x: newHotspot.position_x,
                                position_y: newHotspot.position_y,
                                display_order: newHotspot.display_order,
                                product_id: undefined,
                                art_product_id: '',
                                art_size_id: undefined,
                              });
                            }}
                            className={
                              newHotspot.art_product_id !== undefined
                                ? 'border-[#f63a9e] bg-pink-50'
                                : ''
                            }
                          >
                            <Palette className='w-4 h-4 mr-2' />
                            Art Product
                          </Button>
                        </div>
                      </div>

                      {newHotspot.product_id !== undefined ? (
                        <div>
                          <Label>Select Custom Product</Label>
                          <Select
                            value={newHotspot.product_id}
                            onValueChange={value =>
                              setNewHotspot({
                                ...newHotspot,
                                product_id: value,
                                art_product_id: undefined,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Choose a product...' />
                            </SelectTrigger>
                            <SelectContent>
                              {products?.map((product: any) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : newHotspot.art_product_id !== undefined ? (
                        <>
                          <div>
                            <Label>Select Art Product</Label>
                            <Select
                              value={newHotspot.art_product_id || ''}
                              onValueChange={value =>
                                setNewHotspot({
                                  ...newHotspot,
                                  art_product_id: value,
                                  art_size_id: undefined,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder='Choose an art product...' />
                              </SelectTrigger>
                              <SelectContent>
                                {artProducts?.map((art: any) => (
                                  <SelectItem key={art.id} value={art.id}>
                                    {art.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {newHotspot.art_product_id &&
                            newHotspot.art_product_id !== '' && (
                              <div>
                                <Label>Select Size *</Label>
                                {loadingSizes ? (
                                  <div className='px-4 py-3 border border-gray-200 rounded-lg flex items-center gap-2 text-sm text-gray-600'>
                                    <Loader2 className='w-4 h-4 animate-spin' />
                                    Loading sizes...
                                  </div>
                                ) : artSizes.length > 0 ? (
                                  <>
                                    <Select
                                      value={newHotspot.art_size_id}
                                      onValueChange={value =>
                                        setNewHotspot({
                                          ...newHotspot,
                                          art_size_id: value,
                                        })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder='Choose a size...' />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {artSizes.map((size: any) => (
                                          <SelectItem
                                            key={size.id}
                                            value={size.id}
                                          >
                                            {size.width_cm}×{size.height_cm}cm -
                                            £{size.price}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <p className='text-xs text-gray-500 mt-1'>
                                      Required: Users will add this size to cart
                                    </p>
                                  </>
                                ) : (
                                  <div className='px-4 py-3 border border-red-200 bg-red-50 rounded-lg text-sm text-red-700'>
                                    ⚠️ No sizes available for this art product.
                                    Please add sizes in the art product
                                    settings.
                                  </div>
                                )}
                              </div>
                            )}
                        </>
                      ) : (
                        <div className='text-center py-8 text-gray-500'>
                          <p className='text-sm'>
                            👆 Select a product type to continue
                          </p>
                        </div>
                      )}

                      {(newHotspot.product_id || newHotspot.art_product_id) && (
                        <>
                          <div>
                            <Label>Custom Label (Optional)</Label>
                            <Input
                              value={newHotspot.label || ''}
                              onChange={e =>
                                setNewHotspot({
                                  ...newHotspot,
                                  label: e.target.value,
                                })
                              }
                              placeholder='e.g., Featured Artwork'
                            />
                          </div>

                          <Button
                            type='button'
                            onClick={handleAddHotspot}
                            className='w-full bg-[#f63a9e] hover:bg-[#e02d8d]'
                          >
                            <Plus className='w-4 h-4 mr-2' />
                            Add Hotspot
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Hotspots List */}
                <div className='bg-white rounded-lg border border-gray-200 p-6'>
                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] mb-4"
                    style={{ fontSize: '18px', fontWeight: '600' }}
                  >
                    Current Hotspots ({hotspots.length})
                  </h3>

                  {hotspots.length > 0 ? (
                    <div className='space-y-2'>
                      {hotspots.map((hotspot, index) => (
                        <div
                          key={hotspot.id || index}
                          className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
                        >
                          <div className='flex items-center gap-3 flex-1'>
                            <span className='w-6 h-6 bg-[#f63a9e] text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0'>
                              {hotspot.display_order}
                            </span>

                            {/* Product Thumbnail */}
                            <div className='w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0'>
                              {hotspot.product_image ? (
                                <ImageWithFallback
                                  src={hotspot.product_image}
                                  alt={hotspot.product_name || 'Product'}
                                  className='w-full h-full object-cover'
                                />
                              ) : (
                                <div className='w-full h-full flex items-center justify-center'>
                                  <ImageIcon className='w-5 h-5 text-gray-400' />
                                </div>
                              )}
                            </div>

                            <div className='flex-1 min-w-0'>
                              <p className='text-sm font-medium truncate'>
                                {hotspot.product_name}
                              </p>
                              <p className='text-xs text-gray-600'>
                                Position: {hotspot.position_x?.toFixed(1)}%,{' '}
                                {hotspot.position_y?.toFixed(1)}%
                              </p>
                            </div>
                          </div>

                          <div className='flex items-center gap-1'>
                            {/* View Product Button */}
                            {hotspot.product_slug && (
                              <button
                                onClick={() => {
                                  const productPath = hotspot.art_product_id
                                    ? `/art/${hotspot.product_slug}`
                                    : `/product/${hotspot.product_slug}`;
                                  window.open(productPath, '_blank');
                                }}
                                className='text-[#f63a9e] hover:bg-pink-50 p-2 rounded-lg transition-colors'
                                title='View Product'
                              >
                                <Eye className='w-4 h-4' />
                              </button>
                            )}

                            {/* Delete Button */}
                            <button
                              onClick={() => {
                                if (hotspot.id) {
                                  setHotspotToDelete(hotspot.id);
                                  setShowDeleteHotspotDialog(true);
                                }
                              }}
                              className='text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors'
                              title='Delete Hotspot'
                            >
                              <Trash2 className='w-4 h-4' />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-8 text-gray-500'>
                      <MapPin className='w-12 h-12 mx-auto mb-3 text-gray-300' />
                      <p className='text-sm'>No hotspots added yet</p>
                      <p className='text-xs mt-1'>
                        Click &quot;Add Hotspot&quot; to get started
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Delete Room Confirmation Dialog */}
      <DeleteConfirmDialog
        open={showDeleteRoomDialog}
        onOpenChange={setShowDeleteRoomDialog}
        onConfirm={handleDeleteRoom}
        title='Delete Room?'
        itemName={formData.title}
        itemType='room'
        loading={deleting}
        warningMessage='This action cannot be undone.'
        cascadeInfo={
          hotspots.length > 0
            ? [
                `${hotspots.length} hotspot${hotspots.length > 1 ? 's' : ''} will be permanently deleted`,
              ]
            : undefined
        }
      />

      {/* Delete Hotspot Confirmation Dialog */}
      <DeleteConfirmDialog
        open={showDeleteHotspotDialog}
        onOpenChange={setShowDeleteHotspotDialog}
        onConfirm={handleDeleteHotspot}
        title='Delete Hotspot?'
        itemName={hotspots.find(h => h.id === hotspotToDelete)?.product_name}
        itemType='hotspot'
        loading={deleting}
        description='Are you sure you want to remove this product hotspot from the room?'
      />
    </AdminLayout>
  );
}
