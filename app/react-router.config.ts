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

/** Customer-facing static routes that should be indexed + listed in sitemap. */
const STATIC_CUSTOMER_ROUTES: StaticEntry[] = [
  { path: '/', changefreq: 'daily', priority: 1.0 },
  { path: '/products', changefreq: 'daily', priority: 0.9 },
  { path: '/art-collections', changefreq: 'daily', priority: 0.9 },
  { path: '/contact', changefreq: 'yearly', priority: 0.4 },
  { path: '/privacy-policy', changefreq: 'yearly', priority: 0.2 },
  { path: '/terms-of-use', changefreq: 'yearly', priority: 0.2 },
  { path: '/refund-return-policy', changefreq: 'yearly', priority: 0.2 },
];

interface DynamicPaths {
  productPaths: string[];
  artPaths: string[];
  categoryPaths: string[];
}

async function fetchDynamicPaths(): Promise<DynamicPaths> {
  const env = loadEnv('', process.cwd(), 'VITE_');
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      '[prerender] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing; using static routes only.'
    );
    return { productPaths: [], artPaths: [], categoryPaths: [] };
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [products, arts, categories] = await Promise.all([
      supabase
        .from('products')
        .select('slug, updated_at')
        .eq('active', true),
      supabase
        .from('art_products')
        .select('slug, updated_at')
        .eq('status', 'active'),
      supabase
        .from('categories')
        .select('slug, updated_at')
        .eq('is_active', true),
    ]);

    return {
      productPaths: (products.data || [])
        .filter(p => p.slug)
        .map(p => `/product/${p.slug}`),
      artPaths: (arts.data || []).filter(a => a.slug).map(a => `/art/${a.slug}`),
      categoryPaths: (categories.data || [])
        .filter(c => c.slug)
        .map(c => `/category/${c.slug}`),
    };
  } catch (err) {
    console.warn('[prerender] Supabase fetch failed:', err);
    return { productPaths: [], artPaths: [], categoryPaths: [] };
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
    ...paths.dynamic.artPaths.map(
      p => ({ path: p, changefreq: 'weekly', priority: 0.8 }) as StaticEntry
    ),
  ];

  // De-duplicate.
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
  ssr: false,
  async prerender() {
    const { productPaths, artPaths, categoryPaths } = await fetchDynamicPaths();

    const staticPaths = [
      ...STATIC_CUSTOMER_ROUTES.map(r => r.path),
      '/track-order',
    ];

    const all = [...staticPaths, ...productPaths, ...artPaths, ...categoryPaths];

    console.log(
      `[prerender] ${all.length} routes (${productPaths.length} products, ${artPaths.length} arts, ${categoryPaths.length} categories)`
    );
    return all;
  },
  async buildEnd({ reactRouterConfig }) {
    try {
      const dynamic = await fetchDynamicPaths();
      const xml = buildSitemapXml({
        staticEntries: STATIC_CUSTOMER_ROUTES,
        dynamic,
      });

      const outDir =
        reactRouterConfig.buildDirectory ??
        resolvePath(process.cwd(), 'build');
      const clientDir = resolvePath(outDir, 'client');
      const target = resolvePath(clientDir, 'sitemap.xml');
      await writeFile(target, xml, 'utf8');
      console.log(`[buildEnd] wrote sitemap with ${
        STATIC_CUSTOMER_ROUTES.length +
        dynamic.productPaths.length +
        dynamic.artPaths.length +
        dynamic.categoryPaths.length
      } URLs → ${target}`);
    } catch (err) {
      console.warn('[buildEnd] failed to write sitemap.xml:', err);
    }
  },
  future: {
    unstable_optimizeDeps: true,
  },
} satisfies Config;
