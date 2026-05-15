import { writeFile } from 'node:fs/promises';
import { resolve as resolvePath } from 'node:path';
import type { Config } from '@react-router/dev/config';
import { loadEnv } from 'vite';

const SITE_URL = (process.env.VITE_PUBLIC_SITE_URL || 'https://photify.co').replace(
  /\/$/,
  ''
);

interface StaticEntry {
  path: string;
  changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority?: number;
}

/**
 * Customer-facing static routes that should be indexed + listed in sitemap.
 * Under hybrid SSR these are rendered live on each request; the list is kept
 * here so the sitemap stays in sync with the route table.
 */
const STATIC_CUSTOMER_ROUTES: StaticEntry[] = [
  { path: '/', changefreq: 'daily', priority: 1.0 },
  { path: '/products', changefreq: 'daily', priority: 0.9 },
  { path: '/category', changefreq: 'weekly', priority: 0.8 },
  { path: '/stock-images', changefreq: 'daily', priority: 0.9 },
  { path: '/contact', changefreq: 'yearly', priority: 0.4 },
  { path: '/privacy-policy', changefreq: 'yearly', priority: 0.2 },
  { path: '/terms-of-use', changefreq: 'yearly', priority: 0.2 },
  { path: '/refund-return-policy', changefreq: 'yearly', priority: 0.2 },
];

/**
 * Routes we still want to bake as plain HTML at build time so the Node SSR
 * server can short-circuit them with zero runtime cost. Limit this to pages
 * whose content is genuinely static (legal copy, etc.).
 */
const PRERENDER_PATHS: string[] = [
  '/privacy-policy',
  '/terms-of-use',
  '/refund-return-policy',
];

interface DynamicPaths {
  productPaths: string[];
  categoryPaths: string[];
}

async function fetchDynamicPaths(): Promise<DynamicPaths> {
  const env = loadEnv('', process.cwd(), 'VITE_');
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      '[sitemap] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing; using static routes only.'
    );
    return { productPaths: [], categoryPaths: [] };
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [products, categories] = await Promise.all([
      supabase
        .from('products')
        .select('slug, updated_at')
        .eq('active', true),
      supabase
        .from('categories')
        .select('slug, updated_at')
        .eq('is_active', true),
    ]);

    return {
      productPaths: (products.data || [])
        .filter(p => p.slug)
        .map(p => `/product/${p.slug}`),
      categoryPaths: (categories.data || [])
        .filter(c => c.slug)
        .map(c => `/category/${c.slug}`),
    };
  } catch (err) {
    console.warn('[sitemap] Supabase fetch failed:', err);
    return { productPaths: [], categoryPaths: [] };
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSitemapXml(paths: {
  staticEntries: StaticEntry[];
  dynamic: DynamicPaths;
}): string {
  const today = new Date().toISOString().slice(0, 10);

  const allEntries: StaticEntry[] = [
    ...paths.staticEntries,
    ...paths.dynamic.categoryPaths.map(
      p => ({ path: p, changefreq: 'weekly', priority: 0.7 }) as StaticEntry
    ),
    ...paths.dynamic.productPaths.map(
      p => ({ path: p, changefreq: 'weekly', priority: 0.8 }) as StaticEntry
    ),
  ];

  const seen = new Set<string>();
  const deduped = allEntries.filter(e => {
    if (seen.has(e.path)) return false;
    seen.add(e.path);
    return true;
  });

  const urls = deduped
    .map(entry => {
      const loc = `${SITE_URL}${entry.path === '/' ? '' : entry.path}`;
      return [
        '  <url>',
        `    <loc>${escapeXml(loc)}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : '',
        entry.priority != null
          ? `    <priority>${entry.priority.toFixed(1)}</priority>`
          : '',
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export default {
  appDirectory: 'src',
  ssr: true,
  async prerender() {
    return PRERENDER_PATHS;
  },
  async buildEnd({ reactRouterConfig }) {
    const outDir =
      reactRouterConfig.buildDirectory ?? resolvePath(process.cwd(), 'build');
    const clientDir = resolvePath(outDir, 'client');

    let dynamic: DynamicPaths = {
      productPaths: [],
      categoryPaths: [],
    };
    try {
      dynamic = await fetchDynamicPaths();
    } catch (err) {
      console.warn('[buildEnd] dynamic path fetch failed:', err);
    }

    try {
      const xml = buildSitemapXml({
        staticEntries: STATIC_CUSTOMER_ROUTES,
        dynamic,
      });
      const target = resolvePath(clientDir, 'sitemap.xml');
      await writeFile(target, xml, 'utf8');
      console.log(
        `[buildEnd] wrote sitemap with ${
          STATIC_CUSTOMER_ROUTES.length +
          dynamic.productPaths.length +
          dynamic.categoryPaths.length
        } URLs → ${target}`
      );
    } catch (err) {
      console.warn('[buildEnd] failed to write sitemap.xml:', err);
    }
  },
  future: {
    unstable_optimizeDeps: true,
  },
} satisfies Config;
