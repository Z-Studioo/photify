import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Save, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface RoomContentEditorProps {
  roomId: string;
}

export function AdminRoomContentEditor({ roomId }: RoomContentEditorProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // SEO Meta Fields
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImage, setOgImage] = useState('');

  useEffect(() => {
    fetchRoomContent();
  }, [roomId]);

  const fetchRoomContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .or(`id.eq.${roomId},slug.eq.${roomId}`)
        .single();

      if (error) throw error;

      if (data) {
        // SEO Fields
        setMetaTitle(data.seo_title || '');
        setMetaDescription(data.seo_description || '');
        setKeywords(data.seo_keywords || []);
        setCanonicalUrl(data.canonical_url || '');
        setOgTitle(data.og_title || '');
        setOgDescription(data.og_description || '');
        setOgImage(data.og_image || '');
      }
    } catch (error: any) {
      console.error('Error fetching content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Get the actual room ID if roomId is a slug
      const { data: roomData } = await supabase
        .from('rooms')
        .select('id')
        .or(`id.eq.${roomId},slug.eq.${roomId}`)
        .single();

      if (!roomData) throw new Error('Room not found');

      // Update room content
      const { error: roomError } = await supabase
        .from('rooms')
        .update({
          seo_title: metaTitle,
          seo_description: metaDescription,
          seo_keywords: keywords,
          canonical_url: canonicalUrl,
          og_title: ogTitle,
          og_description: ogDescription,
          og_image: ogImage,
        })
        .eq('id', roomData.id);

      if (roomError) throw roomError;

      toast.success('Content saved successfully');
    } catch (error: any) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  // Keywords Management
  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='w-6 h-6 animate-spin text-[#f63a9e]' />
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Page Settings */}
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <h3 className='text-lg font-semibold mb-6'>Page Settings</h3>

        {/* Meta Title */}
        <div className='mb-6'>
          <Label htmlFor='meta-title'>Page Title</Label>
          <Input
            id='meta-title'
            value={metaTitle}
            onChange={e => setMetaTitle(e.target.value)}
            placeholder='Modern Living Room - Room Inspiration | Photify'
            className='mt-2'
          />
          <div className='flex items-center justify-between mt-1'>
            <p className='text-xs text-gray-500'>Optimal: 50-60 characters</p>
            <p
              className={`text-xs ${metaTitle.length > 60 ? 'text-red-600' : 'text-gray-500'}`}
            >
              {metaTitle.length} / 60
            </p>
          </div>
        </div>

        {/* Meta Description */}
        <div className='mb-6'>
          <Label htmlFor='meta-description'>Page Description</Label>
          <Textarea
            id='meta-description'
            value={metaDescription}
            onChange={e => setMetaDescription(e.target.value)}
            placeholder='Discover beautiful room inspiration with curated photo prints and wall art...'
            rows={3}
            className='mt-2'
          />
          <div className='flex items-center justify-between mt-1'>
            <p className='text-xs text-gray-500'>Optimal: 150-160 characters</p>
            <p
              className={`text-xs ${metaDescription.length > 160 ? 'text-red-600' : 'text-gray-500'}`}
            >
              {metaDescription.length} / 160
            </p>
          </div>
        </div>

        {/* Keywords */}
        <div className='mb-6'>
          <Label htmlFor='keywords'>Keywords</Label>
          <div className='flex gap-2 mt-2'>
            <Input
              id='keywords'
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              onKeyPress={e =>
                e.key === 'Enter' && (e.preventDefault(), addKeyword())
              }
              placeholder='Add keyword and press Enter'
            />
            <Button type='button' onClick={addKeyword}>
              <Plus className='w-4 h-4' />
            </Button>
          </div>
          <div className='flex flex-wrap gap-2 mt-3'>
            {keywords.map((keyword, index) => (
              <span
                key={index}
                className='inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm'
              >
                {keyword}
                <button
                  onClick={() => removeKeyword(keyword)}
                  className='hover:text-red-600'
                >
                  <X className='w-3 h-3' />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Canonical URL */}
        <div>
          <Label htmlFor='canonical'>Canonical URL</Label>
          <Input
            id='canonical'
            value={canonicalUrl}
            onChange={e => setCanonicalUrl(e.target.value)}
            placeholder='https://photify.com/room/modern-living-room'
            className='mt-2'
          />
          <p className='text-xs text-gray-500 mt-1'>
            The preferred URL for this page
          </p>
        </div>
      </div>

      {/* Social Media Preview */}
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <h3 className='text-lg font-semibold mb-6'>Social Media Preview</h3>

        <div className='mb-6'>
          <Label htmlFor='og-title'>Social Title</Label>
          <Input
            id='og-title'
            value={ogTitle}
            onChange={e => setOgTitle(e.target.value)}
            placeholder='Leave empty to use Page Title'
            className='mt-2'
          />
        </div>

        <div className='mb-6'>
          <Label htmlFor='og-description'>Social Description</Label>
          <Textarea
            id='og-description'
            value={ogDescription}
            onChange={e => setOgDescription(e.target.value)}
            placeholder='Leave empty to use Page Description'
            rows={2}
            className='mt-2'
          />
        </div>

        <div>
          <Label htmlFor='og-image'>Social Image URL</Label>
          <Input
            id='og-image'
            value={ogImage}
            onChange={e => setOgImage(e.target.value)}
            placeholder='https://example.com/image.jpg'
            className='mt-2'
          />
          <p className='text-xs text-gray-500 mt-1'>
            Recommended: 1200×630px. Leave empty to use room image.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className='flex justify-end gap-3 pt-6 border-t'>
        <Button
          onClick={handleSave}
          disabled={saving}
          className='bg-[#f63a9e] hover:bg-[#e02d8d]'
        >
          {saving ? (
            <>
              <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              Saving...
            </>
          ) : (
            <>
              <Save className='w-4 h-4 mr-2' />
              Save All Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
