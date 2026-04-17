import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from './admin-layout';
import {
  Save,
  RefreshCw,
  Store,
  Package,
  Plus,
  Edit,
  Eye,
  Trash2,
  DollarSign,
  Loader2,
  Ruler,
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
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const navigate = useNavigate();
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
  const [savingNewSize, setSavingNewSize] = useState(false);
  const [deletingSizeId, setDeletingSizeId] = useState<string | null>(null);
  const [deleteSizeTarget, setDeleteSizeTarget] = useState<Size | null>(null);
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null);
  const [tagDeleteBusy, setTagDeleteBusy] = useState(false);

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

  const fetchRatios = async (): Promise<AspectRatio[] | undefined> => {
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
      const ratiosWithSizes = (ratiosData ?? []).map(ratio => ({
        ...ratio,
        sizes: (sizesData ?? []).filter(
          size => size.aspect_ratio_id === ratio.id
        ),
      }));

      setRatios(ratiosWithSizes);
      return ratiosWithSizes;
    } catch (error: any) {
      toast.error('Failed to load ratios: ' + error.message);
      return undefined;
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

  const newSizePreview = useMemo(() => {
    if (!selectedRatio?.width_ratio || !selectedRatio?.height_ratio) return null;
    const h = parseFloat(newSize.height);
    if (Number.isNaN(h) || h <= 0) return null;
    const wRaw =
      (h * selectedRatio.width_ratio) / selectedRatio.height_ratio;
    const wIn = Math.round(wRaw);
    const hIn = Math.round(h);
    return {
      wIn,
      hIn,
      displayLabel: `${wIn}" × ${hIn}"`,
    };
  }, [newSize.height, selectedRatio]);

  const resetAddSizeForm = () => {
    setNewSize({ height: '', unit: 'inches' });
    setSavingNewSize(false);
  };

  const handleConfirmSize = async () => {
    if (!selectedRatio || !newSizePreview) return;

    setSavingNewSize(true);
    try {
      const { error } = await supabase
        .from('sizes')
        .insert([
          {
            aspect_ratio_id: selectedRatio.id,
            width_in: newSizePreview.wIn,
            height_in: newSizePreview.hIn,
            display_label: newSizePreview.displayLabel,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const nextRatios = await fetchRatios();
      const updatedRatio = nextRatios?.find(r => r.id === selectedRatio.id);
      if (updatedRatio) setSelectedRatio(updatedRatio);

      resetAddSizeForm();
      setShowAddSize(false);
      toast.success('Size added successfully!');
    } catch (error: any) {
      toast.error('Failed to add size: ' + error.message);
    } finally {
      setSavingNewSize(false);
    }
  };

  const executeDeleteSize = async (size: Size) => {
    setDeletingSizeId(size.id);
    try {
      const { error } = await supabase.from('sizes').delete().eq('id', size.id);
      if (error) throw error;

      const nextRatios = await fetchRatios();
      if (selectedRatio && nextRatios) {
        const updated = nextRatios.find(r => r.id === selectedRatio.id);
        if (updated) setSelectedRatio(updated);
      }
      toast.success('Size removed');
      setDeleteSizeTarget(null);
    } catch (error: any) {
      toast.error('Failed to remove size: ' + error.message);
    } finally {
      setDeletingSizeId(null);
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

  const executeDeleteTag = async (tagId: string) => {
    setTagDeleteBusy(true);
    try {
      const { error } = await supabase.from('tags').delete().eq('id', tagId);

      if (error) throw error;

      await fetchTags();
      toast.success('Tag deleted successfully!');
      setDeleteTagId(null);
    } catch (error: any) {
      toast.error('Failed to delete tag: ' + error.message);
    } finally {
      setTagDeleteBusy(false);
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
                  <TabsTrigger value='pricing' className='px-6'>
                    Pricing
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
                                  onClick={() => setDeleteTagId(tag.id)}
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

                {/* Pricing Tab */}
                <TabsContent value='pricing' className='mt-0'>
                  <div className='bg-white rounded-lg border border-gray-200 p-6'>
                    <div className='flex items-start justify-between mb-6'>
                      <div>
                        <h2
                          className="font-['Bricolage_Grotesque',_sans-serif] mb-1"
                          style={{ fontSize: '20px', fontWeight: '600' }}
                        >
                          Size Pricing Manager
                        </h2>
                        <p className='text-sm text-gray-600'>
                          Set fixed prices for each canvas size globally
                        </p>
                      </div>
                      <Button
                        onClick={() => navigate('/admin/settings/size-pricing')}
                        className='bg-[#f63a9e] hover:bg-[#e02d8d] gap-2'
                      >
                        <DollarSign className='w-4 h-4' />
                        Manage Pricing
                      </Button>
                    </div>

                    <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
                      <p className='text-sm text-blue-800'>
                        <strong>Fixed Pricing:</strong> Set specific prices for each size
                        that apply across all products. This replaces the base price per square
                        inch calculation.
                      </p>
                    </div>
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
      <Dialog
        open={showAddSize}
        onOpenChange={open => {
          setShowAddSize(open);
          if (!open) resetAddSizeForm();
        }}
      >
        <DialogContent className='max-w-md gap-0 p-0 overflow-hidden sm:rounded-xl z-[100]'>
          <DialogHeader className='px-5 pt-5 pb-4 border-b border-gray-100 space-y-1.5 text-left'>
            <DialogTitle className="font-['Bricolage_Grotesque',_sans-serif] text-xl font-semibold text-gray-900 pr-8">
              Add size
            </DialogTitle>
            <DialogDescription className='text-sm text-gray-600'>
              <span className='font-medium text-gray-800'>
                {selectedRatio?.label}
              </span>
              {' · '}
              {selectedRatio?.width_ratio}:{selectedRatio?.height_ratio} aspect
              ratio. Enter the{' '}
              <span className='font-medium text-gray-800'>height</span>; width
              updates live.
            </DialogDescription>
          </DialogHeader>

          <div className='px-5 py-4 space-y-5'>
            <div>
              <Label
                htmlFor='add-size-height'
                className='text-sm font-medium text-gray-800'
              >
                Height (inches)
              </Label>
              <Input
                id='add-size-height'
                type='number'
                inputMode='decimal'
                min={0.01}
                step={0.25}
                placeholder='e.g. 12'
                value={newSize.height}
                onChange={e =>
                  setNewSize({ ...newSize, height: e.target.value })
                }
                className='mt-2 h-11 border-gray-200 bg-white shadow-sm focus-visible:border-[#f63a9e] focus-visible:ring-[#f63a9e]/25 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
              />
              <p className='text-xs text-gray-500 mt-2'>
                Use the longest edge in inches for portrait or landscape sizes.
              </p>
            </div>

            {newSizePreview ? (
              <div className='rounded-xl border border-pink-100 bg-gradient-to-br from-pink-50/90 to-white px-4 py-3.5 shadow-sm'>
                <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#c21e6b]'>
                  <Ruler className='w-3.5 h-3.5' aria-hidden />
                  Resulting print size
                </div>
                <p className='mt-2 text-2xl font-semibold tabular-nums tracking-tight text-gray-900'>
                  {newSizePreview.displayLabel}
                </p>
                <p className='text-xs text-gray-500 mt-1'>
                  Stored as {newSizePreview.wIn}&quot; × {newSizePreview.hIn}
                  &quot; (whole inches)
                </p>
              </div>
            ) : newSize.height.trim() !== '' ? (
              <p className='text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2'>
                Enter a positive number for height (inches).
              </p>
            ) : null}
          </div>

          <DialogFooter className='flex-row justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/80 sm:justify-end'>
            <Button
              type='button'
              variant='outline'
              className='border-gray-200 text-gray-800 hover:bg-gray-100'
              onClick={() => setShowAddSize(false)}
              disabled={savingNewSize}
            >
              Cancel
            </Button>
            <Button
              type='button'
              className='min-w-[7.5rem] bg-[#f63a9e] hover:bg-[#e02d8d] text-white font-semibold shadow-sm disabled:opacity-50'
              disabled={!newSizePreview || savingNewSize}
              onClick={handleConfirmSize}
            >
              {savingNewSize ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Saving…
                </>
              ) : (
                'Add size'
              )}
            </Button>
          </DialogFooter>
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
        <DialogContent className='max-w-xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden sm:rounded-xl'>
          <DialogHeader className='px-5 pt-5 pb-3 border-b border-gray-100 space-y-1'>
            <div className='flex flex-wrap items-start justify-between gap-3 pr-8'>
              <div>
                <DialogTitle className="font-['Bricolage_Grotesque',_sans-serif] text-xl font-semibold text-gray-900 tracking-tight">
                  {selectedRatio?.label}
                </DialogTitle>
                <DialogDescription className='text-sm text-gray-500 mt-1'>
                  {selectedRatio?.width_ratio}:{selectedRatio?.height_ratio}{' '}
                  aspect ratio
                  {selectedRatio?.sizes && selectedRatio.sizes.length > 0
                    ? ` · ${selectedRatio.sizes.length} size${selectedRatio.sizes.length === 1 ? '' : 's'}`
                    : ''}
                </DialogDescription>
              </div>
              <Button
                size='sm'
                onClick={() => {
                  setShowRatioDetail(false);
                  setShowAddSize(true);
                }}
                className='bg-[#f63a9e] hover:bg-[#e02d8d] shrink-0 gap-1.5 h-9'
              >
                <Plus className='w-3.5 h-3.5' />
                Add size
              </Button>
            </div>
          </DialogHeader>

          <div className='flex-1 min-h-0 overflow-y-auto px-5 py-4'>
            {selectedRatio?.sizes && selectedRatio.sizes.length > 0 ? (
              <div className='rounded-lg border border-gray-200 bg-gray-50/80 overflow-hidden'>
                <div className='grid grid-cols-[2.5rem_1fr_auto_2.5rem] gap-2 items-center px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-100/90 border-b border-gray-200'>
                  <span className='text-center'>#</span>
                  <span>Dimensions</span>
                  <span className='text-right tabular-nums'>Area</span>
                  <span className='sr-only'>Remove</span>
                </div>
                <ul className='divide-y divide-gray-100 bg-white'>
                  {selectedRatio.sizes.map((size: Size, idx: number) => (
                    <li
                      key={size.id}
                      className='grid grid-cols-[2.5rem_1fr_auto_2.5rem] gap-2 items-center px-2 py-2 sm:px-3 hover:bg-gray-50/80 transition-colors'
                    >
                      <span className='flex justify-center'>
                        <span className='inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md bg-gray-100 px-1.5 text-xs font-medium text-gray-600 tabular-nums'>
                          {idx + 1}
                        </span>
                      </span>
                      <div className='min-w-0'>
                        <p className='text-sm font-medium text-gray-900 truncate'>
                          {size.display_label}
                        </p>
                      </div>
                      <span className='text-xs text-gray-600 tabular-nums text-right whitespace-nowrap'>
                        {size.area_in2 != null ? `${size.area_in2} in²` : '—'}
                      </span>
                      <div className='flex justify-end'>
                        <button
                          type='button'
                          title='Remove size'
                          disabled={deletingSizeId === size.id}
                          onClick={() => setDeleteSizeTarget(size)}
                          className='inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors'
                        >
                          {deletingSizeId === size.id ? (
                            <Loader2 className='w-4 h-4 animate-spin' />
                          ) : (
                            <Trash2 className='w-4 h-4' />
                          )}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className='text-center py-10 px-4 rounded-lg border border-dashed border-gray-200 bg-gray-50/50'>
                <p className='text-sm text-gray-600 mb-3'>No sizes for this ratio yet.</p>
                <Button
                  size='sm'
                  onClick={() => {
                    setShowRatioDetail(false);
                    setShowAddSize(true);
                  }}
                  className='bg-[#f63a9e] hover:bg-[#e02d8d] gap-2'
                >
                  <Plus className='w-3.5 h-3.5' />
                  Add first size
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className='px-5 py-3 border-t border-gray-100 bg-gray-50/50 sm:justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setShowRatioDetail(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteSizeTarget !== null}
        onOpenChange={open => {
          if (!open) setDeleteSizeTarget(null);
        }}
      >
        <AlertDialogContent className='z-[100] sm:max-w-md border-gray-200'>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-['Bricolage_Grotesque',_sans-serif] text-xl">
              Remove this size?
            </AlertDialogTitle>
            <AlertDialogDescription className='text-gray-600'>
              Remove{' '}
              <span className='font-medium text-gray-900'>
                {deleteSizeTarget?.display_label}
              </span>
              ? Product configs that reference this size may need updating.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='gap-2 sm:gap-2'>
            <AlertDialogCancel
              className='mt-0'
              disabled={deletingSizeId !== null}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              type='button'
              className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white'
              disabled={!deleteSizeTarget || deletingSizeId !== null}
              onClick={() =>
                deleteSizeTarget && executeDeleteSize(deleteSizeTarget)
              }
            >
              {deletingSizeId === deleteSizeTarget?.id ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Removing…
                </>
              ) : (
                'Remove size'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteTagId !== null}
        onOpenChange={open => {
          if (!open) setDeleteTagId(null);
        }}
      >
        <AlertDialogContent className='z-[100] sm:max-w-md border-gray-200'>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-['Bricolage_Grotesque',_sans-serif] text-xl">
              Delete this tag?
            </AlertDialogTitle>
            <AlertDialogDescription className='text-gray-600'>
              This tag will be removed from all products that use it. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='gap-2 sm:gap-2'>
            <AlertDialogCancel className='mt-0' disabled={tagDeleteBusy}>
              Cancel
            </AlertDialogCancel>
            <Button
              type='button'
              className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white'
              disabled={!deleteTagId || tagDeleteBusy}
              onClick={() => deleteTagId && executeDeleteTag(deleteTagId)}
            >
              {tagDeleteBusy ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Deleting…
                </>
              ) : (
                'Delete tag'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
