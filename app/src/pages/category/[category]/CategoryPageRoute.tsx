import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createClient } from '@/lib/supabase/client';
import { CategoryPage } from '@/pages/category/[category]';
import NotFound from '@/pages/not-found';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Helmet } from '@dr.pogodin/react-helmet';
import { useConsumedInitialData } from '@/ssr/InitialDataContext';
import { useCanonicalUrl } from '@/lib/seo';

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
  config?: unknown;
  fixed_price?: number | null;
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

interface CategoryInitialData {
  categoryData: Category | null;
  products: Product[];
  tags: Tag[];
}

export default function CategoryRoute() {
  const supabase = createClient();
  const { category } = useParams();
  const ssr = useConsumedInitialData<CategoryInitialData>('category');

  const [categoryData, setCategoryData] = useState<Category | null>(
    ssr?.categoryData ?? null
  );
  const [products, setProducts] = useState<Product[]>(ssr?.products ?? []);
  const [tags, setTags] = useState<Tag[]>(ssr?.tags ?? []);
  const [loading, setLoading] = useState(!ssr);
  const [notFound, setNotFound] = useState(Boolean(ssr && !ssr.categoryData));

  useEffect(() => {
    if (ssr) return;
    if (!category) return;

    const fetchCategoryAndProducts = async () => {
      setLoading(true);

      const { data: categoryRow, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', category)
        .eq('is_active', true)
        .single();

      const { data: tagsData } = await supabase.from('tags').select('*');
      setTags(tagsData || []);

      if (categoryError || !categoryRow) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setCategoryData(categoryRow);

      const { data: productsData } = await supabase
        .from('products')
        .select(
          `
    id,
    name,
    slug,
    images,
    price,
    fixed_price,
    config,
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
        .eq('product_categories.category_id', categoryRow.id)
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
  }, [category, ssr, supabase]);

  const canonical = useCanonicalUrl();
  const title = categoryData
    ? `${categoryData.name} | Photify`
    : 'Category | Photify';
  const description =
    categoryData?.description ||
    `Shop ${categoryData?.name ?? 'our collection'} at Photify.`;
  const image = categoryData?.image_url ?? '';

  const breadcrumbJsonLd = categoryData
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: '/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Products',
            item: '/products',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: categoryData.name,
            item: `/category/${categoryData.slug}`,
          },
        ],
      }
    : null;

  if (loading) {
    return (
      <>
        <Helmet>
          <title>{title}</title>
          <meta name='description' content={description} />
        </Helmet>
        <LoadingSpinner />
      </>
    );
  }

  if (notFound || !categoryData) {
    return <NotFound />;
  }

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name='description' content={description} />
        <meta name='robots' content='index,follow' />
        <link rel='canonical' href={canonical} />
        <meta property='og:type' content='website' />
        <meta property='og:url' content={canonical} />
        <meta property='og:title' content={title} />
        <meta property='og:description' content={description} />
        {image ? <meta property='og:image' content={image} /> : null}
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={title} />
        <meta name='twitter:description' content={description} />
        {image ? <meta name='twitter:image' content={image} /> : null}
        {breadcrumbJsonLd ? (
          <script type='application/ld+json'>
            {JSON.stringify(breadcrumbJsonLd)}
          </script>
        ) : null}
      </Helmet>
      <CategoryPage
        initialCategoryData={categoryData}
        initialProducts={products}
        tags={tags}
      />
    </>
  );
}
