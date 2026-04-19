import { CategoryPage } from '@/pages/category/[category]';
import { createServerClient } from '@/lib/supabase/server';
import {
  breadcrumbJsonLd,
  buildMeta,
  clampDescription,
  itemListJsonLd,
  type ItemListEntry,
} from '@/lib/seo';
import type { Route } from './+types/CategoryPageRoute';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
}

export async function loader({ params }: Route.LoaderArgs) {
  const category = params.category;
  const supabase = createServerClient();

  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', category)
    .eq('is_active', true)
    .single();

  if (categoryError || !categoryData) {
    throw new Response('Not Found', { status: 404 });
  }

  const [tagsRes, productsRes] = await Promise.all([
    supabase.from('tags').select('*'),
    supabase
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
      .eq('product_categories.category_id', categoryData.id)
      .eq('active', true)
      .order('created_at', { ascending: false }),
  ]);

  const normalizedProducts =
    productsRes.data?.map(product => ({
      ...product,
      tags: product.product_tags?.map((pt: any) => pt.tags) ?? [],
    })) ?? [];

  return {
    categoryData: categoryData as Category,
    products: normalizedProducts as any[],
    tags: (tagsRes.data as Tag[]) ?? [],
  };
}

export const meta: Route.MetaFunction = ({ data, params }) => {
  const slug = params?.category || data?.categoryData?.slug || '';
  const path = `/category/${slug}`;

  if (!data?.categoryData) {
    return buildMeta({
      title: 'Category | Photify',
      description: 'Explore product categories on Photify.',
      path,
    });
  }

  const category = data.categoryData;
  const name = category.name;
  const title = `${name} — Canvas Prints & Wall Art | Photify`;
  const description =
    clampDescription(category.description) ||
    `Shop ${name} on Photify — premium canvas prints and wall art with free UK shipping over £50.`;

  const items: ItemListEntry[] = (data.products ?? [])
    .filter((p: any) => p?.slug && p?.name)
    .slice(0, 24)
    .map((p: any) => ({
      name: p.name,
      path: `/product/${p.slug}`,
      image: Array.isArray(p.images) ? p.images[0] : null,
    }));

  const jsonLd: Record<string, unknown>[] = [
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Products', path: '/products' },
      { name, path },
    ]),
  ];
  if (items.length) jsonLd.push(itemListJsonLd(items, `${name} products`));

  return buildMeta({
    title,
    description,
    path,
    image: category.image_url ?? (data.products?.[0]?.images?.[0] ?? null),
    jsonLd,
  });
};

export default function Category({ loaderData }: Route.ComponentProps) {
  return (
    <CategoryPage
      initialCategoryData={loaderData.categoryData}
      initialProducts={loaderData.products}
      tags={loaderData.tags}
    />
  );
}
