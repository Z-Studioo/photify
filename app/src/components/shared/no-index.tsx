import { Helmet } from '@dr.pogodin/react-helmet';

/**
 * Apply `<meta name="robots" content="noindex,nofollow">` for pages that
 * should never appear in search results (cart, checkout, admin, internal
 * tools). The server SSR handler also injects this into the SPA shell,
 * but adding it via Helmet ensures it stays correct after client-side
 * navigations between SPA routes.
 */
export function NoIndex({ title }: { title?: string } = {}) {
  return (
    <Helmet>
      {title ? <title>{title}</title> : null}
      <meta name='robots' content='noindex,nofollow' />
      <meta name='googlebot' content='noindex,nofollow' />
    </Helmet>
  );
}
