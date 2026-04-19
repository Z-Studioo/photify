import { ProductsPage } from '@/components/pages/products';
import { createServerClient } from '@/lib/supabase/server';
import {
  breadcrumbJsonLd,
  buildMeta,
  itemListJsonLd,
  type ItemListEntry,
} from '@/lib/seo';
import type { Route } from './+types/index';

const TITLE = 'All Products — Canvas Prints & Wall Art | Photify';
const DESCRIPTION =
  'Browse every Photify product: single canvases, multi-canvas walls, collages, posters, and framed prints. Free UK shipping over £50.';

export const meta: Route.MetaFunction = ({ data }) => {
  const products = (data?.products ?? []) as Array<{
    name?: string;
    slug?: string | null;
    images?: string[] | null;
  }>;

  const items: ItemListEntry[] = products
    .filter(p => p.slug && p.name)
    .slice(0, 24)
    .map(p => ({
      name: p.name!,
      path: `/product/${p.slug}`,
      image: p.images?.[0] ?? null,
    }));

  const jsonLd: Record<string, unknown>[] = [
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Products', path: '/products' },
    ]),
  ];
  if (items.length) jsonLd.push(itemListJsonLd(items, 'Products'));

  return buildMeta({
    title: TITLE,
    description: DESCRIPTION,
    path: '/products',
    image: products[0]?.images?.[0] ?? null,
    jsonLd,
  });
};

export async function loader() {
  const supabase = createServerClient();

  const [productsRes, categoriesRes] = await Promise.all([
    supabase
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
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
  ]);

  return {
    products: productsRes.data ?? [],
    categories: categoriesRes.data ?? [],
  };
}

export default function Products({ loaderData }: Route.ComponentProps) {
  return (
    <ProductsPage
      initialProducts={loaderData.products}
      initialCategories={loaderData.categories}
    />
  );
}
