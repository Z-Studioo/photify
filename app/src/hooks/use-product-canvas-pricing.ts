import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Product } from '@/lib/data/types';

/**
 * Merges live `products.config` (incl. `sizePrices` JSON from admin) onto the
 * selected product so dashboard pricing matches /admin/products/edit.
 */
export function useProductCanvasPricingProduct(
  selectedProduct: Product | null | undefined
): Product | null {
  const { data: productConfigRow } = useQuery({
    queryKey: ['productCanvasConfig', selectedProduct?.id],
    queryFn: async () => {
      const id = selectedProduct?.id;
      if (!id) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select('id, config')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(selectedProduct?.id),
    staleTime: 30_000,
  });

  return useMemo((): Product | null => {
    if (!selectedProduct) return null;
    const rowConfig = productConfigRow?.config;
    if (rowConfig != null && typeof rowConfig === 'object') {
      return {
        ...selectedProduct,
        config: rowConfig as Product['config'],
      };
    }
    return selectedProduct;
  }, [selectedProduct, productConfigRow]);
}
