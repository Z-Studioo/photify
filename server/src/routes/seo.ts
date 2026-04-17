import express, { type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/config/environment';

const router = express.Router();

function getBaseUrl(req: Request): string {
  const envUrl = process.env.PUBLIC_APP_URL || process.env.VITE_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host');
  return `${proto}://${host}`;
}

function getSupabase() {
  const url = config.SUPABASE_URL;
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    config.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('seo: supabase env vars missing');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const STATIC_ROUTES = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/products', priority: 0.9, changefreq: 'daily' },
  { path: '/art-collections', priority: 0.9, changefreq: 'daily' },
  { path: '/contact', priority: 0.5, changefreq: 'yearly' },
  { path: '/privacy-policy', priority: 0.3, changefreq: 'yearly' },
  { path: '/terms-of-use', priority: 0.3, changefreq: 'yearly' },
  { path: '/refund-return-policy', priority: 0.3, changefreq: 'yearly' },
];

type SlugRow = { slug: string | null; id: string; updated_at?: string };

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(opts: {
  loc: string;
  lastmod?: string | undefined;
  changefreq?: string;
  priority?: number;
}): string {
  const parts = [`    <loc>${escapeXml(opts.loc)}</loc>`];
  if (opts.lastmod) parts.push(`    <lastmod>${opts.lastmod}</lastmod>`);
  if (opts.changefreq)
    parts.push(`    <changefreq>${opts.changefreq}</changefreq>`);
  if (typeof opts.priority === 'number')
    parts.push(`    <priority>${opts.priority.toFixed(1)}</priority>`);
  return `  <url>\n${parts.join('\n')}\n  </url>`;
}

router.get('/sitemap.xml', async (req: Request, res: Response) => {
  const base = getBaseUrl(req);
  const entries: string[] = [];

  for (const r of STATIC_ROUTES) {
    entries.push(
      urlEntry({
        loc: `${base}${r.path}`,
        changefreq: r.changefreq,
        priority: r.priority,
      })
    );
  }

  try {
    const supabase = getSupabase();
    const [products, arts, categories, rooms] = await Promise.all([
      supabase
        .from('products')
        .select('id, slug, updated_at')
        .eq('active', true),
      supabase
        .from('art_products')
        .select('id, slug, updated_at')
        .eq('status', 'active'),
      supabase
        .from('categories')
        .select('id, slug, updated_at')
        .eq('is_active', true),
      supabase
        .from('rooms')
        .select('id, slug, updated_at')
        .eq('active', true),
    ]);

    for (const row of (products.data ?? []) as SlugRow[]) {
      const slug = row.slug || row.id;
      entries.push(
        urlEntry({
          loc: `${base}/product/${slug}`,
          lastmod: row.updated_at,
          changefreq: 'weekly',
          priority: 0.8,
        })
      );
    }
    for (const row of (arts.data ?? []) as SlugRow[]) {
      const slug = row.slug || row.id;
      entries.push(
        urlEntry({
          loc: `${base}/art/${slug}`,
          lastmod: row.updated_at,
          changefreq: 'weekly',
          priority: 0.8,
        })
      );
    }
    for (const row of (categories.data ?? []) as SlugRow[]) {
      const slug = row.slug || row.id;
      entries.push(
        urlEntry({
          loc: `${base}/category/${slug}`,
          lastmod: row.updated_at,
          changefreq: 'weekly',
          priority: 0.7,
        })
      );
    }
    for (const row of (rooms.data ?? []) as SlugRow[]) {
      const slug = row.slug || row.id;
      entries.push(
        urlEntry({
          loc: `${base}/room/${slug}`,
          lastmod: row.updated_at,
          changefreq: 'monthly',
          priority: 0.5,
        })
      );
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[sitemap]', err);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

  res
    .status(200)
    .set({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    })
    .send(xml);
});

router.get('/robots.txt', (req: Request, res: Response) => {
  const base = getBaseUrl(req);
  const body = [
    'User-agent: *',
    'Disallow: /admin',
    'Disallow: /cart',
    'Disallow: /checkout',
    'Disallow: /confirmation',
    'Disallow: /upload',
    'Disallow: /crop',
    'Disallow: /canvas-configurer',
    'Disallow: /customize',
    'Disallow: /track-order',
    'Allow: /',
    '',
    `Sitemap: ${base}/sitemap.xml`,
    '',
  ].join('\n');

  res
    .status(200)
    .set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    })
    .send(body);
});

export default router;
