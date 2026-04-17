import { ProductsPage } from '@/components/pages/products';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Helmet } from '@dr.pogodin/react-helmet';
import { useConsumedInitialData } from '@/ssr/InitialDataContext';

interface ProductsInitialData {
  products: any[];
  categories: any[];
}

const META = (
  <Helmet>
    <title>Products | Photify</title>
    <meta
      name='description'
      content='Browse our collection of photo products, canvases, art prints, and framed photos. Find the perfect piece for your space.'
    />
    <meta name='robots' content='index,follow' />
    <meta property='og:type' content='website' />
    <meta property='og:title' content='Products | Photify' />
    <meta
      property='og:description'
      content='Browse our collection of photo products, canvases, art prints, and framed photos.'
    />
    <meta name='twitter:card' content='summary_large_image' />
    <meta name='twitter:title' content='Products | Photify' />
  </Helmet>
);

export default function Products() {
  const ssr = useConsumedInitialData<ProductsInitialData>('products');

  const [products, setProducts] = useState<any[]>(ssr?.products ?? []);
  const [categories, setCategories] = useState<any[]>(ssr?.categories ?? []);
  const [loading, setLoading] = useState(!ssr);

  useEffect(() => {
    if (ssr) return;

    const fetchData = async () => {
      const supabase = createClient();

      const { data: productsData } = await supabase
        .from('products')
        .select(
          `
          *,
          product_categories(
            category:categories(*)
          )
        `
        )
        .eq('active', true)
        .order('created_at', { ascending: false });

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      setProducts(productsData || []);
      setCategories(categoriesData || []);
      setLoading(false);
    };

    fetchData();
  }, [ssr]);

  // JSON-LD ItemList schema (SEO)
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.slice(0, 20).map((p, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `/product/${p.slug ?? p.id}`,
      name: p.name,
    })),
  };

  return (
    <>
      {META}
      <Helmet>
        <script type='application/ld+json'>
          {JSON.stringify(itemListJsonLd)}
        </script>
      </Helmet>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <ProductsPage
          initialProducts={products}
          initialCategories={categories}
        />
      )}
    </>
  );
}
