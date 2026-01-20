import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { ProductDetailPage } from '@/components/pages/product/[id]';
import { createClient } from '@/lib/supabase/client';

export default function ArtPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const supabase = createClient();

      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id
        );

      const query = supabase.from('art_products').select('*');

      const { data, error } = isUUID
        ? await query.eq('id', id).maybeSingle()
        : await query.eq('slug', id).maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setProduct(data);
      }

      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto' />
          <p className='mt-4 text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  if (notFound || !id) {
    return <Navigate to='/404' replace />;
  }

  return <ProductDetailPage initialProduct={product} productSlug={id} />;
}
