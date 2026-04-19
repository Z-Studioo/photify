import { HomePage } from '@/components/pages/home';
import { createServerClient } from '@/lib/supabase/server';
import {
  buildMeta,
  breadcrumbJsonLd,
  itemListJsonLd,
  type ItemListEntry,
} from '@/lib/seo';
import type { Route } from './+types/index';

const HOME_TITLE = 'Photify — Personalised Canvas & Art Prints';
const HOME_DESCRIPTION =
  'Turn your photos into premium canvas prints, framed art, and personalised wall decor. Museum-quality printing, fade-resistant inks, free UK shipping over £50.';

export const meta: Route.MetaFunction = ({ data }) => {
  const featured = (data?.featuredProducts ?? []) as Array<{
    name?: string;
    slug?: string | null;
    images?: string[] | null;
  }>;

  const items: ItemListEntry[] = featured
    .filter(p => p.slug && p.name)
    .map(p => ({
      name: p.name!,
      path: `/product/${p.slug}`,
      image: p.images?.[0] ?? null,
    }));

  const jsonLd: Record<string, unknown>[] = [
    breadcrumbJsonLd([{ name: 'Home', path: '/' }]),
  ];
  if (items.length) jsonLd.push(itemListJsonLd(items, 'Featured products'));

  return buildMeta({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    path: '/',
    image: featured[0]?.images?.[0] ?? null,
    jsonLd,
  });
};

export async function loader() {
  const supabase = createServerClient();

  const [productsRes, roomsRes, artRes] = await Promise.all([
    supabase
      .from('products')
      .select(
        'id, name, slug, images, price, fixed_price, config, is_featured, active, product_type'
      )
      .eq('is_featured', true)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('rooms')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })
      .limit(4),
    supabase
      .from('art_products')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  return {
    featuredProducts: productsRes.data ?? [],
    rooms: roomsRes.data ?? [],
    artProducts: artRes.data ?? [],
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <HomePage
      initialFeaturedProducts={loaderData.featuredProducts}
      initialRooms={loaderData.rooms}
      initialArtProducts={loaderData.artProducts}
    />
  );
}
