import { type ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAffiliate } from '@/context/AffiliateContext';
import {
  Home,
  Receipt,
  Wallet,
  Settings,
  Loader2,
  LogOut,
  Link2,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface AffiliateLayoutProps {
  children: ReactNode;
}

const NAV = [
  { icon: Home, label: 'Home', path: '/affiliate/dashboard' },
  { icon: Receipt, label: 'Sales', path: '/affiliate/sales' },
  { icon: Wallet, label: 'Payouts', path: '/affiliate/payouts' },
  { icon: Settings, label: 'Settings', path: '/affiliate/settings' },
] as const;

function isNavActive(pathname: string, path: string): boolean {
  if (pathname === path) return true;
  return path === '/affiliate/dashboard' && pathname === '/affiliate';
}

export function AffiliateLayout({ children }: AffiliateLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { isAuthenticated, loading, logout, affiliate } = useAffiliate();
  const [copied, setCopied] = useState(false);

  const loginPath = '/affiliate/login';
  const setPasswordPath = '/affiliate/set-password';
  const isPublicAffiliateRoute =
    pathname === loginPath || pathname === setPasswordPath;

  useEffect(() => {
    if (loading || isPublicAffiliateRoute) return;
    if (!isAuthenticated || !affiliate) {
      navigate(loginPath, { replace: true });
    }
  }, [isAuthenticated, affiliate, loading, navigate, pathname, isPublicAffiliateRoute]);

  const handleLogout = async () => {
    await logout();
    navigate('/affiliate/login');
  };

  const referralUrl = affiliate?.code
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${affiliate.code}`
    : null;

  const handleCopyLink = async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy');
    }
  };

  if (loading) {
    return (
      <div className='min-h-[100dvh] bg-[#fafafa] lg:bg-gray-50 flex items-center justify-center'>
        <Loader2 className='w-7 h-7 animate-spin text-[#f63a9e]' />
      </div>
    );
  }

  if (!isPublicAffiliateRoute && (!isAuthenticated || !affiliate)) return null;

  return (
    <div className="min-h-[100dvh] bg-[#fafafa] lg:bg-gray-50 font-['Mona_Sans',_sans-serif] flex flex-col">
      {/* Header — compact on mobile, full bar with nav on desktop */}
      <header className='sticky top-0 z-40 bg-[#fafafa]/90 lg:bg-white/95 backdrop-blur-md border-b border-gray-200/80 pt-[env(safe-area-inset-top,0px)]'>
        <div className='max-w-lg lg:max-w-6xl mx-auto px-4 lg:px-8'>
          <div className='h-14 lg:h-16 flex items-center justify-between gap-4'>
            <Link to='/affiliate/dashboard' className='flex items-center gap-2 shrink-0'>
              <div className='w-8 h-8 bg-[#f63a9e] rounded-full flex items-center justify-center'>
                <div className='w-2.5 h-2.5 bg-white rounded-full' />
              </div>
              <span className="font-['Bricolage_Grotesque',_sans-serif] text-[#f63a9e] text-lg lg:text-xl font-extrabold">
                Photify
              </span>
              <span className='hidden lg:inline text-sm text-gray-400 font-normal ml-1'>
                Affiliates
              </span>
            </Link>

            {/* Desktop horizontal nav */}
            <nav
              className='hidden lg:flex items-center gap-1 flex-1 justify-center'
              aria-label='Affiliate navigation'
            >
              {NAV.map(item => {
                const active = isNavActive(pathname, item.path);
                return (
                  <button
                    key={item.path}
                    type='button'
                    onClick={() => navigate(item.path)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-pink-50 text-[#f63a9e]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className='flex items-center gap-2 lg:gap-3 shrink-0'>
              {referralUrl && (
                <button
                  type='button'
                  onClick={handleCopyLink}
                  className='hidden lg:inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 hover:border-[#f63a9e] hover:text-[#f63a9e] transition-colors max-w-[280px]'
                >
                  <Link2 className='w-4 h-4 shrink-0' />
                  <span className='truncate font-mono text-xs'>
                    {referralUrl.replace(/^https?:\/\//, '')}
                  </span>
                  {copied ? (
                    <Check className='w-3.5 h-3.5 text-green-600 shrink-0' />
                  ) : (
                    <Copy className='w-3.5 h-3.5 shrink-0' />
                  )}
                </button>
              )}
              {affiliate?.name && (
                <span className='hidden xl:block text-sm text-gray-500 max-w-[120px] truncate'>
                  {affiliate.name}
                </span>
              )}
              <button
                type='button'
                onClick={handleLogout}
                className='p-2 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100'
                aria-label='Sign out'
              >
                <LogOut className='w-5 h-5' />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content — narrow + bottom padding on mobile; wide on desktop */}
      <main className='flex-1 overflow-y-auto pb-24 lg:pb-10'>
        <div className='max-w-lg lg:max-w-6xl mx-auto px-4 lg:px-8 py-5 lg:py-8'>
          {children}
        </div>
      </main>

      {/* Bottom nav — mobile / tablet only */}
      <nav
        className='lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom,0px)]'
        aria-label='Affiliate navigation'
      >
        <div className='max-w-lg mx-auto flex items-stretch justify-around px-1 pt-1 pb-1'>
          {NAV.map(item => {
            const Icon = item.icon;
            const active = isNavActive(pathname, item.path);
            return (
              <button
                key={item.path}
                type='button'
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[4.5rem] py-2 rounded-xl transition-colors ${
                  active ? 'text-[#f63a9e]' : 'text-gray-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : ''}`} />
                <span className='text-[10px] font-medium'>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/** Referral link card — stacked on mobile, inline on desktop */
export function ReferralShareCard({
  code,
  onCopy,
  copied,
}: {
  code: string;
  onCopy: () => void;
  copied: boolean;
}) {
  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}/r/${code}`
      : `photify.co/r/${code}`;

  return (
    <div className='rounded-2xl lg:rounded-xl bg-white border border-gray-200/80 p-4 lg:p-5 shadow-sm h-full flex flex-col justify-center'>
      <p className='text-sm text-gray-600 mb-3'>Your referral link</p>
      <div className='flex flex-col sm:flex-row lg:flex-row items-stretch sm:items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-3 lg:py-2.5'>
        <p className='flex-1 text-sm text-gray-800 truncate font-medium lg:font-mono lg:text-xs'>
          {url}
        </p>
        <button
          type='button'
          onClick={onCopy}
          className='shrink-0 h-10 lg:h-9 px-5 rounded-full lg:rounded-lg bg-[#f63a9e] text-white text-sm font-semibold hover:bg-[#e02d8d] active:scale-[0.98] transition-all'
        >
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}
