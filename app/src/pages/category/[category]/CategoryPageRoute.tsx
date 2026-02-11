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
  tags: Tag[];
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
}

export default function Category() {
  const supabase = createClient();
  const { category } = useParams();

  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
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

      const { data: tagsData } = await supabase.from('tags').select('*');
      setTags(tagsData || []);

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
    id,
    name,
    slug,
    images,
    price,
    is_featured,
    active,
    created_at,
    product_categories!inner(category_id),
    product_tags(
      tags (
        id,
        name,
        slug,
        description,
        color
      )
    )
    `
        )
        .eq('product_categories.category_id', categoryData.id)
        .eq('active', true)
        .order('created_at', { ascending: false });

      const normalizedProducts =
        productsData?.map(product => ({
          ...product,
          tags: product.product_tags?.map((pt: any) => pt.tags) ?? [],
        })) ?? [];

      setProducts(normalizedProducts as any);
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
      tags={tags}
    />
  );
}
