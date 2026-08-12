import { useLocation } from 'react-router';
import { Store, CalendarDays } from 'lucide-react';
import { useStoreStatus } from '@/lib/supabase/hooks';
import {
  isStoreCurrentlyClosed,
  formatReopenDate,
  type StoreStatus,
} from '@/lib/store-status';
import { SITE_NAME } from '@/lib/seo';

// The admin panel must stay reachable so the store can be reopened, and the
// affiliate portal is a partner area rather than part of the shop.
const EXEMPT_PREFIXES = [
  '/admin',
  '/affiliate/login',
  '/affiliate/set-password',
  '/affiliate/dashboard',
  '/affiliate/sales',
  '/affiliate/payouts',
  '/affiliate/settings',
];

/**
 * Full-page gate mounted around the router outlet. While the `store_status`
 * site setting says the store is closed, every customer-facing route renders
 * the closed screen instead of the page. Renders children while the setting
 * loads so a slow network never blanks the site.
 */
export function StoreClosedGate({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { status } = useStoreStatus();

  const exempt = EXEMPT_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (exempt || !status || !isStoreCurrentlyClosed(status)) {
    return <>{children}</>;
  }

  return <StoreClosedScreen status={status} />;
}

function StoreClosedScreen({ status }: { status: StoreStatus }) {
  const reopenLabel = status.reopen_date
    ? formatReopenDate(status.reopen_date)
    : null;

  return (
    <main className='flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-pink-50 via-white to-white px-6 py-16 text-center'>
      <div className='mx-auto w-full max-w-lg'>
        <div className='mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-pink-100'>
          <Store className='h-10 w-10 text-[#f63a9e]' aria-hidden />
        </div>

        <h1 className="font-['Bricolage_Grotesque',_sans-serif] text-3xl font-semibold text-gray-900 sm:text-4xl">
          We&rsquo;re temporarily closed
        </h1>

        <p className='mt-4 text-base leading-relaxed text-gray-600'>
          {status.message.trim() !== ''
            ? status.message
            : `${SITE_NAME} isn't accepting new orders right now. Thank you for your patience — we'll be back soon.`}
        </p>

        {reopenLabel && (
          <div className='mt-8 inline-flex items-center gap-2.5 rounded-full border border-pink-200 bg-white px-5 py-3 shadow-sm'>
            <CalendarDays className='h-5 w-5 text-[#f63a9e]' aria-hidden />
            <span className='text-sm font-medium text-gray-800'>
              Reopening on <span className='font-semibold'>{reopenLabel}</span>
            </span>
          </div>
        )}

        <p className='mt-10 text-sm text-gray-400'>
          Orders already placed are unaffected and will be fulfilled as normal.
        </p>
      </div>
    </main>
  );
}
