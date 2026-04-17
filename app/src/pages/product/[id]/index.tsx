import { ProductDetailPage } from '@/components/pages/product/[id]';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Helmet } from '@dr.pogodin/react-helmet';

export default function ProductPage() {
  const { id: productId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      
      const supabase = createClient();
      
      // Check if productId is a UUID or slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(isUUID ? `id.eq.${productId}` : `slug.eq.${productId}`)
        .single();

      if (error || !data) {
        navigate('/not-found');
        return;
      }

      setProduct(data);
      setLoading(false);
    };

    fetchProduct();
  }, [productId, navigate]);

  if (loading) {
    return (
    <>
    <LoadingSpinner />
    </>
  );
  }

  if (!product) {
    return null;
  }

  return (
  <>
    <Helmet>
      <title>{product.name} | Photify</title>
      <meta
        name="description"
        content={product.description || 'Explore this amazing product on Photify.'}
      />
      <meta name="robots" content="index,follow" />
    </Helmet>
    <ProductDetailPage initialProduct={product} productSlug={productId || ''} />
  </>);
}
