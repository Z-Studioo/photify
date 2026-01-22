import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  description?: string;
}

interface AdminArtProductTagsEditorProps {
  artProductId: string;
}

export function AdminArtProductTagsEditor({ artProductId }: AdminArtProductTagsEditorProps) {
  const supabase = createClient();
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTags();
  }, [artProductId]);

  const fetchTags = async () => {
    setLoading(true);
    try {
      // Fetch all available tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });

      if (tagsError) throw tagsError;
      setAllTags(tagsData || []);

      // Fetch current art product tags
      const { data: artProductTagsData, error: artProductTagsError } = await supabase
        .from('art_product_tags')
        .select('tag_id')
        .eq('art_product_id', artProductId);

      if (artProductTagsError) throw artProductTagsError;

      const currentTagIds = artProductTagsData?.map((apt) => apt.tag_id) || [];
      setSelectedTagIds(currentTagIds);
    } catch (error: any) {
      toast.error('Failed to load tags: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete all existing art product tag associations
      const { error: deleteError } = await supabase
        .from('art_product_tags')
        .delete()
        .eq('art_product_id', artProductId);

      if (deleteError) throw deleteError;

      // Insert new associations
      if (selectedTagIds.length > 0) {
        const insertData = selectedTagIds.map((tagId) => ({
          art_product_id: artProductId,
          tag_id: tagId,
        }));

        const { error: insertError } = await supabase
          .from('art_product_tags')
          .insert(insertData);

        if (insertError) throw insertError;
      }

      toast.success('Art product tags updated successfully!');
    } catch (error: any) {
      toast.error('Failed to save tags: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#f63a9e] mr-2" />
        <span className="text-gray-600">Loading tags...</span>
      </div>
    );
  }

  if (allTags.length === 0) {
    return (
      <div className="p-8 bg-gray-50 rounded-lg border border-gray-200 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-2">No Tags Available</h3>
        <p className="text-gray-600 mb-4">
          Create tags in Settings → Products → Tags before assigning them to art products.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-['Bricolage_Grotesque',_sans-serif] text-lg font-semibold mb-1">
            Art Product Tags
          </h3>
          <p className="text-sm text-gray-600">
            Select tags that apply to this art product
          </p>
        </div>
        <div>
          {selectedTagIds.length > 0 ? (
            <span className="px-3 py-1 bg-[#f63a9e] text-white rounded-full text-sm font-medium">
              {selectedTagIds.length} tag{selectedTagIds.length !== 1 ? 's' : ''} selected
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              No tags selected
            </span>
          )}
        </div>
      </div>

      {/* Tag selection grid - multi-select checkbox cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {allTags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <label
              key={tag.id}
              className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#f63a9e] bg-pink-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleTag(tag.id)}
                className="mt-0.5 w-4 h-4 text-[#f63a9e] border-gray-300 rounded focus:ring-[#f63a9e]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                </div>
                {tag.description && (
                  <div className="text-xs text-gray-500 mt-1">{tag.description}</div>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {/* Save button */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          {selectedTagIds.length > 0
            ? `${selectedTagIds.length} tag${selectedTagIds.length !== 1 ? 's' : ''} will be saved`
            : 'Select tags to apply to this art product'}
        </p>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#f63a9e] hover:bg-[#e02d8d] gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Tags
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

