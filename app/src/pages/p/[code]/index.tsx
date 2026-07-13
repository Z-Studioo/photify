import { useEffect } from 'react';
import { useParams } from 'react-router';
import { ClientOnly } from '@/components/shared/client-only';
import { setPromoLandingRef } from '@/lib/promo-landing-ref';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Applying your offer… | Photify',
    description: 'Applying your promotional offer on Photify.',
    path: '/p',
    noindex: true,
  });

function PromoLandingRedirect() {
  const { code } = useParams();

  useEffect(() => {
    const slug = (code || '').trim().toUpperCase();
    if (slug) {
      setPromoLandingRef(slug);
    }
    // Hard redirect (not SPA navigate) so the app boots fresh and
    // CartContext reads the just-written cookie on mount — this also keeps
    // the landing page independent of any context/provider wiring.
    window.location.replace('/');
  }, [code]);

  return (
    <div className='min-h-screen flex items-center justify-center text-gray-500 text-sm'>
      Applying your offer…
    </div>
  );
}

export default function PromoLandingRedirectRoute() {
  return (
    <ClientOnly>
      <PromoLandingRedirect />
    </ClientOnly>
  );
}
