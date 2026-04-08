import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { ArtDetailPage } from '@/components/pages/art/detail';
import { createClient } from '@/lib/supabase/client';
import { Helmet } from '@dr.pogodin/react-helmet';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

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
        .select('*, art_product_tags(tag_id, tags(id, name, slug))')
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
        <LoadingSpinner />
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
      <ArtDetailPage artProduct={product!} />
    </>
);
}
