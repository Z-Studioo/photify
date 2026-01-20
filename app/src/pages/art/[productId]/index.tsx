import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { createClient } from '@/lib/supabase/client';
import { ProductDetailPage } from '@/components/pages/product/[id]';
import NotFound from '@/pages/not-found';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export default function ArtPage() {
  const supabase = createClient();
  const [searchParams] = useSearchParams();

  const productId = searchParams.get('productId');

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!productId) {
      setError(true);
      setLoading(false);
      return;
    }

    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        productId
      );

    async function fetchProduct() {
      setLoading(true);

      const { data, error } = await supabase
        .from('art_products')
        .select('*')
        .or(isUUID ? `id.eq.${productId}` : `slug.eq.${productId}`)
        .single();

      if (error || !data) {
        setError(true);
      } else {
        setProduct(data);
      }

      setLoading(false);
    }

    fetchProduct();
  }, [productId, supabase]);

  if (loading) return <LoadingSpinner />;

  if (error || !product) {
    return <NotFound />;
  }

  return (
    <ProductDetailPage initialProduct={product} productSlug={productId!} />
  );
}
