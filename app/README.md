# Photify Frontend (app)

React 19 + Vite 7 frontend for Photify. Some public routes are
**server-rendered** by the Express server (`../server`); other routes
(cart, checkout, admin, customizers, tools) stay as a **client-only SPA**.

## Development

### Unified SSR dev (recommended)

Run both the Express API and the React frontend from the server.
The server boots Vite in middleware mode and renders SEO routes on the fly:

```bash
cd ../server
npm run dev
```

Visit `http://localhost:3000`. HMR, module transforms, and SSR all work
through the same port.

### SPA-only dev (legacy)

For quick UI work without SSR, the plain Vite dev server still runs:

```bash
cd app
npm run dev
```

Visit `http://localhost:5173`. API calls still go to the Express server
on port 3000.

## Build

```bash
cd app
npm run build        # builds both client and server bundles
```

Produces:

- `app/dist/client/` \u2014 hashed assets, served statically by Express in prod
- `app/dist/server/entry-server.js` \u2014 SSR bundle, loaded by Express

### Partial builds

```bash
npm run build:client    # client only
npm run build:server    # SSR bundle only
npm run build:spa       # legacy SPA-only build (no SSR)
```

## Routes

### Server-rendered (SEO-friendly)

These return fully-rendered HTML with meta tags and JSON-LD embedded.
Crawlers see the final content without executing JavaScript.

| Route                   | Content                              |
| ----------------------- | ------------------------------------ |
| `/`                     | Home (featured products, rooms, art) |
| `/products`             | Product listing                      |
| `/product/:id`          | Product detail                       |
| `/art/:id`              | Art product detail                   |
| `/art-collections`      | Art listing                          |
| `/category/:category`   | Category page                        |
| `/room/:id`             | Room inspiration                     |
| `/contact`              | Contact                              |
| `/privacy-policy`       | Privacy policy                       |
| `/terms-of-use`         | Terms of use                         |
| `/refund-return-policy` | Refund/returns                       |

### SPA-only (not indexed)

These render client-side and carry `<meta name="robots" content="noindex,nofollow">`:

- `/cart`, `/checkout`, `/confirmation`
- `/upload`, `/crop`, `/canvas-configurer`, `/customize/*`
- `/track-order`
- `/admin/*`

## SSR data flow

1. Browser \u2192 Express \u2192 `server/src/ssr.ts` middleware.
2. URL matched against `seoRoutes` in `app/src/ssr/loaders.ts`.
3. Matching loader queries Supabase with the server's `SUPABASE_ANON_KEY`.
4. React tree is rendered with `StaticRouter` + loader data.
5. Server injects HTML + `window.__INITIAL_DATA__` + Helmet-generated meta tags into `index.html` template.
6. Browser hydrates via `entry-client.tsx`; pages read `useConsumedInitialData(key)` to avoid a re-fetch on first render.

## SEO utilities

- `/sitemap.xml` \u2014 generated dynamically from Supabase (products, art,
  categories, rooms) plus hardcoded static routes.
- `/robots.txt` \u2014 disallows admin/cart/checkout/tool paths.

## Required env vars

### `app/.env.local`

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_APP_URL=http://localhost:3000   # used for canonical URLs
```

### `server/.env`

```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...                # for SSR loaders + sitemap
PUBLIC_APP_URL=http://localhost:3000  # canonical origin for sitemap
```
