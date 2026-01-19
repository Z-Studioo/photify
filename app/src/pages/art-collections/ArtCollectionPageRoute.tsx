import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ArtCollectionPage } from '@/pages/art-collections';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export default function ArtCollections() {
  const supabase = createClient();

  const [artProducts, setArtProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch all art products
      const { data: artProducts } = await supabase
        .from('art_products')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      // Fetch art categories
      const { data: categories } = await supabase
        .from('art_categories')
        .select('name')
        .order('name', { ascending: true });

      const categoryNames = categories?.map(c => c.name) || [];

      setArtProducts(artProducts || []);
      setCategories(['All', ...categoryNames]);

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ArtCollectionPage
      initialArtProducts={artProducts}
      initialCategories={categories}
    />
  );
}
