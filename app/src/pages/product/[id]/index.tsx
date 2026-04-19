import { redirect } from 'react-router';
import { ProductDetailPage } from '@/components/pages/product/[id]';
import { createServerClient } from '@/lib/supabase/server';
import {
  breadcrumbJsonLd,
  buildMeta,
  clampDescription,
  productJsonLd,
} from '@/lib/seo';
import { getListingDisplayAmount } from '@/lib/product-starting-price';
import type { Route } from './+types/index';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function loader({ params }: Route.LoaderArgs) {
  const productId = params.id;
  const supabase = createServerClient();
  const isUUID = UUID_RE.test(productId);

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(isUUID ? `id.eq.${productId}` : `slug.eq.${productId}`)
    .single();

  if (error || !data) {
    throw new Response('Not Found', { status: 404 });
  }

  // 301 redirect UUID → slug so only the slug URL is canonical / indexable.
  if (isUUID && data.slug && data.slug !== productId) {
    throw redirect(`/product/${data.slug}`, 301);
  }

  return { product: data, productSlug: data.slug || productId };
}

export const meta: Route.MetaFunction = ({ data, params }) => {
  const slug = (data?.productSlug || params?.id) as string;
  const path = `/product/${slug}`;

  if (!data?.product) {
    return buildMeta({
      title: 'Product | Photify',
      description: 'Explore this product on Photify.',
      path,
    });
  }

  const product = data.product as Record<string, unknown> & {
    name?: string;
    slug?: string;
    description?: string;
    images?: string[] | null;
    meta_title?: string | null;
    meta_description?: string | null;
    active?: boolean;
    config?: unknown;
    fixed_price?: number | null;
    price?: number | string;
  };

  const name = (product.meta_title || product.name || 'Product').trim();
  const title = name.toLowerCase().includes('photify') ? name : `${name} | Photify`;
  const description =
    clampDescription(product.meta_description) ??
    clampDescription(product.description) ??
    `Shop ${name} at Photify — premium quality print, free UK shipping over £50.`;
  const image = product.images?.[0] ?? null;
  const startingPrice = getListingDisplayAmount({
    config: product.config,
    fixed_price: product.fixed_price ?? null,
    price: product.price ?? 0,
  });

  const jsonLd: Record<string, unknown>[] = [
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Products', path: '/products' },
      { name, path },
    ]),
    productJsonLd({
      name,
      description: product.description ?? description,
      image: product.images ?? null,
      url: path,
      price: startingPrice,
      availability: product.active === false ? 'OutOfStock' : 'InStock',
    }),
  ];

  return buildMeta({
    title,
    description,
    path,
    image,
    type: 'product',
    jsonLd,
  });
};

export default function ProductPage({ loaderData }: Route.ComponentProps) {
  return (
    <ProductDetailPage
      initialProduct={loaderData.product}
      productSlug={loaderData.productSlug}
    />
  );
}
