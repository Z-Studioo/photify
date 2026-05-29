import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ClientOnly } from '@/components/shared/client-only';
import { setAffiliateRef } from '@/lib/affiliate-ref';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Redirecting… | Photify',
    description: 'Following your referral link to Photify.',
    path: '/r',
    noindex: true,
  });

function ReferralRedirect() {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const slug = (code || '').trim().toUpperCase();
    if (slug) {
      setAffiliateRef(slug);
      const url = `${import.meta.env.VITE_API_URL || ''}/api/affiliates/track-click`;
      try {
        void fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: slug }),
          keepalive: true,
        }).catch(() => {});
      } catch {
        /* track failure must never block the redirect */
      }
    }
    navigate('/', { replace: true });
  }, [code, navigate]);

  return (
    <div className='min-h-screen flex items-center justify-center text-gray-500 text-sm'>
      Redirecting…
    </div>
  );
}

export default function ReferralRedirectRoute() {
  return (
    <ClientOnly>
      <ReferralRedirect />
    </ClientOnly>
  );
}
