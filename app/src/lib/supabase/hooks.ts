import { useState, useEffect } from 'react';
import { createClient } from './client';
import type { 
  Product, 
  ArtProduct, 
  RoomInspiration, 
  AITool, 
  PrintSize, 
  Category 
} from '../data/types';

const supabase = createClient();

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): UseDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchIndex, setRefetchIndex] = useState(0);

  const refetch = () => setRefetchIndex((prev) => prev + 1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await queryFn();
        if (result.error) {
          throw new Error(result.error.message);
        }
        setData(result.data);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refetchIndex]);

  return { data, loading, error, refetch };
}

// Products hooks
export const useProducts = () => {
  return useSupabaseQuery<Product[]>(async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories:product_categories(
          category:categories(*)
        )
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  });
};

export const useFeaturedProducts = () => {
  return useSupabaseQuery<Product[]>(async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories:product_categories(
          category:categories(*)
        )
      `)
      .eq('is_featured', true)
      .order('created_at', { ascending: false });
    return { data, error };
  });
};

export const useProduct = (id: string) => {
  return useSupabaseQuery<Product>(async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories:product_categories(
          category:categories(*)
        )
      `)
      .or(`id.eq.${id},slug.eq.${id}`)
      .single();
    return { data, error };
  });
};

export const useProductsByCategory = (categorySlug: string) => {
  return useSupabaseQuery<Product[]>(async () => {
    // First get the category ID from slug
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();
    
    if (categoryError || !categoryData) {
      return { data: null, error: categoryError };
    }
    
    // Then get products with that category
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories:product_categories!inner(
          category:categories(*)
        )
      `)
      .eq('product_categories.category_id', categoryData.id)
      .order('created_at', { ascending: false });
    
    return { data, error };
  });
};

// Art Products hooks
export const useArt = (category?: string) => {
  return useSupabaseQuery<ArtProduct[]>(async () => {
    let query = supabase
      .from('art_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    return { data, error };
  });
};

export const useBestsellers = () => {
  return useSupabaseQuery<ArtProduct[]>(async () => {
    const { data, error } = await supabase
      .from('art_products')
      .select('*')
      .eq('is_bestseller', true)
      .order('created_at', { ascending: false });
    return { data, error };
  });
};

export const useArtProduct = (id: string) => {
  return useSupabaseQuery<ArtProduct>(async () => {
    const { data, error} = await supabase
      .from('art_products')
      .select('*')
      .or(`id.eq.${id},slug.eq.${id}`)
      .single();
    return { data, error };
  });
};

export const useArtCategories = () => {
  return useSupabaseQuery<string[]>(async () => {
    const { data, error } = await supabase
      .from('art_products')
      .select('category')
      .order('category');
    
    if (error) return { data: null, error };
    
    const categories = ['All', ...Array.from(new Set(data?.map((item: any) => item.category) || []))];
    return { data: categories as any, error: null };
  });
};

// Categories hooks
export const useCategories = () => {
  return useSupabaseQuery<Category[]>(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });
    return { data, error };
  });
};

export const useActiveCategories = () => {
  return useSupabaseQuery<Category[]>(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    return { data, error };
  });
};

export const useCategory = (slug: string) => {
  return useSupabaseQuery<Category>(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();
    return { data, error };
  });
};

// Rooms hooks
export const useRooms = () => {
  return useSupabaseQuery<RoomInspiration[]>(async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  });
};

export const useRoom = (id: string) => {
  return useSupabaseQuery<RoomInspiration>(async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .or(`id.eq.${id},slug.eq.${id}`)
      .single();
    return { data, error };
  });
};

// AI Tools hooks
export const useAITools = () => {
  return useSupabaseQuery<AITool[]>(async () => {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('*')
      .eq('is_active', true)
      .order('title');
    return { data, error };
  });
};

// Print Sizes hooks
export const usePrintSizes = () => {
  return useSupabaseQuery<PrintSize[]>(async () => {
    const { data, error } = await supabase
      .from('print_sizes')
      .select('*')
      .order('name');
    return { data, error };
  });
};

// ============================================
// NEW HOOKS - Promotions, Settings, Hotspots, Reviews
// ============================================

// Promotions hooks
export const usePromotions = () => {
  return useSupabaseQuery<any[]>(async () => {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  });
};

export const useActivePromotions = () => {
  return useSupabaseQuery<any[]>(async () => {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false });
    return { data, error };
  });
};

export const usePromotion = (id: string) => {
  return useSupabaseQuery<any>(async () => {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  });
};

// Site Settings hooks
export const useSiteSettings = () => {
  return useSupabaseQuery<any[]>(async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('category', { ascending: true });
    return { data, error };
  });
};

export const usePublicSettings = () => {
  return useSupabaseQuery<any[]>(async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('is_public', true)
      .order('category', { ascending: true });
    return { data, error };
  });
};

export const useSiteSetting = (key: string) => {
  return useSupabaseQuery<any>(async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('setting_key', key)
      .single();
    return { data, error };
  });
};

export const useSettingsByCategory = (category: string) => {
  return useSupabaseQuery<any[]>(async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('category', category)
      .order('setting_key', { ascending: true });
    return { data, error };
  });
};

// Room Hotspots hooks
export const useRoomHotspots = (roomId: string) => {
  return useSupabaseQuery<any[]>(async () => {
    const { data, error } = await supabase
      .rpc('get_room_hotspots', { room_uuid: roomId });
    return { data, error };
  });
};

export const useRoomHotspotsWithDetails = (roomId: string) => {
  return useSupabaseQuery<any[]>(async () => {
    const { data, error } = await supabase
      .from('v_room_hotspots_with_products')
      .select('*')
      .eq('room_id', roomId)
      .order('display_order', { ascending: true });
    return { data, error };
  });
};

export const useAllHotspots = () => {
  return useSupabaseQuery<any[]>(async () => {
    const { data, error } = await supabase
      .from('room_hotspots')
      .select(`
        *,
        room:rooms(*),
        product:products(id, name, slug, images),
        art_product:art_products(id, name, slug, images)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    return { data, error };
  });
};

// Product Reviews hooks
export const useProductReviews = (productId: string, limit = 10) => {
  return useSupabaseQuery<any[]>(async () => {
    const { data, error } = await supabase
      .rpc('get_product_reviews', { 
        product_uuid: productId,
        limit_count: limit,
        offset_count: 0
      });
    return { data, error };
  });
};

export const useReviewsWithDetails = () => {
  return useSupabaseQuery<any[]>(async () => {
    const { data, error } = await supabase
      .from('v_product_reviews_with_details')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    return { data, error };
  });
};

export const useRatingDistribution = (productId: string) => {
  return useSupabaseQuery<any[]>(async () => {
    const { data, error } = await supabase
      .rpc('get_rating_distribution', { product_uuid: productId });
    return { data, error };
  });
};

export const usePendingReviews = () => {
  return useSupabaseQuery<any[]>(async () => {
    const { data, error } = await supabase
      .from('product_reviews')
      .select(`
        *,
        product:products(id, name, slug),
        art_product:art_products(id, name, slug)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    return { data, error };
  });
};

