import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createClient } from '@/lib/supabase/client';
import { CategoryPage } from '@/pages/category/[category]';
import NotFound from '@/pages/not-found';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  images: string[];
  size: string | null;
  price: number;
  is_featured: boolean;
  active: boolean;
}

export default function Category() {
  const supabase = createClient();
  const { category } = useParams();

  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!category) return;

    const fetchCategoryAndProducts = async () => {
      setLoading(true);

      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', category)
        .eq('is_active', true)
        .single();

      if (categoryError || !categoryData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setCategoryData(categoryData);

      const { data: productsData } = await supabase
        .from('products')
        .select(
          `
          *,
          product_categories!inner(category_id)
        `
        )
        .eq('product_categories.category_id', categoryData.id)
        .eq('active', true)
        .order('created_at', { ascending: false });

      setProducts(productsData || []);
      setLoading(false);
    };

    fetchCategoryAndProducts();
  }, [category]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (notFound || !categoryData) {
    return <NotFound />;
  }

  return (
    <CategoryPage
      initialCategoryData={categoryData}
      initialProducts={products}
    />
  );
}
