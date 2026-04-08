'use client';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image_url?: string;
  bg_color: string;
  display_order: number;
  is_active: boolean;
}

interface CategoryNavProps {
  disabled?: boolean;
}

export function CategoryNav({ disabled = false }: CategoryNavProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="w-full aspect-square bg-gray-200 animate-pulse rounded-lg" />
                <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200">
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {categories.map((category) => {
            const IconComponent = (Icons as any)[category.icon] || Icons.Frame;
            const href = category.slug === 'art-collection' ? '/art-collections' : `/category/${category.slug}`;
            return (
              <Link
                key={category.id}
                to={href}
                onClick={(e) => {
                  if (disabled) e.preventDefault();
                }}
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : 0}
                className={`flex flex-col items-center gap-3 group transition-opacity ${
                  disabled
                    ? 'opacity-60 cursor-not-allowed pointer-events-none'
                    : 'hover:opacity-70'
                }`}
              >
                <div className="w-full aspect-square rounded-lg overflow-hidden relative">
                  {category.image_url ? (
                    <ImageWithFallback
                      src={category.image_url}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: category.bg_color }}
                    >
                      <IconComponent 
                        className="w-12 h-12 text-gray-700 group-hover:scale-110 transition-transform" 
                        strokeWidth={1.5}
                      />
                    </div>
                  )}
                </div>
                <span className="text-xs text-center leading-tight px-1">{category.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
