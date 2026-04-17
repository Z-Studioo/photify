import express, { type Request, type Response, type NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { config } from '@/config/environment';

/**
 * Express middleware mounting for SSR of SEO-critical routes.
 *
 * - In development, boots Vite in middleware-mode. HTML template and the
 *   server entry module are loaded on every request for HMR.
 * - In production, serves the prebuilt client assets from
 *   `<app>/dist/client/*` and loads the compiled SSR bundle from
 *   `<app>/dist/server/entry-server.js`.
 *
 * Only the URLs listed in `seoRoutes` (exported from the SSR bundle) are
 * server-rendered. All other paths fall through to a bare SPA shell.
 */

type LoaderResult = {
  key: string;
  data: unknown;
  status?: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LoaderContext = {
  // The concrete SupabaseClient generic signature differs between
  // @supabase/supabase-js copies in the server vs. the app bundle. From
  // the server's perspective the loader is a black box, so typing the
  // client as `unknown` keeps both sides decoupled.
  supabase: unknown;
  params: Record<string, string | undefined>;
  url: URL;
};

type Loader = (ctx: LoaderContext) => Promise<LoaderResult | null>;

type RouteDef = {
  pattern: string;
  loader: Loader;
};

type RenderOptions = {
  url: string;
  initialData?: Record<string, unknown>;
};

type RenderResult = {
  html: string;
  helmet: {
    title: string;
    meta: string;
    link: string;
    script: string;
    htmlAttributes: string;
    bodyAttributes: string;
  };
};

type ServerEntry = {
  render: (opts: RenderOptions) => Promise<RenderResult>;
  matchSeoRoute: (
    pathname: string
  ) => { route: RouteDef; params: Record<string, string> } | null;
  seoRoutes: RouteDef[];
};

const APP_ROOT = path.resolve(__dirname, '../../app');
const CLIENT_BUILD = path.join(APP_ROOT, 'dist', 'client');
const SERVER_BUILD = path.join(APP_ROOT, 'dist', 'server', 'entry-server.js');
const INDEX_HTML = path.join(APP_ROOT, 'index.html');
const PROD_INDEX_HTML = path.join(CLIENT_BUILD, 'index.html');

const isProd = config.NODE_ENV === 'production';

function getSupabaseAnonKey(): string | undefined {
  return (
    process.env.SUPABASE_ANON_KEY ||
    // Fall back to the Vite-prefixed client key if it's present in env.
    process.env.VITE_SUPABASE_ANON_KEY ||
    undefined
  );
}

function createSSRSupabase() {
  const url = config.SUPABASE_URL;
  const key = getSupabaseAnonKey() || config.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error(
      'SSR: missing SUPABASE_URL or SUPABASE_ANON_KEY env vars'
    );
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function escapeForScript(data: unknown): string {
  // Prevent </script> injection and unicode line separator issues.
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function injectSSR(
  template: string,
  opts: {
    appHtml: string;
    headHtml: string;
    titleHtml?: string;
    initialData: Record<string, unknown>;
    ssrFlag: boolean;
  }
): string {
  const dataScript = `<script>window.__INITIAL_DATA__=${escapeForScript(
    opts.initialData
  )};${opts.ssrFlag ? 'window.__SSR__=true;' : ''}</script>`;

  // Strip or replace the template's fallback <title>. Helmet always renders
  // a <title> (possibly empty) on SEO pages, so we replace the entire marker
  // block with helmet's title when available, otherwise keep the default.
  const titleReplaced = opts.titleHtml
    ? template.replace(
        /<!--ssr-title-->[\s\S]*?<!--\/ssr-title-->/,
        opts.titleHtml
      )
    : template
        .replace('<!--ssr-title-->', '')
        .replace('<!--/ssr-title-->', '');

  return titleReplaced
    .replace('<!--ssr-head-->', opts.headHtml)
    .replace('<!--ssr-outlet-->', opts.appHtml)
    .replace('<!--ssr-initial-data-->', dataScript);
}

async function loadServerEntry(): Promise<ServerEntry> {
  // Dynamic import so CommonJS `require` can consume the ESM SSR bundle.
  const mod = (await import(SERVER_BUILD)) as unknown as Record<string, unknown>;
  const candidate = (mod['default'] ?? mod) as Partial<ServerEntry>;
  if (typeof candidate.render !== 'function') {
    throw new Error(
      `SSR: server bundle at ${SERVER_BUILD} does not export \`render\``
    );
  }
  return candidate as ServerEntry;
}

/**
 * Minimal structural type for the parts of Vite's dev server we use. Keeps
 * `vite` out of the server workspace's compile-time deps (it's resolved at
 * runtime from the app workspace via node module resolution).
 */
type ViteDevServer = {
  middlewares: express.RequestHandler;
  transformIndexHtml: (url: string, html: string) => Promise<string>;
  ssrLoadModule: (url: string) => Promise<unknown>;
  ssrFixStacktrace: (err: Error) => void;
};
type ViteModule = {
  createServer: (config: {
    root: string;
    server: { middlewareMode: boolean };
    appType: 'custom';
  }) => Promise<ViteDevServer>;
};

/**
 * Development mode: return an Express sub-app that proxies through Vite.
 */
async function createDevSSRMiddleware() {
  // Dynamic import with a string variable so `tsc` doesn't try to resolve
  // 'vite' from the server's node_modules — Vite only lives in the app
  // workspace and is only needed in development.
  const viteModuleId = 'vite';
  const { createServer: createViteServer } = (await import(
    viteModuleId
  )) as ViteModule;

  const vite = await createViteServer({
    root: APP_ROOT,
    server: { middlewareMode: true },
    appType: 'custom',
  });

  const router = express.Router();

  router.use(vite.middlewares);

  // SSR handler runs AFTER vite middleware so it can intercept HTML requests.
  // But since vite.middlewares handles module/asset requests and passes HTML
  // through, we mount our handler as a catch-all.
  router.use(async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();

    const url = req.originalUrl.split('?')[0] || req.originalUrl;

    try {
      const templateRaw = await fs.promises.readFile(INDEX_HTML, 'utf-8');
      const template = await vite.transformIndexHtml(
        req.originalUrl,
        templateRaw
      );

      const entryUrl = path.join(APP_ROOT, 'src', 'entry-server.tsx');
      const entry = (await vite.ssrLoadModule(entryUrl)) as unknown as ServerEntry;

      await renderAndSend({ entry, template, url: req.originalUrl, pathname: url, res });
    } catch (err) {
      if (err instanceof Error) vite.ssrFixStacktrace(err);
      // eslint-disable-next-line no-console
      console.error('[SSR dev]', err);
      next(err);
    }
  });

  return router;
}

/**
 * Production mode: serve static assets + prebuilt SSR bundle.
 */
function createProdSSRMiddleware() {
  const router = express.Router();

  // Serve hashed assets aggressively, HTML minimally.
  router.use(
    express.static(CLIENT_BUILD, {
      index: false,
      maxAge: '1y',
      setHeaders(res, filePath) {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    })
  );

  let cachedEntry: ServerEntry | null = null;
  let cachedTemplate: string | null = null;

  router.use(async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();

    const pathname = req.originalUrl.split('?')[0] || req.originalUrl;

    try {
      if (!cachedEntry) {
        cachedEntry = await loadServerEntry();
      }
      if (!cachedTemplate) {
        cachedTemplate = await fs.promises.readFile(PROD_INDEX_HTML, 'utf-8');
      }

      await renderAndSend({
        entry: cachedEntry,
        template: cachedTemplate,
        url: req.originalUrl,
        pathname,
        res,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[SSR prod]', err);
      next(err);
    }
  });

  return router;
}

/**
 * Shared render pipeline.
 */
async function renderAndSend(args: {
  entry: ServerEntry;
  template: string;
  url: string;
  pathname: string;
  res: Response;
}) {
  const { entry, template, url, pathname, res } = args;
  const match = entry.matchSeoRoute(pathname);

  // Non-SEO path: serve the bare SPA shell with a noindex default so that
  // cart / checkout / admin / tool pages aren't indexed by crawlers that
  // don't execute JS.
  if (!match) {
    const html = injectSSR(template, {
      appHtml: '',
      headHtml: '<meta name="robots" content="noindex,nofollow">',
      initialData: {},
      ssrFlag: false,
    });
    res
      .status(200)
      .set({
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      })
      .end(html);
    return;
  }

  // Run the loader. On DB failure we fall back to SPA to avoid a 5xx.
  let loaderResult: LoaderResult | null = null;
  try {
    const supabase = createSSRSupabase();
    const parsedUrl = new URL(url, 'http://localhost');
    loaderResult = await match.route.loader({
      supabase,
      params: match.params,
      url: parsedUrl,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[SSR loader]', match.route.pattern, err);
  }

  const status = loaderResult?.status ?? 200;
  const initialData: Record<string, unknown> = loaderResult
    ? { [loaderResult.key]: loaderResult.data }
    : {};

  let rendered: RenderResult;
  try {
    rendered = await entry.render({ url, initialData });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[SSR render]', err);
    // Fall back to SPA shell on render failure.
    const html = injectSSR(template, {
      appHtml: '',
      headHtml: '',
      initialData: {},
      ssrFlag: false,
    });
    res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    return;
  }

  const headHtml = [
    rendered.helmet.meta,
    rendered.helmet.link,
    rendered.helmet.script,
  ].join('\n');

  const titleHtml = rendered.helmet.title?.trim() || undefined;

  const html = injectSSR(template, {
    appHtml: rendered.html,
    headHtml,
    ...(titleHtml ? { titleHtml } : {}),
    initialData,
    ssrFlag: true,
  });

  const cacheControl =
    status === 200
      ? 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
      : 'no-store';

  res
    .status(status)
    .set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': cacheControl,
    })
    .end(html);
}

/**
 * Public entry: register the SSR middleware on the given Express app.
 * Call this AFTER your API routes have been mounted.
 */
export async function mountSSR(app: express.Application): Promise<void> {
  if (isProd) {
    app.use(createProdSSRMiddleware());
  } else {
    app.use(await createDevSSRMiddleware());
  }
}
