import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Save,
  Tag as TagIcon,
  ImageOff,
  X,
  Sparkles,
  Upload,
  Trash2,
  Images as ImagesIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface ArtPhoto {
  id: string;
  name: string;
  description: string | null;
  /** Original art image (the gallery thumbnail). */
  image: string;
  /** Mockup image URLs the admin has uploaded for this art. */
  mockups: string[];
  tag_ids: string[];
}

interface AdminArtPhotoEditModalProps {
  open: boolean;
  photo: ArtPhoto;
  allTags: Tag[];
  onClose: () => void;
  onSave: (updates: {
    name: string;
    description: string;
    tagIds: string[];
  }) => void | Promise<void>;
  /** Called whenever the mockup list changes (upload / delete). */
  onMockupsChange: (newMockups: string[]) => void;
}

const MOCKUP_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
const MOCKUP_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/** Extracts the in-bucket key from a Supabase `photify` public URL. */
function storageKeyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = '/storage/v1/object/public/photify/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const key = url.slice(idx + marker.length).split('?')[0];
  return key || null;
}

export function AdminArtPhotoEditModal({
  open,
  photo,
  allTags,
  onClose,
  onSave,
  onMockupsChange,
}: AdminArtPhotoEditModalProps) {
  const supabase = createClient();
  const mockupInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState(photo.name);
  const [description, setDescription] = useState(photo.description || '');
  const [tagIds, setTagIds] = useState<string[]>(photo.tag_ids);
  const [mockups, setMockups] = useState<string[]>(photo.mockups);
  const [saving, setSaving] = useState(false);
  const [uploadingMockups, setUploadingMockups] = useState(0);
  const [deletingMockup, setDeletingMockup] = useState<string | null>(null);

  useEffect(() => {
    setName(photo.name);
    setDescription(photo.description || '');
    setTagIds(photo.tag_ids);
    setMockups(photo.mockups);
  }, [photo.id, photo.name, photo.description, photo.tag_ids, photo.mockups]);

  const toggleTag = (id: string) => {
    setTagIds(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const isDirty =
    name.trim() !== photo.name ||
    description.trim() !== (photo.description ?? '').trim() ||
    tagIds.length !== photo.tag_ids.length ||
    tagIds.some(id => !photo.tag_ids.includes(id));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ name, description, tagIds });
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // Mockup upload / delete (immediate, no Save needed)
  // --------------------------------------------------------------------------

  const persistMockups = async (next: string[]) => {
    // Mockups live as `images.slice(1)` — index 0 is always the original art.
    const newImages = [photo.image, ...next];
    const { error } = await supabase
      .from('art_products')
      .update({ images: newImages })
      .eq('id', photo.id);
    if (error) throw error;
  };

  const handleMockupFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter(file => {
      if (!MOCKUP_ACCEPT.split(',').includes(file.type)) {
        toast.error(`${file.name}: unsupported file type`);
        return false;
      }
      if (file.size > MOCKUP_MAX_BYTES) {
        toast.error(`${file.name}: exceeds 10 MB`);
        return false;
      }
      return true;
    });

    if (files.length === 0) return;

    setUploadingMockups(prev => prev + files.length);

    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const key = `art-product-mockups/${photo.id}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 9)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('photify')
          .upload(key, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('photify').getPublicUrl(key);

        uploadedUrls.push(publicUrl);
      } catch (error: any) {
        console.error('Mockup upload failed:', error);
        toast.error(error?.message || `Failed to upload ${file.name}`);
      } finally {
        setUploadingMockups(prev => Math.max(0, prev - 1));
      }
    }

    if (uploadedUrls.length > 0) {
      const next = [...mockups, ...uploadedUrls];
      try {
        await persistMockups(next);
        setMockups(next);
        onMockupsChange(next);
        toast.success(
          `${uploadedUrls.length} mockup${uploadedUrls.length === 1 ? '' : 's'} added`
        );
      } catch (error: any) {
        console.error('Failed to save mockups:', error);
        toast.error(error?.message || 'Failed to save mockups');
      }
    }
  };

  const onMockupInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMockupFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDeleteMockup = async (url: string) => {
    setDeletingMockup(url);
    const next = mockups.filter(m => m !== url);
    try {
      await persistMockups(next);
      setMockups(next);
      onMockupsChange(next);

      // Best-effort: remove the underlying file from storage so we don't
      // accumulate orphans. Don't fail the UX if this errors.
      const key = storageKeyFromUrl(url);
      if (key) {
        const { error: storageError } = await supabase.storage
          .from('photify')
          .remove([key]);
        if (storageError) {
          console.warn('Mockup storage cleanup failed:', storageError);
        }
      }

      toast.success('Mockup removed');
    } catch (error: any) {
      console.error('Failed to remove mockup:', error);
      toast.error(error?.message || 'Failed to remove mockup');
    } finally {
      setDeletingMockup(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={openNext => {
        if (!openNext) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className='p-0 gap-0 overflow-hidden border-0 rounded-2xl shadow-2xl w-[calc(100%-2rem)] sm:!max-w-[980px] max-h-[90vh]'
      >
        <div className='grid md:grid-cols-[1.2fr_1fr] max-h-[90vh]'>
          {/* ========== Left: Image preview ========== */}
          <div className='relative bg-gray-950 min-h-[280px] md:min-h-[600px] overflow-hidden'>
            {photo.image ? (
              <>
                {/* Blurred backdrop fills the panel */}
                <div
                  className='absolute inset-0 bg-cover bg-center scale-110 opacity-60 blur-2xl'
                  style={{ backgroundImage: `url(${photo.image})` }}
                  aria-hidden
                />
                <div className='absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/50' />

                {/* Centered, contained image */}
                <div className='relative h-full w-full flex items-center justify-center p-6'>
                  <img
                    src={photo.image}
                    alt={photo.name}
                    className='max-h-full max-w-full object-contain rounded-lg shadow-2xl'
                  />
                </div>
              </>
            ) : (
              <div className='absolute inset-0 flex flex-col items-center justify-center text-gray-500'>
                <ImageOff className='w-10 h-10 mb-2' />
                <span className='text-sm'>No image</span>
              </div>
            )}
          </div>

          {/* ========== Right: Form ========== */}
          <div className='flex flex-col bg-white max-h-[90vh] min-h-[280px]'>
            {/* Header */}
            <div className='flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-gray-100'>
              <div className='min-w-0'>
                <div className='flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#f63a9e] mb-1'>
                  <Sparkles className='w-3 h-3' />
                  Photo details
                </div>
                <h2 className="font-['Bricolage_Grotesque',_sans-serif] text-xl font-semibold text-gray-900 truncate">
                  {name.trim() || 'Untitled'}
                </h2>
                <p className='text-xs text-gray-500 mt-1'>
                  Update searchable details and upload mockups for this photo.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label='Close'
                className='flex-shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors'
              >
                <X className='w-4 h-4' />
              </button>
            </div>

            {/* Scrollable form body */}
            <div className='flex-1 overflow-y-auto px-6 py-5 space-y-5'>
              <div>
                <Label
                  htmlFor='photo-name'
                  className='text-xs font-semibold text-gray-700 uppercase tracking-wider'
                >
                  Name
                </Label>
                <Input
                  id='photo-name'
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder='e.g. Sunset over the mountains'
                  className='mt-1.5 h-10'
                />
              </div>

              <div>
                <Label
                  htmlFor='photo-description'
                  className='text-xs font-semibold text-gray-700 uppercase tracking-wider'
                >
                  Description
                </Label>
                <Textarea
                  id='photo-description'
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder='Describe the scene, mood, or style…'
                  rows={4}
                  className='mt-1.5 resize-none'
                />
                <p className='text-[11px] text-gray-500 mt-1.5 leading-relaxed'>
                  Optional. Helps customers find this photo via search.
                </p>
              </div>

              {/* ===== Mockups section ===== */}
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <Label className='flex items-center gap-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                    <ImagesIcon className='w-3 h-3' />
                    Mockups
                  </Label>
                  <span className='text-[11px] text-gray-500'>
                    {mockups.length}
                    {uploadingMockups > 0 && (
                      <span className='ml-1 text-[#f63a9e] inline-flex items-center gap-0.5'>
                        <Loader2 className='w-2.5 h-2.5 animate-spin' />
                        +{uploadingMockups}
                      </span>
                    )}
                  </span>
                </div>

                <p className='text-[11px] text-gray-500 mb-2 leading-relaxed'>
                  Upload finished mockup photos showing this artwork on a
                  wall. Customers see them as a 1-second auto-slideshow when
                  previewing.
                </p>

                <input
                  ref={mockupInputRef}
                  type='file'
                  accept={MOCKUP_ACCEPT}
                  multiple
                  className='hidden'
                  onChange={onMockupInputChange}
                />

                {mockups.length === 0 && uploadingMockups === 0 ? (
                  <button
                    type='button'
                    onClick={() => mockupInputRef.current?.click()}
                    className='w-full flex flex-col items-center justify-center gap-1.5 py-6 text-center rounded-lg border-2 border-dashed border-gray-200 hover:border-[#f63a9e] hover:bg-pink-50/40 transition-colors'
                  >
                    <div className='w-9 h-9 rounded-full bg-pink-50 text-[#f63a9e] flex items-center justify-center'>
                      <Upload className='w-4 h-4' />
                    </div>
                    <p className='text-sm font-medium text-gray-700'>
                      Upload mockups
                    </p>
                    <p className='text-[11px] text-gray-500'>
                      JPG, PNG, WebP or GIF · max 10 MB each
                    </p>
                  </button>
                ) : (
                  <div className='space-y-2'>
                    <div className='grid grid-cols-3 gap-2'>
                      {mockups.map(url => (
                        <div
                          key={url}
                          className='group relative aspect-[4/3] rounded-md overflow-hidden bg-gray-100 border border-gray-200'
                        >
                          <img
                            src={url}
                            alt='mockup'
                            loading='lazy'
                            className='w-full h-full object-cover'
                          />
                          <div className='absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors' />
                          <button
                            onClick={() => handleDeleteMockup(url)}
                            disabled={deletingMockup === url}
                            aria-label='Remove mockup'
                            className='absolute top-1 right-1 p-1 rounded-md bg-white/95 text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 shadow-sm disabled:opacity-50'
                          >
                            {deletingMockup === url ? (
                              <Loader2 className='w-3 h-3 animate-spin' />
                            ) : (
                              <Trash2 className='w-3 h-3' />
                            )}
                          </button>
                        </div>
                      ))}
                      {Array.from({ length: uploadingMockups }).map((_, i) => (
                        <div
                          key={`upload-skeleton-${i}`}
                          className='aspect-[4/3] rounded-md bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400'
                        >
                          <Loader2 className='w-4 h-4 animate-spin' />
                        </div>
                      ))}
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => mockupInputRef.current?.click()}
                      className='w-full gap-1.5 border-dashed'
                    >
                      <Upload className='w-3.5 h-3.5' />
                      Add more mockups
                    </Button>
                  </div>
                )}
              </div>

              {/* ===== Tags section ===== */}
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <Label className='flex items-center gap-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                    <TagIcon className='w-3 h-3' />
                    Tags
                  </Label>
                  {tagIds.length > 0 && (
                    <span className='text-[11px] text-gray-500'>
                      {tagIds.length} selected
                    </span>
                  )}
                </div>

                {allTags.length === 0 ? (
                  <div className='rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center'>
                    <TagIcon className='w-5 h-5 text-gray-400 mx-auto mb-1.5' />
                    <p className='text-sm text-gray-700 font-medium mb-0.5'>
                      No tags yet
                    </p>
                    <p className='text-xs text-gray-500'>
                      Create tags in Settings → Products → Tags first.
                    </p>
                  </div>
                ) : (
                  <div className='flex flex-wrap gap-1.5'>
                    {allTags.map(tag => {
                      const active = tagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type='button'
                          onClick={() => toggleTag(tag.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                            active
                              ? 'text-white border-transparent shadow-sm'
                              : 'text-gray-700 border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                          }`}
                          style={
                            active
                              ? { backgroundColor: tag.color }
                              : undefined
                          }
                        >
                          {active && (
                            <span className='w-1.5 h-1.5 rounded-full bg-white' />
                          )}
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Sticky footer */}
            <div className='flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50'>
              <Button
                variant='ghost'
                onClick={onClose}
                disabled={saving}
                className='h-10 text-gray-700 hover:bg-gray-100'
              >
                Close
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !isDirty}
                className='h-10 px-4 bg-[#f63a9e] hover:bg-[#e02d8d] disabled:opacity-50 disabled:cursor-not-allowed text-white gap-2 shadow-sm'
              >
                {saving ? (
                  <>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className='w-4 h-4' />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
