import { useEffect, useState } from 'react';
import { ArtCollectionPage } from '@/components/pages/art-collection';
import { createClient } from '@/lib/supabase/client';

export default function ArtCollections() {
  const [artProducts, setArtProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      // Fetch all art products
      const { data: productsData } = await supabase
        .from('art_products')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      // Fetch art categories
      const { data: categoriesData } = await supabase
        .from('art_categories')
        .select('name')
        .order('name', { ascending: true });

      const categoryNames = categoriesData?.map(c => c.name) || [];

      setArtProducts(productsData || []);
      setCategories(['All', ...categoryNames]);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
          <p className="mt-4 text-gray-600">Loading art collection...</p>
        </div>
      </div>
    );
  }

  return (
    <ArtCollectionPage
      initialArtProducts={artProducts}
      initialCategories={categories}
    />
  );
}
