import { useEffect, useState } from 'react';
import { ArtCollectionPage } from '@/components/pages/art-collection';
import { createClient } from '@/lib/supabase/client';
import { Helmet } from '@dr.pogodin/react-helmet';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useConsumedInitialData } from '@/ssr/InitialDataContext';

interface ArtTag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface RawArtProduct {
  id: string;
  slug: string;
  name: string;
  image: string;
  images: string[];
  price: string;
  size: string;
  available_sizes:
    | { size_id: string; price: number; image_url: string }[]
    | null;
  category: string;
  is_bestseller: boolean;
  status: string;
  created_at: string;
  art_product_tags: { tags: ArtTag | ArtTag[] | null }[];
}

interface ArtCollectionsInitialData {
  artProducts: RawArtProduct[];
  categories: string[];
}

const META = (
  <Helmet>
    <title>Art Collections | Photify</title>
    <meta
      name='description'
      content='Explore our curated art collections at Photify. Discover stunning art products to enhance your space.'
    />
    <meta name='robots' content='index,follow' />
    <meta property='og:type' content='website' />
    <meta property='og:title' content='Art Collections | Photify' />
    <meta
      property='og:description'
      content='Explore our curated art collections at Photify.'
    />
    <meta name='twitter:card' content='summary_large_image' />
    <meta name='twitter:title' content='Art Collections | Photify' />
  </Helmet>
);

export default function ArtCollections() {
  const ssr =
    useConsumedInitialData<ArtCollectionsInitialData>('artCollections');

  const [artProducts, setArtProducts] = useState<RawArtProduct[]>(
    ssr?.artProducts ?? []
  );
  const [categories, setCategories] = useState<string[]>(
    ssr?.categories ?? []
  );
  const [loading, setLoading] = useState(!ssr);

  useEffect(() => {
    if (ssr) return;

    const fetchData = async () => {
      const supabase = createClient();

      const { data: productsData } = await supabase
        .from('art_products')
        .select(
          'id, slug, name, image, images, price, size, available_sizes, category, is_bestseller, status, created_at, art_product_tags(tags(id, name, slug, color))'
        )
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const tagSet = new Map<string, string>();
      (productsData || []).forEach(p => {
        (p.art_product_tags || []).forEach(apt => {
          const t = Array.isArray(apt.tags) ? apt.tags[0] : apt.tags;
          if (t?.name) tagSet.set(t.name, t.name);
        });
      });

      const { data: allTagsData } = await supabase
        .from('tags')
        .select('name')
        .order('name', { ascending: true });

      const tagNames =
        allTagsData && allTagsData.length > 0
          ? allTagsData.map((t: { name: string }) => t.name)
          : [...tagSet.values()].sort();

      setArtProducts((productsData as unknown as RawArtProduct[]) || []);
      setCategories(['All', ...tagNames]);
      setLoading(false);
    };

    fetchData();
  }, [ssr]);

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: artProducts.slice(0, 20).map((p, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `/art/${p.slug ?? p.id}`,
      name: p.name,
    })),
  };

  if (loading) {
    return (
      <>
        {META}
        <LoadingSpinner />
      </>
    );
  }

  return (
    <>
      {META}
      <Helmet>
        <script type='application/ld+json'>
          {JSON.stringify(itemListJsonLd)}
        </script>
      </Helmet>
      <ArtCollectionPage
        initialArtProducts={artProducts}
        initialCategories={categories}
      />
    </>
  );
}
