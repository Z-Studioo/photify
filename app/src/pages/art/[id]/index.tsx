import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { ArtDetailPage } from '@/components/pages/art/detail';
import { createClient } from '@/lib/supabase/client';
import { Helmet } from '@dr.pogodin/react-helmet';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useConsumedInitialData } from '@/ssr/InitialDataContext';
import { useCanonicalUrl } from '@/lib/seo';

export default function ArtPage() {
  const { id } = useParams<{ id: string }>();
  const ssrProduct = useConsumedInitialData<Record<string, any>>('artDetail');

  const [product, setProduct] = useState<Record<string, any> | null>(
    ssrProduct ?? null
  );
  const [loading, setLoading] = useState(!ssrProduct);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (ssrProduct) return;
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      const supabase = createClient();
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id
        );

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
  }, [id, ssrProduct]);

  const canonical = useCanonicalUrl();
  const title = product?.name ? `${product.name} | Photify` : 'Art | Photify';
  const description =
    product?.description ||
    'Explore this amazing art product on Photify \u2014 curated wall art and prints.';
  const image = product?.image ?? product?.images?.[0] ?? '';

  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description,
        image: product.images ?? (product.image ? [product.image] : []),
        sku: product.id,
        offers: product.price
          ? {
              '@type': 'Offer',
              priceCurrency: 'USD',
              price: product.price,
              availability: 'https://schema.org/InStock',
            }
          : undefined,
      }
    : null;

  if (notFound || (!loading && !product && !id)) {
    return <Navigate to='/404' replace />;
  }

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name='description' content={description} />
        <meta
          name='robots'
          content={product ? 'index,follow' : 'noindex,nofollow'}
        />
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
        {jsonLd ? (
          <script type='application/ld+json'>{JSON.stringify(jsonLd)}</script>
        ) : null}
      </Helmet>
      {loading ? (
        <LoadingSpinner />
      ) : product ? (
        <ArtDetailPage artProduct={product} />
      ) : null}
    </>
  );
}
