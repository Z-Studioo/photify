import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * A Supabase client suitable for SSR. The server is responsible for
 * creating this with its own env vars (SUPABASE_URL + SUPABASE_ANON_KEY)
 * before invoking any loader below.
 */
export type SSRSupabase = SupabaseClient;

export type LoaderContext = {
  supabase: SSRSupabase;
  params: Record<string, string | undefined>;
  url: URL;
};

export type LoaderResult = {
  /**
   * Key under which the data is exposed in `window.__INITIAL_DATA__[key]`.
   * Used by `useInitialData(key)` on the client.
   */
  key: string;
  data: unknown;
  /** Optional HTTP status to return (e.g. 404 for missing product). */
  status?: number;
};

export type Loader = (ctx: LoaderContext) => Promise<LoaderResult | null>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// --- Tier 1 loaders ---------------------------------------------------------

export const homeLoader: Loader = async ({ supabase }) => {
  const [{ data: products }, { data: rooms }, { data: art }] =
    await Promise.all([
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
    key: 'home',
    data: {
      featuredProducts: products ?? [],
      rooms: rooms ?? [],
      artProducts: art ?? [],
    },
  };
};

export const productsLoader: Loader = async ({ supabase }) => {
  const [{ data: products }, { data: categories }] = await Promise.all([
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
    key: 'products',
    data: {
      products: products ?? [],
      categories: categories ?? [],
    },
  };
};

export const productDetailLoader: Loader = async ({ supabase, params }) => {
  const id = params.id;
  if (!id) return { key: 'productDetail', data: null, status: 404 };

  const isUUID = UUID_RE.test(id);
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(isUUID ? `id.eq.${id}` : `slug.eq.${id}`)
    .maybeSingle();

  if (error || !data) {
    return { key: 'productDetail', data: null, status: 404 };
  }

  return { key: 'productDetail', data };
};

export const artDetailLoader: Loader = async ({ supabase, params }) => {
  const id = params.id;
  if (!id) return { key: 'artDetail', data: null, status: 404 };

  const isUUID = UUID_RE.test(id);
  const { data, error } = await supabase
    .from('art_products')
    .select('*, art_product_tags(tag_id, tags(id, name, slug))')
    .or(isUUID ? `id.eq.${id}` : `slug.eq.${id}`)
    .maybeSingle();

  if (error || !data) {
    return { key: 'artDetail', data: null, status: 404 };
  }

  return { key: 'artDetail', data };
};

export const artCollectionsLoader: Loader = async ({ supabase }) => {
  const { data: products } = await supabase
    .from('art_products')
    .select(
      'id, slug, name, image, images, price, size, available_sizes, category, is_bestseller, status, created_at, art_product_tags(tags(id, name, slug, color))'
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const { data: allTags } = await supabase
    .from('tags')
    .select('name')
    .order('name', { ascending: true });

  const tagSet = new Map<string, string>();
  (products ?? []).forEach((p: { art_product_tags?: { tags: unknown }[] }) => {
    (p.art_product_tags ?? []).forEach(apt => {
      const t = Array.isArray(apt.tags) ? apt.tags[0] : apt.tags;
      if (t && typeof t === 'object' && 'name' in t) {
        tagSet.set((t as { name: string }).name, (t as { name: string }).name);
      }
    });
  });

  const tagNames =
    allTags && allTags.length > 0
      ? allTags.map((t: { name: string }) => t.name)
      : [...tagSet.values()].sort();

  return {
    key: 'artCollections',
    data: {
      artProducts: products ?? [],
      categories: ['All', ...tagNames],
    },
  };
};

export const categoryLoader: Loader = async ({ supabase, params }) => {
  const slug = params.category;
  if (!slug) return { key: 'category', data: null, status: 404 };

  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (categoryError || !categoryData) {
    return { key: 'category', data: null, status: 404 };
  }

  const [{ data: productsData }, { data: tagsData }] = await Promise.all([
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
    supabase.from('tags').select('*'),
  ]);

  const normalizedProducts = (productsData ?? []).map(
    (product: { product_tags?: { tags: unknown }[] } & Record<string, unknown>) => ({
      ...product,
      tags: product.product_tags?.map(pt => pt.tags) ?? [],
    })
  );

  return {
    key: 'category',
    data: {
      categoryData,
      products: normalizedProducts,
      tags: tagsData ?? [],
    },
  };
};

export const roomLoader: Loader = async ({ supabase, params }) => {
  const id = params.id;
  if (!id) return { key: 'room', data: null, status: 404 };

  const isUUID = UUID_RE.test(id);
  const { data } = await supabase
    .from('rooms')
    .select('*')
    .or(isUUID ? `id.eq.${id}` : `slug.eq.${id}`)
    .maybeSingle();

  return {
    key: 'room',
    data: data ?? null,
    status: data ? undefined : 404,
  };
};

// --- Tier 2 loaders (no data, just present for matcher) ---------------------

const staticLoader =
  (key: string): Loader =>
  async () => ({ key, data: null });

export const contactLoader = staticLoader('contact');
export const privacyPolicyLoader = staticLoader('privacyPolicy');
export const termsOfUseLoader = staticLoader('termsOfUse');
export const refundReturnPolicyLoader = staticLoader('refundReturnPolicy');

// --- Route registry ---------------------------------------------------------

export type RouteDef = {
  /** Express-style path pattern, e.g. `/product/:id`. */
  pattern: string;
  loader: Loader;
};

export const seoRoutes: RouteDef[] = [
  { pattern: '/', loader: homeLoader },
  { pattern: '/products', loader: productsLoader },
  { pattern: '/product/:id', loader: productDetailLoader },
  { pattern: '/art/:id', loader: artDetailLoader },
  { pattern: '/art-collections', loader: artCollectionsLoader },
  { pattern: '/category/:category', loader: categoryLoader },
  { pattern: '/room/:id', loader: roomLoader },
  { pattern: '/contact', loader: contactLoader },
  { pattern: '/privacy-policy', loader: privacyPolicyLoader },
  { pattern: '/terms-of-use', loader: termsOfUseLoader },
  { pattern: '/refund-return-policy', loader: refundReturnPolicyLoader },
];

/**
 * Match a URL path against the SEO route list. Returns the matched loader
 * plus extracted params, or null if none of the SEO routes match.
 */
export function matchSeoRoute(pathname: string): {
  route: RouteDef;
  params: Record<string, string>;
} | null {
  for (const route of seoRoutes) {
    const match = matchPattern(route.pattern, pathname);
    if (match) return { route, params: match };
  }
  return null;
}

function matchPattern(
  pattern: string,
  pathname: string
): Record<string, string> | null {
  const pSeg = pattern.split('/').filter(Boolean);
  const uSeg = pathname.split('/').filter(Boolean);

  // Root "/"
  if (pattern === '/') {
    return pathname === '/' || pathname === '' ? {} : null;
  }

  if (pSeg.length !== uSeg.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < pSeg.length; i++) {
    const pp = pSeg[i]!;
    const up = uSeg[i]!;
    if (pp.startsWith(':')) {
      params[pp.slice(1)] = decodeURIComponent(up);
    } else if (pp !== up) {
      return null;
    }
  }
  return params;
}
