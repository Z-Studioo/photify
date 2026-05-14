import {
  CategoriesPage,
  type CategoriesListItem,
} from '@/components/pages/categories';
import { createServerClient } from '@/lib/supabase/server';
import {
  breadcrumbJsonLd,
  buildMeta,
  itemListJsonLd,
  type ItemListEntry,
} from '@/lib/seo';
import type { Route } from './+types/index';

const TITLE = 'Shop by Category — Canvas Prints & Wall Art | Photify';
const DESCRIPTION =
  'Browse every Photify collection — single canvases, gallery walls, collages, framed prints and more. Premium quality, free UK shipping over £50.';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  bg_color: string | null;
  display_order: number | null;
  is_active: boolean;
  active_product_count?: number | null;
  product_count?: number | null;
}

function categoryHref(slug: string): string {
  return slug === 'art-collection' ? '/stock-images' : `/category/${slug}`;
}

export async function loader() {
  const supabase = createServerClient();

  // Prefer the counts view (used elsewhere in the app); fall back to the
  // base table if the view isn't present in this environment.
  let { data, error } = await supabase
    .from('v_categories_with_counts')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error && error.code === '42P01') {
    const fallback = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    data = fallback.data;
    error = fallback.error;
  }

  const rows = (data ?? []) as CategoryRow[];

  const categories: CategoriesListItem[] = rows.map(row => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    icon: row.icon,
    image_url: row.image_url,
    bg_color: row.bg_color,
    display_order: row.display_order,
    is_active: row.is_active,
    product_count: row.active_product_count ?? row.product_count ?? null,
  }));

  return { categories };
}

export const meta: Route.MetaFunction = ({ data }) => {
  const categories = (data?.categories ?? []) as CategoriesListItem[];

  const items: ItemListEntry[] = categories
    .filter(c => c.slug && c.name)
    .slice(0, 24)
    .map(c => ({
      name: c.name,
      path: categoryHref(c.slug),
      image: c.image_url ?? null,
    }));

  const jsonLd: Record<string, unknown>[] = [
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Categories', path: '/category' },
    ]),
  ];
  if (items.length) jsonLd.push(itemListJsonLd(items, 'Categories'));

  return buildMeta({
    title: TITLE,
    description: DESCRIPTION,
    path: '/category',
    image: categories.find(c => c.image_url)?.image_url ?? null,
    jsonLd,
  });
};

export default function Categories({ loaderData }: Route.ComponentProps) {
  return <CategoriesPage initialCategories={loaderData.categories} />;
}
