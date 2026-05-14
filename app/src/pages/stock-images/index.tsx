import { StockImagesPage } from '@/components/pages/stock-images';
import { createServerClient } from '@/lib/supabase/server';
import { breadcrumbJsonLd, buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

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
  available_sizes:
    | { size_id: string; price: number; image_url: string }[]
    | null;
  category: string;
  is_bestseller: boolean;
  status: string;
  created_at: string;
  art_product_tags: { tags: ArtTag | ArtTag[] | null }[];
}

const TITLE = 'Stock Images — Premium Wall Art Prints | Photify';
const DESCRIPTION =
  'Browse our stock images on Photify: abstract, religion, nature, and more. Gallery-grade prints with free UK shipping over £50.';

export const meta: Route.MetaFunction = ({ data }) => {
  const art = (data?.artProducts ?? []) as Array<{
    name?: string;
    image?: string | null;
  }>;

  // Note: individual stock image photos no longer have dedicated detail pages,
  // so we no longer emit `ItemList` JSON-LD with per-item URLs.
  const jsonLd: Record<string, unknown>[] = [
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Stock Images', path: '/stock-images' },
    ]),
  ];

  return buildMeta({
    title: TITLE,
    description: DESCRIPTION,
    path: '/stock-images',
    image: art[0]?.image ?? null,
    jsonLd,
  });
};

export async function loader() {
  const supabase = createServerClient();

  const { data: productsData } = await supabase
    .from('art_products')
    .select(
      'id, slug, name, image, images, price, size, available_sizes, category, is_bestseller, status, created_at, art_product_tags(tags(id, name, slug, color))'
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const tagSet = new Map<string, string>();
  (productsData || []).forEach(p => {
    (p.art_product_tags || []).forEach((apt: { tags: ArtTag | ArtTag[] | null }) => {
      const t = Array.isArray(apt.tags) ? apt.tags[0] : apt.tags;
      if (t?.name) tagSet.set(t.name, t.name);
    });
  });

  const { data: allTagsData } = await supabase
    .from('tags')
    .select('name')
    .order('name', { ascending: true });

  const tagNames =
    allTagsData && allTagsData.length > 0
      ? allTagsData.map((t: { name: string }) => t.name)
      : [...tagSet.values()].sort();

  return {
    artProducts: (productsData as unknown as RawArtProduct[]) ?? [],
    categories: tagNames,
  };
}

export default function StockImages({ loaderData }: Route.ComponentProps) {
  return (
    <StockImagesPage
      initialArtProducts={loaderData.artProducts}
      initialCategories={loaderData.categories}
    />
  );
}
