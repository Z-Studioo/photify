import { useState, useEffect } from 'react';
import { AdminLayout } from './admin-layout';
import {
  Save,
  RefreshCw,
  Store,
  Truck,
  CreditCard,
  Bell,
  Package,
  Plus,
  Edit,
  Eye,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface AspectRatio {
  id: string;
  label: string;
  width_ratio: number;
  height_ratio: number;
  orientation: string;
  active: boolean;
  sizes?: Size[];
}

interface Size {
  id: string;
  width_in: number;
  height_in: number;
  display_label: string;
  area_in2: number;
  active: boolean;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  description?: string;
}

export function AdminSettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [ratios, setRatios] = useState<AspectRatio[]>([]);
  const [ratiosLoading, setRatiosLoading] = useState(true);
  const [showAddRatio, setShowAddRatio] = useState(false);
  const [showRatioDetail, setShowRatioDetail] = useState(false);
  const [showAddSize, setShowAddSize] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio | null>(null);
  const [newRatio, setNewRatio] = useState({
    label: '',
    width_ratio: '',
    height_ratio: '',
    orientation: 'portrait',
  });
  const [newSize, setNewSize] = useState({ height: '', unit: 'inches' });
  const [calculatedWidth, setCalculatedWidth] = useState<number | null>(null);
  const [showConfirmSize, setShowConfirmSize] = useState(false);

  // Tags state
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [showAddTag, setShowAddTag] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTag, setNewTag] = useState({
    name: '',
    slug: '',
    color: '#f63a9e',
    description: '',
  });

  // Fetch aspect ratios and their sizes from Supabase
  useEffect(() => {
    fetchRatios();
    fetchTags();
  }, []);

  const fetchRatios = async () => {
    setRatiosLoading(true);
    try {
      // Fetch aspect ratios
      const { data: ratiosData, error: ratiosError } = await supabase
        .from('aspect_ratios')
        .select('*')
        .order('orientation', { ascending: true })
        .order('label', { ascending: true });

      if (ratiosError) throw ratiosError;

      // Fetch all sizes
      const { data: sizesData, error: sizesError } = await supabase
        .from('sizes')
        .select('*')
        .order('width_in', { ascending: true });

      if (sizesError) throw sizesError;

      // Group sizes by aspect_ratio_id
      const ratiosWithSizes = ratiosData.map(ratio => ({
        ...ratio,
        sizes: sizesData.filter(size => size.aspect_ratio_id === ratio.id),
      }));

      setRatios(ratiosWithSizes);
    } catch (error: any) {
      toast.error('Failed to load ratios: ' + error.message);
    } finally {
      setRatiosLoading(false);
    }
  };

  const fetchTags = async () => {
    setTagsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setTags(data || []);
    } catch (error: any) {
      toast.error('Failed to load tags: ' + error.message);
    } finally {
      setTagsLoading(false);
    }
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Settings saved successfully!');
    }, 1000);
  };

  const handleAddRatio = async () => {
    if (newRatio.label && newRatio.width_ratio && newRatio.height_ratio) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { error } = await supabase
          .from('aspect_ratios')
          .insert([
            {
              label: newRatio.label,
              width_ratio: parseInt(newRatio.width_ratio),
              height_ratio: parseInt(newRatio.height_ratio),
              orientation: newRatio.orientation,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        await fetchRatios();
        setNewRatio({
          label: '',
          width_ratio: '',
          height_ratio: '',
          orientation: 'portrait',
        });
        setShowAddRatio(false);
        toast.success('Ratio added successfully!');
      } catch (error: any) {
        toast.error('Failed to add ratio: ' + error.message);
      }
    }
  };

  const calculateWidth = (height: string, ratio: AspectRatio) => {
    const heightNum = parseFloat(height);
    if (!isNaN(heightNum) && ratio.width_ratio && ratio.height_ratio) {
      const width = (heightNum * ratio.width_ratio) / ratio.height_ratio;
      setCalculatedWidth(Math.round(width * 100) / 100); // Round to 2 decimals
      setShowConfirmSize(true);
    }
  };

  const handleConfirmSize = async () => {
    if (selectedRatio && newSize.height && calculatedWidth) {
      try {
        const displayLabel =
          `${calculatedWidth}" × ${newSize.height}" ${newSize.unit === 'inches' ? '' : newSize.unit}`.trim();

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { error } = await supabase
          .from('sizes')
          .insert([
            {
              aspect_ratio_id: selectedRatio.id,
              width_in: Math.round(calculatedWidth),
              height_in: Math.round(parseFloat(newSize.height)),
              display_label: displayLabel,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        await fetchRatios();

        // Update selected ratio with new sizes
        const updatedRatio = ratios.find(r => r.id === selectedRatio.id);
        if (updatedRatio) {
          setSelectedRatio(updatedRatio);
        }

        setNewSize({ height: '', unit: 'inches' });
        setCalculatedWidth(null);
        setShowConfirmSize(false);
        setShowAddSize(false);
        toast.success('Size added successfully!');
      } catch (error: any) {
        toast.error('Failed to add size: ' + error.message);
      }
    }
  };

  // Tag handlers
  const handleAddTag = async () => {
    if (newTag.name && newTag.slug) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { error } = await supabase
          .from('tags')
          .insert([
            {
              name: newTag.name,
              slug: newTag.slug,
              color: newTag.color,
              description: newTag.description || null,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        await fetchTags();
        setNewTag({ name: '', slug: '', color: '#f63a9e', description: '' });
        setShowAddTag(false);
        toast.success('Tag added successfully!');
      } catch (error: any) {
        toast.error('Failed to add tag: ' + error.message);
      }
    }
  };

  const handleUpdateTag = async () => {
    if (editingTag && editingTag.name && editingTag.slug) {
      try {
        const { error } = await supabase
          .from('tags')
          .update({
            name: editingTag.name,
            slug: editingTag.slug,
            color: editingTag.color,
            description: editingTag.description || null,
          })
          .eq('id', editingTag.id);

        if (error) throw error;

        await fetchTags();
        setEditingTag(null);
        toast.success('Tag updated successfully!');
      } catch (error: any) {
        toast.error('Failed to update tag: ' + error.message);
      }
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (
      confirm(
        'Are you sure you want to delete this tag? It will be removed from all products.'
      )
    ) {
      try {
        const { error } = await supabase.from('tags').delete().eq('id', tagId);

        if (error) throw error;

        await fetchTags();
        toast.success('Tag deleted successfully!');
      } catch (error: any) {
        toast.error('Failed to delete tag: ' + error.message);
      }
    }
  };

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <AdminLayout>
      <div className='w-full'>
        {/* Header */}
        <div className='mb-8'>
          <h1
            className="font-['Bricolage_Grotesque',_sans-serif] mb-2"
            style={{ fontSize: '32px', fontWeight: '600' }}
          >
            Settings & Configuration
          </h1>
          <p className='text-gray-600'>
            Manage your store settings and preferences
          </p>
        </div>

        <Tabs defaultValue='general' className='flex flex-row gap-4'>
          {/* Vertical Sidebar Menu - Sticky/Floating */}
          <aside className='w-72 flex-shrink-0'>
            <div className='sticky top-24'>
              <TabsList className='flex flex-col h-auto space-y-1 bg-white border border-gray-200 rounded-lg p-2 shadow-sm'>
                <TabsTrigger
                  value='general'
                  className='w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-pink-50 data-[state=active]:text-[#f63a9e] data-[state=inactive]:text-gray-700'
                >
                  <Store className='w-5 h-5' />
                  General
                </TabsTrigger>
                <TabsTrigger
                  value='products'
                  className='w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-pink-50 data-[state=active]:text-[#f63a9e] data-[state=inactive]:text-gray-700'
                >
                  <Package className='w-5 h-5' />
                  Products
                </TabsTrigger>
                <TabsTrigger
                  value='shipping'
                  className='w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-pink-50 data-[state=active]:text-[#f63a9e] data-[state=inactive]:text-gray-700'
                >
                  <Truck className='w-5 h-5' />
                  Shipping
                </TabsTrigger>
                <TabsTrigger
                  value='payment'
                  className='w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-pink-50 data-[state=active]:text-[#f63a9e] data-[state=inactive]:text-gray-700'
                >
                  <CreditCard className='w-5 h-5' />
                  Payment
                </TabsTrigger>
                <TabsTrigger
                  value='notifications'
                  className='w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-pink-50 data-[state=active]:text-[#f63a9e] data-[state=inactive]:text-gray-700'
                >
                  <Bell className='w-5 h-5' />
                  Notifications
                </TabsTrigger>
              </TabsList>
            </div>
          </aside>

          {/* Content Area */}
          <div className='flex-1'>
            {/* Products Settings */}
            <TabsContent value='products' className='mt-0'>
              <Tabs defaultValue='ratios' className='space-y-6'>
                {/* Horizontal Sub-tabs */}
                <TabsList className='inline-flex h-10 items-center justify-start rounded-lg bg-gray-100 p-1'>
                  <TabsTrigger value='ratios' className='px-6'>
                    Ratios
                  </TabsTrigger>
                  <TabsTrigger value='tags' className='px-6'>
                    Tags
                  </TabsTrigger>
                  <TabsTrigger value='canvas' className='px-6'>
                    Canvas
                  </TabsTrigger>
                  <TabsTrigger value='frames' className='px-6'>
                    Frames
                  </TabsTrigger>
                </TabsList>

                {/* Ratios Tab */}
                <TabsContent value='ratios' className='space-y-6 mt-0'>
                  <div className='bg-white rounded-lg border border-gray-200'>
                    <div className='p-6 border-b border-gray-200 flex items-center justify-between'>
                      <div>
                        <h2
                          className="font-['Bricolage_Grotesque',_sans-serif] mb-1"
                          style={{ fontSize: '20px', fontWeight: '600' }}
                        >
                          Product Ratios
                        </h2>
                        <p className='text-sm text-gray-600'>
                          Manage aspect ratios and their associated sizes
                        </p>
                      </div>
                      <Button
                        onClick={() => setShowAddRatio(true)}
                        className='bg-[#f63a9e] hover:bg-[#e02d8d] gap-2'
                      >
                        <Plus className='w-4 h-4' />
                        Add Ratio
                      </Button>
                    </div>

                    {ratiosLoading ? (
                      <div className='p-8 text-center text-gray-500'>
                        <RefreshCw className='w-6 h-6 animate-spin mx-auto mb-2' />
                        Loading ratios...
                      </div>
                    ) : ratios.length === 0 ? (
                      <div className='p-8 text-center text-gray-500'>
                        No ratios found. Add your first ratio to get started.
                      </div>
                    ) : (
                      <div className='divide-y divide-gray-200'>
                        {ratios.map(ratio => (
                          <div
                            key={ratio.id}
                            onClick={() => {
                              setSelectedRatio(ratio);
                              setShowRatioDetail(true);
                            }}
                            className='p-4 hover:bg-gray-50 cursor-pointer transition-colors'
                          >
                            <div className='flex items-center justify-between'>
                              <div className='flex-1'>
                                <div className='flex items-center gap-3'>
                                  <h3 className='font-semibold text-lg'>
                                    {ratio.label}
                                  </h3>
                                  <span className='px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full'>
                                    {ratio.sizes?.length || 0} sizes
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 text-xs rounded ${
                                      ratio.orientation === 'portrait'
                                        ? 'bg-blue-100 text-blue-700'
                                        : ratio.orientation === 'landscape'
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-purple-100 text-purple-700'
                                    }`}
                                  >
                                    {ratio.orientation}
                                  </span>
                                </div>
                                <p className='text-sm text-gray-500 mt-1'>
                                  Ratio: {ratio.width_ratio}:
                                  {ratio.height_ratio} • Click to view all sizes
                                  and add new ones
                                </p>
                              </div>
                              <div className='flex items-center gap-2 ml-4'>
                                <Eye className='w-5 h-5 text-gray-400' />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Tags Tab */}
                <TabsContent value='tags' className='space-y-6 mt-0'>
                  <div className='bg-white rounded-lg border border-gray-200'>
                    <div className='p-6 border-b border-gray-200 flex items-center justify-between'>
                      <div>
                        <h2
                          className="font-['Bricolage_Grotesque',_sans-serif] mb-1"
                          style={{ fontSize: '20px', fontWeight: '600' }}
                        >
                          Product Tags
                        </h2>
                        <p className='text-sm text-gray-600'>
                          Manage tags for products and art collections
                        </p>
                      </div>
                      <Button
                        onClick={() => setShowAddTag(true)}
                        className='bg-[#f63a9e] hover:bg-[#e02d8d] gap-2'
                      >
                        <Plus className='w-4 h-4' />
                        Add Tag
                      </Button>
                    </div>

                    {tagsLoading ? (
                      <div className='p-8 text-center text-gray-500'>
                        <RefreshCw className='w-6 h-6 animate-spin mx-auto mb-2' />
                        Loading tags...
                      </div>
                    ) : tags.length === 0 ? (
                      <div className='p-8 text-center text-gray-500'>
                        No tags found. Add your first tag to get started.
                      </div>
                    ) : (
                      <div className='divide-y divide-gray-200'>
                        {tags.map(tag => (
                          <div
                            key={tag.id}
                            className='p-4 hover:bg-gray-50 transition-colors'
                          >
                            <div className='flex items-center justify-between'>
                              <div className='flex-1'>
                                <div className='flex items-center gap-3'>
                                  <span
                                    className='px-3 py-1 rounded-full text-sm font-medium text-white'
                                    style={{ backgroundColor: tag.color }}
                                  >
                                    {tag.name}
                                  </span>
                                  <span className='text-sm text-gray-500'>
                                    {tag.slug}
                                  </span>
                                </div>
                                {tag.description && (
                                  <p className='text-sm text-gray-500 mt-1 ml-1'>
                                    {tag.description}
                                  </p>
                                )}
                              </div>
                              <div className='flex items-center gap-2 ml-4'>
                                <button
                                  onClick={() => setEditingTag(tag)}
                                  className='p-2 text-gray-600 hover:text-[#f63a9e] hover:bg-pink-50 rounded-lg transition-colors'
                                  title='Edit'
                                >
                                  <Edit className='w-4 h-4' />
                                </button>
                                <button
                                  onClick={() => handleDeleteTag(tag.id)}
                                  className='p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                                  title='Delete'
                                >
                                  <Trash2 className='w-4 h-4' />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Canvas Tab */}
                <TabsContent value='canvas' className='mt-0'>
                  <div className='bg-white rounded-lg border border-gray-200 p-6'>
                    <h2
                      className="font-['Bricolage_Grotesque',_sans-serif] mb-6"
                      style={{ fontSize: '20px', fontWeight: '600' }}
                    >
                      Canvas Settings
                    </h2>
                    <p className='text-gray-600'>
                      Canvas configuration coming soon...
                    </p>
                  </div>
                </TabsContent>

                {/* Frames Tab */}
                <TabsContent value='frames' className='mt-0'>
                  <div className='bg-white rounded-lg border border-gray-200 p-6'>
                    <h2
                      className="font-['Bricolage_Grotesque',_sans-serif] mb-6"
                      style={{ fontSize: '20px', fontWeight: '600' }}
                    >
                      Frame Settings
                    </h2>
                    <p className='text-gray-600'>
                      Frame configuration coming soon...
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* General Settings */}
            <TabsContent value='general' className='space-y-6 mt-0'>
              <div className='bg-white rounded-lg border border-gray-200 p-6'>
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] mb-6"
                  style={{ fontSize: '20px', fontWeight: '600' }}
                >
                  Store Information
                </h2>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='storeName'>Store Name</Label>
                    <Input id='storeName' defaultValue='Photify' />
                  </div>
                  <div>
                    <Label htmlFor='storeEmail'>Store Email</Label>
                    <Input
                      id='storeEmail'
                      type='email'
                      defaultValue='hello@photify.com'
                    />
                  </div>
                  <div>
                    <Label htmlFor='storePhone'>Phone Number</Label>
                    <Input
                      id='storePhone'
                      type='tel'
                      defaultValue='+44 20 1234 5678'
                    />
                  </div>
                  <div>
                    <Label htmlFor='storeAddress'>Store Address</Label>
                    <Textarea
                      id='storeAddress'
                      defaultValue='123 Art Street, London, UK'
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-lg border border-gray-200 p-6'>
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] mb-6"
                  style={{ fontSize: '20px', fontWeight: '600' }}
                >
                  Business Hours
                </h2>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Monday - Friday</p>
                      <p className='text-sm text-gray-600'>9:00 AM - 6:00 PM</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Saturday</p>
                      <p className='text-sm text-gray-600'>
                        10:00 AM - 4:00 PM
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Sunday</p>
                      <p className='text-sm text-gray-600'>Closed</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Shipping Settings */}
            <TabsContent value='shipping' className='space-y-6 mt-0'>
              <div className='bg-white rounded-lg border border-gray-200 p-6'>
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] mb-6"
                  style={{ fontSize: '20px', fontWeight: '600' }}
                >
                  Shipping Options
                </h2>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
                    <div>
                      <p className='font-medium'>Standard Delivery</p>
                      <p className='text-sm text-gray-600'>5-7 business days</p>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Input
                        type='number'
                        defaultValue='4.99'
                        className='w-24'
                      />
                      <Switch defaultChecked />
                    </div>
                  </div>
                  <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
                    <div>
                      <p className='font-medium'>Express Delivery</p>
                      <p className='text-sm text-gray-600'>2-3 business days</p>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Input
                        type='number'
                        defaultValue='9.99'
                        className='w-24'
                      />
                      <Switch defaultChecked />
                    </div>
                  </div>
                  <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
                    <div>
                      <p className='font-medium'>Free Shipping</p>
                      <p className='text-sm text-gray-600'>Orders over £100</p>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Input
                        type='number'
                        defaultValue='100'
                        className='w-24'
                      />
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-lg border border-gray-200 p-6'>
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] mb-6"
                  style={{ fontSize: '20px', fontWeight: '600' }}
                >
                  Processing Time
                </h2>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='customProducts'>
                      Custom Products (days)
                    </Label>
                    <Input id='customProducts' type='number' defaultValue='3' />
                  </div>
                  <div>
                    <Label htmlFor='artCollection'>Art Collection (days)</Label>
                    <Input id='artCollection' type='number' defaultValue='1' />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Payment Settings */}
            <TabsContent value='payment' className='space-y-6 mt-0'>
              <div className='bg-white rounded-lg border border-gray-200 p-6'>
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] mb-6"
                  style={{ fontSize: '20px', fontWeight: '600' }}
                >
                  Payment Methods
                </h2>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
                    <div className='flex items-center gap-3'>
                      <div className='w-12 h-8 bg-gray-100 rounded flex items-center justify-center'>
                        <span className='text-xs font-semibold'>VISA</span>
                      </div>
                      <div>
                        <p className='font-medium'>Credit Card</p>
                        <p className='text-sm text-gray-600'>
                          Visa, Mastercard, Amex
                        </p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
                    <div className='flex items-center gap-3'>
                      <div className='w-12 h-8 bg-gray-100 rounded flex items-center justify-center'>
                        <span className='text-xs font-semibold'>PP</span>
                      </div>
                      <div>
                        <p className='font-medium'>PayPal</p>
                        <p className='text-sm text-gray-600'>
                          Secure online payments
                        </p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
                    <div className='flex items-center gap-3'>
                      <div className='w-12 h-8 bg-gray-100 rounded flex items-center justify-center'>
                        <span className='text-xs font-semibold'>GPay</span>
                      </div>
                      <div>
                        <p className='font-medium'>Google Pay</p>
                        <p className='text-sm text-gray-600'>Fast checkout</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-lg border border-gray-200 p-6'>
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] mb-6"
                  style={{ fontSize: '20px', fontWeight: '600' }}
                >
                  Tax Settings
                </h2>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='taxRate'>Default Tax Rate (%)</Label>
                    <Input id='taxRate' type='number' defaultValue='20' />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Include tax in prices</p>
                      <p className='text-sm text-gray-600'>
                        Display prices with tax included
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value='notifications' className='space-y-6 mt-0'>
              <div className='bg-white rounded-lg border border-gray-200 p-6'>
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] mb-6"
                  style={{ fontSize: '20px', fontWeight: '600' }}
                >
                  Email Notifications
                </h2>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>New Orders</p>
                      <p className='text-sm text-gray-600'>
                        Receive email for new orders
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Low Stock Alerts</p>
                      <p className='text-sm text-gray-600'>
                        Alert when products are low in stock
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Customer Reviews</p>
                      <p className='text-sm text-gray-600'>
                        Notify when customers leave reviews
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Daily Summary</p>
                      <p className='text-sm text-gray-600'>
                        Daily sales and order summary
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-lg border border-gray-200 p-6'>
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] mb-6"
                  style={{ fontSize: '20px', fontWeight: '600' }}
                >
                  Customer Notifications
                </h2>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Order Confirmation</p>
                      <p className='text-sm text-gray-600'>
                        Send email when order is placed
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Shipping Updates</p>
                      <p className='text-sm text-gray-600'>
                        Send tracking information
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Delivery Confirmation</p>
                      <p className='text-sm text-gray-600'>
                        Notify when order is delivered
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Save Button */}
            <div className='flex items-center gap-4 mt-8'>
              <Button
                onClick={handleSave}
                disabled={loading}
                className='bg-[#f63a9e] hover:bg-[#e02d8d] gap-2'
                style={{ height: '50px' }}
              >
                {loading ? (
                  <>
                    <RefreshCw className='w-5 h-5 animate-spin' />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className='w-5 h-5' />
                    Save All Changes
                  </>
                )}
              </Button>
              <Button variant='outline' style={{ height: '50px' }}>
                Cancel
              </Button>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Add Size Dialog */}
      <Dialog open={showAddSize} onOpenChange={setShowAddSize}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '24px', fontWeight: '600' }}
            >
              Add Size to {selectedRatio?.label}
            </DialogTitle>
            <DialogDescription>
              Enter the height and we&apos;ll calculate the width based on{' '}
              {selectedRatio?.width_ratio}:{selectedRatio?.height_ratio} ratio
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 mt-4'>
            <div>
              <Label htmlFor='height'>Height (inches)</Label>
              <div className='flex gap-2'>
                <Input
                  id='height'
                  type='number'
                  placeholder='Enter height (e.g., 12)'
                  value={newSize.height}
                  onChange={e =>
                    setNewSize({ ...newSize, height: e.target.value })
                  }
                  className='flex-1'
                />
              </div>
              <p className='text-xs text-gray-500 mt-1'>
                Width will be calculated automatically
              </p>
            </div>

            {calculatedWidth && showConfirmSize && (
              <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                <p className='text-sm font-medium text-blue-900 mb-2'>
                  📐 Calculated Dimensions:
                </p>
                <p className='text-lg font-semibold text-blue-700'>
                  {calculatedWidth}&quot; × {newSize.height}&quot;
                </p>
                <p className='text-xs text-blue-600 mt-1'>
                  Based on {selectedRatio?.width_ratio}:
                  {selectedRatio?.height_ratio} aspect ratio
                </p>
              </div>
            )}

            <div className='flex gap-3 pt-4'>
              {!showConfirmSize ? (
                <>
                  <Button
                    onClick={() =>
                      selectedRatio &&
                      calculateWidth(newSize.height, selectedRatio)
                    }
                    disabled={!newSize.height || !selectedRatio}
                    className='flex-1 bg-[#f63a9e] hover:bg-[#e02d8d]'
                  >
                    Calculate Width
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setShowAddSize(false);
                      setNewSize({ height: '', unit: 'inches' });
                      setCalculatedWidth(null);
                      setShowConfirmSize(false);
                    }}
                    className='flex-1'
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleConfirmSize}
                    className='flex-1 bg-green-600 hover:bg-green-700'
                  >
                    ✓ Confirm & Add
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setCalculatedWidth(null);
                      setShowConfirmSize(false);
                    }}
                    className='flex-1'
                  >
                    ← Back
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Ratio Dialog */}
      <Dialog open={showAddRatio} onOpenChange={setShowAddRatio}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '24px', fontWeight: '600' }}
            >
              Add New Aspect Ratio
            </DialogTitle>
            <DialogDescription>
              Create a new aspect ratio for your products
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 mt-4'>
            <div>
              <Label htmlFor='ratioLabel'>
                Label (e.g., 2:3 Portrait, 16:9 Landscape)
              </Label>
              <Input
                id='ratioLabel'
                placeholder='2:3 Portrait'
                value={newRatio.label}
                onChange={e =>
                  setNewRatio({ ...newRatio, label: e.target.value })
                }
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <Label htmlFor='widthRatio'>Width Ratio</Label>
                <Input
                  id='widthRatio'
                  type='number'
                  placeholder='2'
                  value={newRatio.width_ratio}
                  onChange={e =>
                    setNewRatio({ ...newRatio, width_ratio: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor='heightRatio'>Height Ratio</Label>
                <Input
                  id='heightRatio'
                  type='number'
                  placeholder='3'
                  value={newRatio.height_ratio}
                  onChange={e =>
                    setNewRatio({ ...newRatio, height_ratio: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor='orientation'>Orientation</Label>
              <select
                id='orientation'
                value={newRatio.orientation}
                onChange={e =>
                  setNewRatio({ ...newRatio, orientation: e.target.value })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md'
              >
                <option value='portrait'>Portrait</option>
                <option value='landscape'>Landscape</option>
                <option value='square'>Square</option>
              </select>
            </div>
            <div className='flex gap-3 pt-4'>
              <Button
                onClick={handleAddRatio}
                disabled={
                  !newRatio.label ||
                  !newRatio.width_ratio ||
                  !newRatio.height_ratio
                }
                className='flex-1 bg-[#f63a9e] hover:bg-[#e02d8d]'
              >
                Add Ratio
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  setShowAddRatio(false);
                  setNewRatio({
                    label: '',
                    width_ratio: '',
                    height_ratio: '',
                    orientation: 'portrait',
                  });
                }}
                className='flex-1'
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ratio Detail Dialog */}
      <Dialog open={showRatioDetail} onOpenChange={setShowRatioDetail}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '24px', fontWeight: '600' }}
            >
              {selectedRatio?.label}
            </DialogTitle>
            <DialogDescription>
              All available sizes for this aspect ratio (
              {selectedRatio?.width_ratio}:{selectedRatio?.height_ratio})
            </DialogDescription>
          </DialogHeader>
          <div className='mt-4'>
            <div className='mb-4 flex justify-end'>
              <Button
                onClick={() => {
                  setShowRatioDetail(false);
                  setShowAddSize(true);
                }}
                className='bg-[#f63a9e] hover:bg-[#e02d8d] gap-2'
              >
                <Plus className='w-4 h-4' />
                Add Size
              </Button>
            </div>

            {selectedRatio?.sizes && selectedRatio.sizes.length > 0 ? (
              <div className='bg-white border border-gray-200 rounded-lg divide-y divide-gray-200'>
                {selectedRatio.sizes.map((size: Size, idx: number) => (
                  <div
                    key={size.id}
                    className='flex items-center justify-between p-4 hover:bg-gray-50 transition-colors'
                  >
                    <div className='flex items-center gap-3'>
                      <span className='text-sm text-gray-500 font-mono w-8'>
                        #{idx + 1}
                      </span>
                      <div>
                        <span className='font-medium text-lg'>
                          {size.display_label}
                        </span>
                        <p className='text-xs text-gray-500 mt-0.5'>
                          {size.width_in}&quot; × {size.height_in}&quot; • Area:{' '}
                          {size.area_in2} in²
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-12 bg-gray-50 rounded-lg border border-gray-200'>
                <p className='text-gray-600 mb-4'>No sizes added yet</p>
                <Button
                  onClick={() => {
                    setShowRatioDetail(false);
                    setShowAddSize(true);
                  }}
                  className='bg-[#f63a9e] hover:bg-[#e02d8d] gap-2'
                >
                  <Plus className='w-4 h-4' />
                  Add First Size
                </Button>
              </div>
            )}

            <Button
              onClick={() => setShowRatioDetail(false)}
              variant='outline'
              className='w-full mt-6'
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Tag Dialog */}
      <Dialog open={showAddTag} onOpenChange={setShowAddTag}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '24px', fontWeight: '600' }}
            >
              Add New Tag
            </DialogTitle>
            <DialogDescription>
              Create a new tag that can be assigned to products and art
              collections
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 mt-4'>
            <div>
              <Label htmlFor='tagName'>Tag Name</Label>
              <Input
                id='tagName'
                placeholder='Best Seller'
                value={newTag.name}
                onChange={e => {
                  const name = e.target.value;
                  setNewTag({ ...newTag, name, slug: generateSlug(name) });
                }}
              />
            </div>
            <div>
              <Label htmlFor='tagSlug'>Slug (URL-friendly)</Label>
              <Input
                id='tagSlug'
                placeholder='best-seller'
                value={newTag.slug}
                onChange={e => setNewTag({ ...newTag, slug: e.target.value })}
              />
              <p className='text-xs text-gray-500 mt-1'>
                Auto-generated from name, or customize it
              </p>
            </div>
            <div>
              <Label htmlFor='tagColor'>Badge Color</Label>
              <div className='flex gap-2'>
                <Input
                  id='tagColor'
                  type='color'
                  value={newTag.color}
                  onChange={e =>
                    setNewTag({ ...newTag, color: e.target.value })
                  }
                  className='w-20 h-10'
                />
                <Input
                  type='text'
                  value={newTag.color}
                  onChange={e =>
                    setNewTag({ ...newTag, color: e.target.value })
                  }
                  placeholder='#f63a9e'
                  className='flex-1'
                />
              </div>
            </div>
            <div>
              <Label htmlFor='tagDescription'>Description (Optional)</Label>
              <Textarea
                id='tagDescription'
                placeholder='Describe what this tag represents...'
                value={newTag.description}
                onChange={e =>
                  setNewTag({ ...newTag, description: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className='flex gap-3 pt-4'>
              <Button
                onClick={handleAddTag}
                disabled={!newTag.name || !newTag.slug}
                className='flex-1 bg-[#f63a9e] hover:bg-[#e02d8d]'
              >
                Add Tag
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  setShowAddTag(false);
                  setNewTag({
                    name: '',
                    slug: '',
                    color: '#f63a9e',
                    description: '',
                  });
                }}
                className='flex-1'
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog
        open={!!editingTag}
        onOpenChange={open => !open && setEditingTag(null)}
      >
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '24px', fontWeight: '600' }}
            >
              Edit Tag
            </DialogTitle>
            <DialogDescription>Update tag information</DialogDescription>
          </DialogHeader>
          {editingTag && (
            <div className='space-y-4 mt-4'>
              <div>
                <Label htmlFor='editTagName'>Tag Name</Label>
                <Input
                  id='editTagName'
                  value={editingTag.name}
                  onChange={e => {
                    const name = e.target.value;
                    setEditingTag({
                      ...editingTag,
                      name,
                      slug: generateSlug(name),
                    });
                  }}
                />
              </div>
              <div>
                <Label htmlFor='editTagSlug'>Slug (URL-friendly)</Label>
                <Input
                  id='editTagSlug'
                  value={editingTag.slug}
                  onChange={e =>
                    setEditingTag({ ...editingTag, slug: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor='editTagColor'>Badge Color</Label>
                <div className='flex gap-2'>
                  <Input
                    id='editTagColor'
                    type='color'
                    value={editingTag.color}
                    onChange={e =>
                      setEditingTag({ ...editingTag, color: e.target.value })
                    }
                    className='w-20 h-10'
                  />
                  <Input
                    type='text'
                    value={editingTag.color}
                    onChange={e =>
                      setEditingTag({ ...editingTag, color: e.target.value })
                    }
                    className='flex-1'
                  />
                </div>
              </div>
              <div>
                <Label htmlFor='editTagDescription'>
                  Description (Optional)
                </Label>
                <Textarea
                  id='editTagDescription'
                  value={editingTag.description || ''}
                  onChange={e =>
                    setEditingTag({
                      ...editingTag,
                      description: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>
              <div className='flex gap-3 pt-4'>
                <Button
                  onClick={handleUpdateTag}
                  disabled={!editingTag.name || !editingTag.slug}
                  className='flex-1 bg-[#f63a9e] hover:bg-[#e02d8d]'
                >
                  Save Changes
                </Button>
                <Button
                  variant='outline'
                  onClick={() => setEditingTag(null)}
                  className='flex-1'
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
