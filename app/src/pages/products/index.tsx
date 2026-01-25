import { ProductsPage } from '@/components/pages/products';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Helmet } from '@dr.pogodin/react-helmet';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      // Fetch all active products with categories
      const { data: productsData } = await supabase
        .from('products')
        .select(`
          *,
          product_categories(
            category:categories(*)
          )
        `)
        .eq('active', true)
        .order('created_at', { ascending: false });

      // Fetch all active categories for filter dropdown
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
  }, []);


  return (
    <>
      <Helmet>
        <title>Products | Photify</title>
        <meta
          name="description"
          content="Browse our collection of active products and explore categories."
        />
        <meta name="robots" content="index,follow" />
      </Helmet>
      {loading ? <LoadingSpinner /> :(
        <ProductsPage initialProducts={products} initialCategories={categories} />
      )}
    </>
  );
}
