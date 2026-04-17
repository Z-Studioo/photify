import { ProductDetailPage } from '@/components/pages/product/[id]';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Helmet } from '@dr.pogodin/react-helmet';
import { useConsumedInitialData } from '@/ssr/InitialDataContext';
import { useCanonicalUrl } from '@/lib/seo';

export default function ProductPage() {
  const { id: productId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ssrProduct = useConsumedInitialData<any>('productDetail');

  const [product, setProduct] = useState<any>(ssrProduct ?? null);
  const [loading, setLoading] = useState(!ssrProduct);

  useEffect(() => {
    if (ssrProduct) return;
    if (!productId) return;

    const fetchProduct = async () => {
      const supabase = createClient();
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          productId
        );

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
  }, [productId, navigate, ssrProduct]);

  const canonical = useCanonicalUrl();
  const title = product ? `${product.name} | Photify` : 'Product | Photify';
  const description =
    product?.description ||
    'Explore this amazing photo product on Photify \u2014 premium canvas prints, framed photos, and art.';
  const image = product?.images?.[0] ?? '';

  const productJsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description,
        image: product.images ?? [],
        sku: product.id,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: product.fixed_price ?? product.price ?? undefined,
          availability: product.active
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        },
      }
    : null;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name='description' content={description} />
        <meta name='robots' content='index,follow' />
        <link rel='canonical' href={canonical} />
        <meta property='og:type' content='product' />
        <meta property='og:url' content={canonical} />
        <meta property='og:title' content={title} />
        <meta property='og:description' content={description} />
        {image ? <meta property='og:image' content={image} /> : null}
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={title} />
        <meta name='twitter:description' content={description} />
        {image ? <meta name='twitter:image' content={image} /> : null}
        {productJsonLd ? (
          <script type='application/ld+json'>
            {JSON.stringify(productJsonLd)}
          </script>
        ) : null}
      </Helmet>
      {loading ? (
        <LoadingSpinner />
      ) : product ? (
        <ProductDetailPage
          initialProduct={product}
          productSlug={productId || ''}
        />
      ) : null}
    </>
  );
}
