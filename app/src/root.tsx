import { useState } from 'react';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from 'react-router';
import type { LinksFunction } from 'react-router';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { CartProvider } from '@/context/CartContext';
import { AdminProvider } from '@/context/AdminContext';
import { UploadProvider } from '@/context/UploadContext';
import { PresetProvider } from '@/context/PresetContext';
import { ToastProvider } from '@/components/shared/common/toast';
import { CookieConsent } from '@/components/shared/cookie-consent';
import stylesheet from './index.css?url';
import {
  SITE_LANG,
  SITE_NAME,
  SITE_URL,
  DEFAULT_OG_IMAGE,
  organizationJsonLd,
  websiteJsonLd,
} from '@/lib/seo';
import type { Route } from './+types/root';

const FAVICON_URL =
  'https://mhlmbpnyckrqyznwmbwo.supabase.co/storage/v1/object/public/photify/public/Vector%201.png';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'icon', type: 'image/png', href: FAVICON_URL },
  { rel: 'apple-touch-icon', href: FAVICON_URL },

  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  { rel: 'preconnect', href: 'https://mhlmbpnyckrqyznwmbwo.supabase.co' },
  { rel: 'preconnect', href: 'https://images.unsplash.com' },
  { rel: 'dns-prefetch', href: 'https://mhlmbpnyckrqyznwmbwo.supabase.co' },
  { rel: 'dns-prefetch', href: 'https://images.unsplash.com' },
];

export const meta: Route.MetaFunction = () => [
  { charSet: 'utf-8' },
  {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
  },
  { title: `${SITE_NAME} — Personalised Canvas & Art Prints` },
  {
    name: 'description',
    content:
      'Turn your photos into premium canvas prints, framed art, and personalised wall decor. Museum-quality printing, fade-resistant inks, free UK shipping over £50.',
  },
  {
    name: 'keywords',
    content:
      'photo canvas prints, personalised wall art, custom canvas UK, photo collage, framed prints, photo gifts, art prints, photo on canvas',
  },
  {
    name: 'robots',
    content: 'index,follow,max-image-preview:large,max-snippet:-1',
  },
  { name: 'theme-color', content: '#f63a9e' },
  { name: 'msapplication-TileColor', content: '#f63a9e' },
  { name: 'format-detection', content: 'telephone=no' },
  { name: 'application-name', content: SITE_NAME },
  { name: 'apple-mobile-web-app-title', content: SITE_NAME },
  { name: 'apple-mobile-web-app-capable', content: 'yes' },
  { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },

  { tagName: 'link', rel: 'canonical', href: SITE_URL },

  { property: 'og:type', content: 'website' },
  { property: 'og:site_name', content: SITE_NAME },
  { property: 'og:locale', content: 'en_GB' },
  { property: 'og:url', content: SITE_URL },
  { property: 'og:title', content: `${SITE_NAME} — Personalised Canvas & Art Prints` },
  {
    property: 'og:description',
    content:
      'Turn your photos into premium canvas prints and personalised wall decor with free UK shipping over £50.',
  },
  { property: 'og:image', content: DEFAULT_OG_IMAGE },
  { property: 'og:image:alt', content: `${SITE_NAME} logo` },

  { name: 'twitter:card', content: 'summary_large_image' },
  { name: 'twitter:title', content: `${SITE_NAME} — Personalised Canvas & Art Prints` },
  {
    name: 'twitter:description',
    content:
      'Turn your photos into premium canvas prints and personalised wall decor with free UK shipping over £50.',
  },
  { name: 'twitter:image', content: DEFAULT_OG_IMAGE },

  { 'script:ld+json': organizationJsonLd() },
  { 'script:ld+json': websiteJsonLd() },
];

// Google Analytics (gtag.js) loader, gated by runtime hostname so it only
// fires on the live photify.co domains. Staging, preview deploys and local
// development never load the gtag script even though the snippet is in the
// shipped bundle. Inlined in <head> (rather than a React component) so it
// runs before hydration and matches the ordering Google recommends.
const GA_MEASUREMENT_ID = 'G-36QQ67296N';
const GA_ALLOWED_HOSTNAMES = ['photify.co', 'www.photify.co'];
const GA_INLINE_SNIPPET = `(function(){
  try {
    var allowed = ${JSON.stringify(GA_ALLOWED_HOSTNAMES)};
    var host = (window.location && window.location.hostname) || '';
    if (allowed.indexOf(host) === -1) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}';
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}');
  } catch (_) { /* analytics must never break the app */ }
})();`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={SITE_LANG}>
      <head>
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: GA_INLINE_SNIPPET }} />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  // Create the QueryClient per request to avoid leaking cache across SSR
  // responses on the Node server.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ToastProvider>
          <CartProvider>
            <AdminProvider>
              <UploadProvider>
                <PresetProvider>
                  <Outlet />
                  <CookieConsent />
                </PresetProvider>
              </UploadProvider>
            </AdminProvider>
          </CartProvider>
        </ToastProvider>
      </HelmetProvider>
      <Toaster richColors />
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center'>
      <h1 className='text-4xl font-bold'>{message}</h1>
      <p className='text-muted-foreground'>{details}</p>
      {stack && (
        <pre className='max-w-full overflow-x-auto rounded bg-zinc-100 p-4 text-left text-xs'>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
