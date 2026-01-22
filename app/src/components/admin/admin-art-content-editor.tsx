import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Sparkles } from 'lucide-react';

interface Specification {
  label: string;
  value: string;
}

interface AdminArtContentEditorProps {
  // SEO Fields
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  onMetaTitleChange: (value: string) => void;
  onMetaDescriptionChange: (value: string) => void;
  onMetaKeywordsChange: (value: string[]) => void;

  // Content Fields
  features: string[];
  specifications: Specification[];
  onFeaturesChange: (features: string[]) => void;
  onSpecificationsChange: (specs: Specification[]) => void;
}

export function AdminArtContentEditor({
  metaTitle,
  metaDescription,
  metaKeywords,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onMetaKeywordsChange,
  features,
  specifications,
  onFeaturesChange,
  onSpecificationsChange,
}: AdminArtContentEditorProps) {
  // Local state for keyword input
  const [keywordInput, setKeywordInput] = useState('');

  // Features Management
  const handleAddFeature = () => {
    onFeaturesChange([...features, '']);
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    onFeaturesChange(newFeatures);
  };

  const handleRemoveFeature = (index: number) => {
    onFeaturesChange(features.filter((_, i) => i !== index));
  };

  // Specifications Management
  const handleAddSpecification = () => {
    onSpecificationsChange([...specifications, { label: '', value: '' }]);
  };

  const handleSpecificationChange = (
    index: number,
    field: 'label' | 'value',
    value: string
  ) => {
    const newSpecs = [...specifications];
    newSpecs[index] = { ...newSpecs[index], [field]: value };
    onSpecificationsChange(newSpecs);
  };

  const handleRemoveSpecification = (index: number) => {
    onSpecificationsChange(specifications.filter((_, i) => i !== index));
  };

  // Keywords Management
  const handleAddKeyword = () => {
    if (keywordInput.trim()) {
      onMetaKeywordsChange([...metaKeywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (index: number) => {
    onMetaKeywordsChange(metaKeywords.filter((_, i) => i !== index));
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  return (
    <div className='space-y-6'>
      {/* SEO Fields */}
      <Card className='p-6'>
        <div className='space-y-4'>
          <div>
            <h3 className='text-base font-semibold mb-1'>SEO Settings</h3>
            <p className='text-sm text-gray-600'>
              Optimize for search engines and social sharing
            </p>
          </div>

          <div>
            <Label htmlFor='meta-title'>Meta Title</Label>
            <Input
              id='meta-title'
              value={metaTitle}
              onChange={e => onMetaTitleChange(e.target.value)}
              placeholder='e.g., Ocean Dreams Abstract Art Print | Photify'
              maxLength={60}
            />
            <p className='text-xs text-gray-500 mt-1'>
              {metaTitle.length}/60 characters (recommended)
            </p>
          </div>

          <div>
            <Label htmlFor='meta-description'>Meta Description</Label>
            <Textarea
              id='meta-description'
              value={metaDescription}
              onChange={e => onMetaDescriptionChange(e.target.value)}
              placeholder='Brief description for search results...'
              rows={3}
              maxLength={160}
            />
            <p className='text-xs text-gray-500 mt-1'>
              {metaDescription.length}/160 characters (recommended)
            </p>
          </div>

          <div>
            <Label htmlFor='keywords-input'>Meta Keywords</Label>
            <div className='flex gap-2'>
              <Input
                id='keywords-input'
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyPress={handleKeywordKeyPress}
                placeholder='Add keyword and press Enter'
              />
              <Button
                type='button'
                onClick={handleAddKeyword}
                variant='outline'
                size='sm'
              >
                <Plus className='w-4 h-4' />
              </Button>
            </div>

            {metaKeywords.length > 0 && (
              <div className='flex flex-wrap gap-2 mt-3'>
                {metaKeywords.map((keyword, index) => (
                  <div
                    key={index}
                    className='inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm'
                  >
                    <span>{keyword}</span>
                    <button
                      onClick={() => handleRemoveKeyword(index)}
                      className='text-gray-500 hover:text-red-600'
                    >
                      <Trash2 className='w-3 h-3' />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Features Section */}
      <Card className='p-6'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-base font-semibold mb-1 flex items-center gap-2'>
                <Sparkles className='w-4 h-4 text-[#f63a9e]' />
                Product Features
              </h3>
              <p className='text-sm text-gray-600'>
                Highlight key features and benefits
              </p>
            </div>
            <Button
              onClick={handleAddFeature}
              size='sm'
              variant='outline'
              className='gap-2'
            >
              <Plus className='w-4 h-4' />
              Add Feature
            </Button>
          </div>

          {features.length === 0 ? (
            <div className='text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg'>
              <p>
                No features added. Click &quot;Add Feature&quot; to get started.
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              {features.map((feature, index) => (
                <div key={index} className='flex gap-2'>
                  <Input
                    value={feature}
                    onChange={e => handleFeatureChange(index, e.target.value)}
                    placeholder='e.g., Museum-quality printing'
                  />
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleRemoveFeature(index)}
                    className='text-red-600 hover:text-red-700 hover:bg-red-50'
                  >
                    <Trash2 className='w-4 h-4' />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Specifications Section */}
      <Card className='p-6'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-base font-semibold mb-1'>Specifications</h3>
              <p className='text-sm text-gray-600'>
                Technical details and product specs
              </p>
            </div>
            <Button
              onClick={handleAddSpecification}
              size='sm'
              variant='outline'
              className='gap-2'
            >
              <Plus className='w-4 h-4' />
              Add Spec
            </Button>
          </div>

          {specifications.length === 0 ? (
            <div className='text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg'>
              <p>
                No specifications added. Click &quot;Add Spec&quot; to get
                started.
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              {specifications.map((spec, index) => (
                <div key={index} className='flex gap-2'>
                  <Input
                    value={spec.label}
                    onChange={e =>
                      handleSpecificationChange(index, 'label', e.target.value)
                    }
                    placeholder='Label (e.g., Material)'
                    className='flex-1'
                  />
                  <Input
                    value={spec.value}
                    onChange={e =>
                      handleSpecificationChange(index, 'value', e.target.value)
                    }
                    placeholder='Value (e.g., Premium Canvas)'
                    className='flex-1'
                  />
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleRemoveSpecification(index)}
                    className='text-red-600 hover:text-red-700 hover:bg-red-50'
                  >
                    <Trash2 className='w-4 h-4' />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Quick Tips */}
      <Card className='p-4 bg-blue-50 border-blue-200'>
        <h4 className='text-sm font-semibold text-blue-900 mb-2'>💡 Tips</h4>
        <ul className='text-sm text-blue-800 space-y-1 list-disc list-inside'>
          <li>
            Keep meta title under 60 characters for best display in search
            results
          </li>
          <li>Meta description should be 150-160 characters</li>
          <li>Add 5-10 relevant keywords for SEO</li>
          <li>Features should focus on benefits, not just technical details</li>
          <li>Specifications provide concrete product information</li>
        </ul>
      </Card>
    </div>
  );
}
