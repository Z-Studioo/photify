import { useEffect, useState } from 'react';
import { ArtCollectionPage } from '@/components/pages/art-collection';
import { createClient } from '@/lib/supabase/client';
import { Helmet } from '@dr.pogodin/react-helmet';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

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
  available_sizes: { size_id: string; price: number; image_url: string }[] | null;
  category: string;
  is_bestseller: boolean;
  status: string;
  created_at: string;
  art_product_tags: { tags: ArtTag | ArtTag[] | null }[];
}

export default function ArtCollections() {
  const [artProducts, setArtProducts] = useState<RawArtProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      // Fetch all art products with their tags
      const { data: productsData } = await supabase
        .from('art_products')
        .select('id, slug, name, image, images, price, size, available_sizes, category, is_bestseller, status, created_at, art_product_tags(tags(id, name, slug, color))')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Derive filter tags from all products' tags (deduplicated)
      const tagSet = new Map<string, string>();
      (productsData || []).forEach((p) => {
        (p.art_product_tags || []).forEach((apt) => {
          const t = Array.isArray(apt.tags) ? apt.tags[0] : apt.tags;
          if (t?.name) tagSet.set(t.name, t.name);
        });
      });

      // Also fetch all available tags from the tags table
      const { data: allTagsData } = await supabase
        .from('tags')
        .select('name')
        .order('name', { ascending: true });

      // Use all tags from tags table; fall back to tags from products
      const tagNames = allTagsData && allTagsData.length > 0
        ? allTagsData.map((t: { name: string }) => t.name)
        : [...tagSet.values()].sort();

      setArtProducts((productsData as unknown as RawArtProduct[]) || []);
      setCategories(['All', ...tagNames]);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
    <Helmet>
      <title>Art Collections | Photify</title>
      <meta
        name="description"
        content="Explore our curated art collections at Photify. Discover stunning art products to enhance your space."
      />
      <meta name="robots" content="index,follow" />
    </Helmet>
    <ArtCollectionPage
      initialArtProducts={artProducts}
      initialCategories={categories}
      />
      </>
  );
}
