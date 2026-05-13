import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AdminLayout } from './admin-layout';
import { AdminArtPhotoEditModal } from './admin-art-photo-edit-modal';
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm-dialog';
import {
  Search,
  Upload,
  Trash2,
  Loader2,
  ImagePlus,
  Pencil,
  X,
  CheckCircle2,
  AlertCircle,
  Images,
  Tag as TagIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface ArtPhoto {
  id: string;
  name: string;
  description: string | null;
  image: string;
  images: string[];
  created_at?: string;
  tag_ids: string[];
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface UploadProgressItem {
  id: string;
  fileName: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

function prettifyFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '');
  const cleaned = base.replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Untitled';
  return cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function makeSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || 'art'}-${suffix}`;
}

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx + 1) : 'jpg';
}

/**
 * Extracts the in-bucket storage key from a Supabase public URL.
 *
 * Public URLs look like:
 *   https://<project>.supabase.co/storage/v1/object/public/photify/<key>
 * For non-photify URLs (e.g. Unsplash placeholders), returns null so the caller
 * can skip them.
 */
function storageKeyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = '/storage/v1/object/public/photify/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const key = url.slice(idx + marker.length).split('?')[0];
  return key || null;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function AdminStockImagesPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [photos, setPhotos] = useState<ArtPhoto[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);

  const [editingPhoto, setEditingPhoto] = useState<ArtPhoto | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<ArtPhoto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [uploadQueue, setUploadQueue] = useState<UploadProgressItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // --------------------------------------------------------------------------
  // Data fetching
  // --------------------------------------------------------------------------

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, tagsRes, joinRes] = await Promise.all([
        supabase
          .from('art_products')
          .select(
            'id, name, description, image, images, created_at'
          )
          .order('created_at', { ascending: false }),
        supabase.from('tags').select('id, name, slug, color').order('name'),
        supabase.from('art_product_tags').select('art_product_id, tag_id'),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (tagsRes.error) throw tagsRes.error;
      if (joinRes.error) throw joinRes.error;

      const tagsByProduct = new Map<string, string[]>();
      (joinRes.data || []).forEach(row => {
        const list = tagsByProduct.get(row.art_product_id) || [];
        list.push(row.tag_id);
        tagsByProduct.set(row.art_product_id, list);
      });

      const mapped: ArtPhoto[] = (productsRes.data || []).map(p => {
        const images: string[] =
          Array.isArray(p.images) && p.images.length > 0
            ? p.images
            : p.image
              ? [p.image]
              : [];
        return {
          id: p.id,
          name: p.name || 'Untitled',
          description: p.description ?? null,
          image: images[0] || '',
          images,
          created_at: p.created_at,
          tag_ids: tagsByProduct.get(p.id) || [],
        };
      });

      setPhotos(mapped);
      setTags(tagsRes.data || []);
    } catch (error: any) {
      console.error('Error loading art photos:', error);
      toast.error(error?.message || 'Failed to load art photos');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --------------------------------------------------------------------------
  // Filtering
  // --------------------------------------------------------------------------

  const filteredPhotos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return photos.filter(photo => {
      if (activeTagIds.length > 0) {
        const hasAll = activeTagIds.every(id => photo.tag_ids.includes(id));
        if (!hasAll) return false;
      }

      if (!q) return true;

      const inName = photo.name.toLowerCase().includes(q);
      const inDesc = (photo.description || '').toLowerCase().includes(q);
      const inTags = tags
        .filter(t => photo.tag_ids.includes(t.id))
        .some(t => t.name.toLowerCase().includes(q));
      return inName || inDesc || inTags;
    });
  }, [photos, searchQuery, activeTagIds, tags]);

  const tagsById = useMemo(() => {
    const map = new Map<string, Tag>();
    tags.forEach(t => map.set(t.id, t));
    return map;
  }, [tags]);

  // --------------------------------------------------------------------------
  // Bulk upload
  // --------------------------------------------------------------------------

  const handleFiles = useCallback(
    async (filesList: FileList | File[]) => {
      const files = Array.from(filesList).filter(file => {
        if (!ACCEPTED_MIME.includes(file.type)) {
          toast.error(`${file.name}: unsupported file type`);
          return false;
        }
        if (file.size > MAX_FILE_BYTES) {
          toast.error(`${file.name}: exceeds 10MB limit`);
          return false;
        }
        return true;
      });

      if (files.length === 0) return;

      const queueItems: UploadProgressItem[] = files.map(file => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        fileName: file.name,
        status: 'uploading',
      }));

      setUploadQueue(prev => [...queueItems, ...prev]);

      const updateItem = (
        id: string,
        patch: Partial<UploadProgressItem>
      ) => {
        setUploadQueue(prev =>
          prev.map(item => (item.id === id ? { ...item, ...patch } : item))
        );
      };

      const created: ArtPhoto[] = [];

      await Promise.all(
        files.map(async (file, idx) => {
          const queueItem = queueItems[idx];
          try {
            const ext = getExtension(file.name);
            const storagePath = `art-products/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

            const { error: uploadError } = await supabase.storage
              .from('photify')
              .upload(storagePath, file, {
                cacheControl: '3600',
                upsert: false,
              });

            if (uploadError) throw uploadError;

            const {
              data: { publicUrl },
            } = supabase.storage.from('photify').getPublicUrl(storagePath);

            const displayName = prettifyFilename(file.name);
            const slug = makeSlug(displayName);

            const { data: inserted, error: insertError } = await supabase
              .from('art_products')
              .insert([
                {
                  name: displayName,
                  slug,
                  description: null,
                  category: 'Uncategorized',
                  price: '£0.00',
                  size: '',
                  image: publicUrl,
                  images: [publicUrl],
                  status: 'active',
                  stock_quantity: 0,
                  is_bestseller: false,
                  product_type: 'Canvas',
                  allow_customization: false,
                  meta_keywords: [],
                  features: [],
                  specifications: [],
                  available_sizes: [],
                },
              ])
              .select('id, name, description, image, images, created_at')
              .single();

            if (insertError) throw insertError;

            created.push({
              id: inserted.id,
              name: inserted.name,
              description: inserted.description,
              image: inserted.image || publicUrl,
              images: inserted.images || [publicUrl],
              created_at: inserted.created_at,
              tag_ids: [],
            });

            updateItem(queueItem.id, { status: 'success' });
          } catch (error: any) {
            console.error('Upload failed for', file.name, error);
            updateItem(queueItem.id, {
              status: 'error',
              error: error?.message || 'Upload failed',
            });
          }
        })
      );

      if (created.length > 0) {
        setPhotos(prev => [...created, ...prev]);
        toast.success(
          `${created.length} photo${created.length === 1 ? '' : 's'} uploaded`
        );
      }

      // Auto-clear successful items after a short delay
      setTimeout(() => {
        setUploadQueue(prev => prev.filter(item => item.status !== 'success'));
      }, 2500);
    },
    [supabase]
  );

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // --------------------------------------------------------------------------
  // Edit / delete handlers
  // --------------------------------------------------------------------------

  const handleSavePhoto = async (
    photoId: string,
    updates: { name: string; description: string; tagIds: string[] }
  ) => {
    const original = photos.find(p => p.id === photoId);
    if (!original) return;

    const trimmedName = updates.name.trim() || 'Untitled';
    const trimmedDesc = updates.description.trim();

    try {
      const { error: updateError } = await supabase
        .from('art_products')
        .update({
          name: trimmedName,
          description: trimmedDesc || null,
        })
        .eq('id', photoId);

      if (updateError) throw updateError;

      // Sync tag join table
      const { error: deleteTagsError } = await supabase
        .from('art_product_tags')
        .delete()
        .eq('art_product_id', photoId);
      if (deleteTagsError) throw deleteTagsError;

      if (updates.tagIds.length > 0) {
        const rows = updates.tagIds.map(tag_id => ({
          art_product_id: photoId,
          tag_id,
        }));
        const { error: insertTagsError } = await supabase
          .from('art_product_tags')
          .insert(rows);
        if (insertTagsError) throw insertTagsError;
      }

      setPhotos(prev =>
        prev.map(p =>
          p.id === photoId
            ? {
                ...p,
                name: trimmedName,
                description: trimmedDesc || null,
                tag_ids: updates.tagIds,
              }
            : p
        )
      );

      toast.success('Photo updated');
      setEditingPhoto(null);
    } catch (error: any) {
      console.error('Error updating photo:', error);
      toast.error(error?.message || 'Failed to update photo');
    }
  };

  const confirmDelete = async () => {
    if (!deletingPhoto) return;
    setDeleting(true);
    try {
      // 1. Delete the row first (this is the source of truth for the customer).
      const { error } = await supabase
        .from('art_products')
        .delete()
        .eq('id', deletingPhoto.id);
      if (error) throw error;

      // 2. Best-effort: remove the original image + every mockup from storage.
      //    A failure here shouldn't block the UX since the row is already gone.
      const urls = [
        deletingPhoto.image,
        ...(deletingPhoto.images || []),
      ];
      const keys = Array.from(
        new Set(
          urls
            .map(storageKeyFromUrl)
            .filter((k): k is string => Boolean(k))
        )
      );
      if (keys.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('photify')
          .remove(keys);
        if (storageError) {
          console.warn('Storage cleanup partially failed:', storageError);
        }
      }

      setPhotos(prev => prev.filter(p => p.id !== deletingPhoto.id));
      toast.success('Photo deleted');
      setDeletingPhoto(null);
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      toast.error(error?.message || 'Failed to delete photo');
    } finally {
      setDeleting(false);
    }
  };

  const toggleTagFilter = (tagId: string) => {
    setActiveTagIds(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveTagIds([]);
  };

  const uploadingCount = uploadQueue.filter(i => i.status === 'uploading')
    .length;

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <AdminLayout>
      <div className='max-w-7xl mx-auto'>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type='file'
          accept={ACCEPTED_MIME.join(',')}
          multiple
          className='hidden'
          onChange={onFileInputChange}
        />

        {/* Header */}
        <div className='mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
          <div>
            <h1
              className="font-['Bricolage_Grotesque',_sans-serif] mb-2"
              style={{ fontSize: '32px', fontWeight: '600' }}
            >
              Stock Images
            </h1>
            <p className='text-gray-600'>
              Bulk-upload photos and add tags so customers can find them.
              Detail pages and pricing are not used here.
            </p>
          </div>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className='bg-[#f63a9e] hover:bg-[#e02d8d] gap-2 h-[50px] px-5'
          >
            <Upload className='w-5 h-5' />
            Upload Photos
          </Button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          role='button'
          tabIndex={0}
          className={`mb-6 cursor-pointer rounded-xl border-2 border-dashed transition-colors px-6 py-8 flex flex-col items-center justify-center text-center ${
            isDragging
              ? 'border-[#f63a9e] bg-pink-50'
              : 'border-gray-300 bg-white hover:border-[#f63a9e] hover:bg-pink-50/40'
          }`}
        >
          <div className='w-12 h-12 rounded-full bg-pink-100 text-[#f63a9e] flex items-center justify-center mb-3'>
            <ImagePlus className='w-6 h-6' />
          </div>
          <p className='font-medium text-gray-900'>
            Drop images here or click to upload
          </p>
          <p className='text-sm text-gray-500 mt-1'>
            JPG, PNG, WebP or GIF — up to 10 MB each. You can select many at
            once.
          </p>
        </div>

        {/* Upload queue */}
        {uploadQueue.length > 0 && (
          <div className='mb-6 bg-white border border-gray-200 rounded-xl p-4'>
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center gap-2'>
                {uploadingCount > 0 ? (
                  <Loader2 className='w-4 h-4 animate-spin text-[#f63a9e]' />
                ) : (
                  <CheckCircle2 className='w-4 h-4 text-green-600' />
                )}
                <span className='text-sm font-medium text-gray-900'>
                  {uploadingCount > 0
                    ? `Uploading ${uploadingCount} of ${uploadQueue.length}…`
                    : 'Upload complete'}
                </span>
              </div>
              <button
                onClick={() => setUploadQueue([])}
                className='text-xs text-gray-500 hover:text-gray-900'
              >
                Clear
              </button>
            </div>
            <ul className='space-y-2 max-h-48 overflow-y-auto'>
              {uploadQueue.map(item => (
                <li
                  key={item.id}
                  className='flex items-center gap-3 text-sm text-gray-700'
                >
                  {item.status === 'uploading' && (
                    <Loader2 className='w-3.5 h-3.5 animate-spin text-[#f63a9e] flex-shrink-0' />
                  )}
                  {item.status === 'success' && (
                    <CheckCircle2 className='w-3.5 h-3.5 text-green-600 flex-shrink-0' />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className='w-3.5 h-3.5 text-red-600 flex-shrink-0' />
                  )}
                  <span className='truncate flex-1'>{item.fileName}</span>
                  {item.status === 'error' && item.error && (
                    <span className='text-xs text-red-600 truncate max-w-[40%]'>
                      {item.error}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Search & tag filters */}
        <div className='bg-white rounded-xl border border-gray-200 p-4 mb-6 space-y-4'>
          <div className='flex flex-col md:flex-row gap-3'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
              <Input
                placeholder='Search by name, description, or tag…'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-9'
              />
            </div>
            {(searchQuery || activeTagIds.length > 0) && (
              <Button
                variant='outline'
                onClick={clearFilters}
                className='gap-1.5'
              >
                <X className='w-4 h-4' />
                Clear filters
              </Button>
            )}
          </div>

          {tags.length > 0 && (
            <div>
              <div className='flex items-center gap-2 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider'>
                <TagIcon className='w-3.5 h-3.5' />
                Tags
              </div>
              <div className='flex flex-wrap gap-2'>
                {tags.map(tag => {
                  const isActive = activeTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type='button'
                      onClick={() => toggleTagFilter(tag.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        isActive
                          ? 'text-white border-transparent'
                          : 'text-gray-700 border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      style={
                        isActive ? { backgroundColor: tag.color } : undefined
                      }
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {!loading && (
          <div className='mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600'>
            <span className='inline-flex items-center gap-1.5'>
              <Images className='w-4 h-4' />
              <strong className='text-gray-900'>{photos.length}</strong> photos
              total
            </span>
            <span>
              <strong className='text-gray-900'>
                {filteredPhotos.length}
              </strong>{' '}
              showing
            </span>
            {activeTagIds.length > 0 && (
              <span>
                Filtered by{' '}
                <strong className='text-gray-900'>{activeTagIds.length}</strong>{' '}
                tag{activeTagIds.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className='flex items-center justify-center py-20'>
            <Loader2 className='w-6 h-6 animate-spin text-[#f63a9e] mr-2' />
            <span className='text-gray-600'>Loading photos…</span>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className='bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center'>
            <Images className='w-12 h-12 text-gray-300 mx-auto mb-3' />
            <p className='font-medium text-gray-900 mb-1'>
              {photos.length === 0 ? 'No photos yet' : 'No matching photos'}
            </p>
            <p className='text-sm text-gray-500'>
              {photos.length === 0
                ? 'Upload your first batch using the area above.'
                : 'Try removing filters or changing your search.'}
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4'>
            {filteredPhotos.map(photo => (
              <PhotoTile
                key={photo.id}
                photo={photo}
                tags={photo.tag_ids
                  .map(id => tagsById.get(id))
                  .filter((t): t is Tag => Boolean(t))}
                onEdit={() => setEditingPhoto(photo)}
                onDelete={() => setDeletingPhoto(photo)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingPhoto && (
        <AdminArtPhotoEditModal
          open={true}
          photo={{
            id: editingPhoto.id,
            name: editingPhoto.name,
            description: editingPhoto.description,
            image: editingPhoto.image,
            mockups: editingPhoto.images.slice(1),
            tag_ids: editingPhoto.tag_ids,
          }}
          allTags={tags}
          onClose={() => setEditingPhoto(null)}
          onSave={updates => handleSavePhoto(editingPhoto.id, updates)}
          onMockupsChange={newMockups => {
            const newImages = [editingPhoto.image, ...newMockups];
            setPhotos(prev =>
              prev.map(p =>
                p.id === editingPhoto.id ? { ...p, images: newImages } : p
              )
            );
            setEditingPhoto(prev =>
              prev && prev.id === editingPhoto.id
                ? { ...prev, images: newImages }
                : prev
            );
          }}
        />
      )}

      {/* Delete confirm */}
      {deletingPhoto && (
        <DeleteConfirmDialog
          open={true}
          onOpenChange={open => {
            if (!open) setDeletingPhoto(null);
          }}
          onConfirm={confirmDelete}
          title='Delete photo?'
          itemName={deletingPhoto.name}
          itemType='photo'
          loading={deleting}
          warningMessage='This action cannot be undone. The original image and all uploaded mockups will be permanently removed from storage.'
        />
      )}
    </AdminLayout>
  );
}

// ----------------------------------------------------------------------------
// PhotoTile (internal)
// ----------------------------------------------------------------------------

interface PhotoTileProps {
  photo: ArtPhoto;
  tags: Tag[];
  onEdit: () => void;
  onDelete: () => void;
}

function PhotoTile({ photo, tags, onEdit, onDelete }: PhotoTileProps) {
  return (
    <div className='group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200'>
      {photo.image ? (
        <img
          src={photo.image}
          alt={photo.name}
          loading='lazy'
          className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
        />
      ) : (
        <div className='w-full h-full flex items-center justify-center text-gray-400'>
          <Images className='w-8 h-8' />
        </div>
      )}

      {/* Hover overlay */}
      <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity' />

      {/* Click-to-edit on body of the tile (sits below the action buttons) */}
      <button
        onClick={onEdit}
        aria-label={`Edit ${photo.name}`}
        className='absolute inset-0 z-10'
      />

      {/* Top-right action buttons */}
      <div className='absolute top-2 right-2 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity'>
        <button
          onClick={onEdit}
          aria-label='Edit photo'
          className='p-1.5 rounded-lg bg-white/95 text-gray-800 hover:bg-white hover:text-[#f63a9e] shadow-sm'
        >
          <Pencil className='w-3.5 h-3.5' />
        </button>
        <button
          onClick={onDelete}
          aria-label='Delete photo'
          className='p-1.5 rounded-lg bg-white/95 text-gray-800 hover:bg-white hover:text-red-600 shadow-sm'
        >
          <Trash2 className='w-3.5 h-3.5' />
        </button>
      </div>

      {/* Bottom info */}
      <div className='pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity'>
        <p className='text-sm font-medium truncate drop-shadow'>
          {photo.name}
        </p>
        {tags.length > 0 && (
          <div className='flex flex-wrap gap-1 mt-1.5'>
            {tags.slice(0, 3).map(tag => (
              <span
                key={tag.id}
                className='px-1.5 py-0.5 rounded text-[10px] font-medium text-white'
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
            {tags.length > 3 && (
              <span className='px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/30 text-white'>
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
