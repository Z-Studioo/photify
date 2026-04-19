import { redirect } from 'react-router';
import { ArtDetailPage } from '@/components/pages/art/detail';
import { createServerClient } from '@/lib/supabase/server';
import {
  breadcrumbJsonLd,
  buildMeta,
  clampDescription,
  productJsonLd,
} from '@/lib/seo';
import type { Route } from './+types/index';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function loader({ params }: Route.LoaderArgs) {
  const id = params.id;
  const supabase = createServerClient();
  const isUUID = UUID_RE.test(id);

  const { data, error } = await supabase
    .from('art_products')
    .select('*, art_product_tags(tag_id, tags(id, name, slug))')
    .or(isUUID ? `id.eq.${id}` : `slug.eq.${id}`)
    .single();

  if (error || !data) {
    throw new Response('Not Found', { status: 404 });
  }

  // 301 redirect UUID → slug for a single canonical URL per artwork.
  if (isUUID && data.slug && data.slug !== id) {
    throw redirect(`/art/${data.slug}`, 301);
  }

  return { product: data as Record<string, unknown> };
}

export const meta: Route.MetaFunction = ({ data, params }) => {
  const product = (data?.product ?? null) as
    | (Record<string, unknown> & {
        name?: string;
        slug?: string;
        description?: string;
        image?: string | null;
        images?: string[] | null;
        meta_title?: string | null;
        meta_description?: string | null;
        price?: string | number | null;
        status?: string;
      })
    | null;

  const slug = (product?.slug || params?.id || '') as string;
  const path = `/art/${slug}`;

  if (!product) {
    return buildMeta({
      title: 'Art | Photify',
      description: 'Explore art prints on Photify.',
      path,
    });
  }

  const name = (product.meta_title || product.name || 'Art').trim();
  const title = name.toLowerCase().includes('photify') ? name : `${name} | Photify`;
  const description =
    clampDescription(product.meta_description) ??
    clampDescription(product.description) ??
    `${name} — premium art print available in multiple sizes on Photify.`;

  const imagesRaw: string[] = Array.isArray(product.images)
    ? (product.images as string[])
    : [];
  const images = [product.image, ...imagesRaw].filter(
    (x): x is string => typeof x === 'string' && x.length > 0
  );

  const price =
    typeof product.price === 'number'
      ? product.price
      : typeof product.price === 'string'
        ? parseFloat(product.price.replace(/[^0-9.]/g, ''))
        : null;

  const jsonLd: Record<string, unknown>[] = [
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Art Collections', path: '/art-collections' },
      { name, path },
    ]),
    productJsonLd({
      name,
      description,
      image: images,
      url: path,
      price: Number.isFinite(price) && (price as number) > 0 ? (price as number) : null,
      availability: product.status === 'active' ? 'InStock' : 'OutOfStock',
    }),
  ];

  return buildMeta({
    title,
    description,
    path,
    image: images[0] ?? null,
    type: 'product',
    jsonLd,
  });
};

export default function ArtPage({ loaderData }: Route.ComponentProps) {
  return <ArtDetailPage artProduct={loaderData.product} />;
}
