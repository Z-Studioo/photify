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

/**
 * Internal / non-SEO static routes. They still need to be prerendered so
 * that direct hits and reloads on the deployed static host serve a real
 * `<path>/index.html` instead of 404'ing — but they should NOT appear in
 * the sitemap (most are noindex anyway).
 *
 * Keep this list in sync with `app/src/routes.ts` whenever a new top-level
 * page is added that has no route params.
 */
const STATIC_INTERNAL_ROUTES: string[] = [
  // Tool / configurator flows
  '/canvas-configurer',
  '/upload',
  '/crop',
  '/customize/multi-canvas-wall',
  '/customize/event-canvas',
  '/customize/single-canvas',
  '/customize/photo-collage-creator',
  '/customize/product-3d-view',

  // Customer order flow
  '/cart',
  '/checkout',
  '/confirmation',
  '/track-order',

  // Admin (all noindex via meta)
  '/admin/login',
  '/admin/dashboard',
  '/admin/analytics',
  '/admin/categories',
  '/admin/orders',
  '/admin/promotions',
  '/admin/promotions/new',
  '/admin/rooms',
  '/admin/rooms/new',
  '/admin/products',
  '/admin/products/new',
  '/admin/art-collection',
  '/admin/settings',
  '/admin/settings/size-pricing',
  '/admin/customers',
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
      '[prerender] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing; using static routes only.'
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
    console.warn('[prerender] Supabase fetch failed:', err);
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

/**
 * Build a Netlify-style `_redirects` file for Render Static Sites.
 *
 * Why this is needed:
 *   With `ssr: false` + `prerender`, React Router writes each prerendered
 *   route as `<path>/index.html` plus a sibling `<path>.data`. Render does
 *   NOT auto-resolve `/foo` -> `/foo/index.html` for nested paths, so a
 *   blanket `/*  /__spa-fallback.html  200` rewrite ends up serving the SPA
 *   shell for routes that already have a prerendered HTML — and the SPA
 *   shell then fails to fetch the `.data` payload (it gets HTML back).
 *
 * Order matters: Render evaluates rules top-to-bottom, first match wins.
 *   1. Explicit rule per prerendered path -> serve its real index.html.
 *   2. Catch-all -> SPA fallback for any non-prerendered route.
 *
 * Note: `.data` files live at literal paths (e.g. `/foo.data`) and exist on
 * disk, so Render serves them directly without needing a rule.
 */
function buildRedirects(paths: {
  staticPaths: string[];
  dynamic: DynamicPaths;
}): string {
  const allPrerenderedPaths = new Set<string>([
    ...paths.staticPaths,
    ...paths.dynamic.productPaths,
    ...paths.dynamic.categoryPaths,
  ]);

  // The home page ('/') is served by /index.html natively by Render — no rule
  // needed and adding one would shadow the SPA fallback for unknown routes.
  allPrerenderedPaths.delete('/');

  const lines: string[] = [
    '# Auto-generated by react-router.config.ts buildEnd. Do not edit by hand.',
    '# Render Static Site rewrites (Netlify _redirects syntax).',
    '',
  ];

  for (const p of [...allPrerenderedPaths].sort()) {
    // Use 200 (rewrite) so the URL stays clean in the address bar.
    lines.push(`${p}  ${p}/index.html  200`);
  }

  lines.push('');
  lines.push('# SPA fallback for everything else (admin pages, checkout, etc.)');
  lines.push('/*  /__spa-fallback.html  200');
  lines.push('');

  return lines.join('\n');
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
    const { productPaths, categoryPaths } = await fetchDynamicPaths();

    // Every static path that should produce its own <path>/index.html on
    // disk so the static host can serve direct hits / reloads natively.
    const staticPaths = [
      ...STATIC_CUSTOMER_ROUTES.map(r => r.path),
      ...STATIC_INTERNAL_ROUTES,
    ];

    const all = [...staticPaths, ...productPaths, ...categoryPaths];

    console.log(
      `[prerender] ${all.length} routes (${staticPaths.length} static, ${productPaths.length} products, ${categoryPaths.length} categories)`
    );
    return all;
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

    try {
      const staticPaths = [
        ...STATIC_CUSTOMER_ROUTES.map(r => r.path),
        ...STATIC_INTERNAL_ROUTES,
      ];
      const redirects = buildRedirects({ staticPaths, dynamic });
      const target = resolvePath(clientDir, '_redirects');
      await writeFile(target, redirects, 'utf8');
      const ruleCount =
        staticPaths.filter(p => p !== '/').length +
        dynamic.productPaths.length +
        dynamic.categoryPaths.length;
      console.log(
        `[buildEnd] wrote _redirects with ${ruleCount} prerender rules + SPA fallback → ${target}`
      );
    } catch (err) {
      console.warn('[buildEnd] failed to write _redirects:', err);
    }
  },
  future: {
    unstable_optimizeDeps: true,
  },
} satisfies Config;
