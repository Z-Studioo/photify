import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { ProductDetailPage } from '@/components/pages/product/[id]';
import { createClient } from '@/lib/supabase/client';
import { Helmet } from '@dr.pogodin/react-helmet';

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

      // Check if id is a UUID or slug
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id
        );

      // Fetch from art_products table
      const { data, error } = await supabase
        .from('art_products')
        .select('*')
        .or(isUUID ? `id.eq.${id}` : `slug.eq.${id}`)
        .single();

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
      <>
        <Helmet>
          <title>Art | Photify</title>
          <meta
            name="description"
            content="Explore the amazing art product on Photify."
          />
          <meta name="robots" content="noindex,nofollow" />
        </Helmet>
        <div className='min-h-screen flex items-center justify-center'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto' />
            <p className='mt-4 text-gray-600'>Loading...</p>
          </div>
        </div>
      </>
      
    );
  }

  if (notFound || !id) {
    return <Navigate to='/404' replace />;
  }

  return (
    <>
      <Helmet>
        <title>{product?.name} | Photify</title>
        <meta
          name="description"
          content={product?.description || 'Explore this amazing art product on Photify.'}
        />
        <meta name="robots" content="index,follow" />
      </Helmet>
      <ProductDetailPage initialProduct={product} productSlug={id} />
    </>
);
}
