import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AffiliateLayout, ReferralShareCard } from './affiliate-layout';
import { useAffiliate } from '@/context/AffiliateContext';
import { affiliateFetch } from './affiliate-api';
import { toast } from 'sonner';
import { ChevronRight, Loader2 } from 'lucide-react';

interface Stats {
  clicks_30d: number;
  clicks_total: number;
  orders_count: number;
  orders_count_30d: number;
  revenue_total: number;
  revenue_30d: number;
  pending_amount: number;
  approved_amount: number;
  paid_amount: number;
  reversed_amount: number;
  payable_amount: number;
}

interface ClickPoint {
  day: string;
  click_count: number;
}

function money(value: number | string | null | undefined): string {
  const n = typeof value === 'number' ? value : Number(value) || 0;
  return `£${n.toFixed(2)}`;
}

function firstName(full?: string | null): string {
  if (!full) return 'there';
  return full.trim().split(/\s+/)[0] || 'there';
}

export function AffiliateDashboardPage() {
  const navigate = useNavigate();
  const { getAccessToken, affiliate } = useAffiliate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [clicks, setClicks] = useState<ClickPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getAccessToken();
      try {
        const [statsRes, clicksRes] = await Promise.all([
          affiliateFetch<{ data: Stats | null }>('/api/affiliates/me/stats', { token }),
          affiliateFetch<{ data: ClickPoint[] }>('/api/affiliates/me/clicks?days=30', {
            token,
          }),
        ]);
        if (cancelled) return;
        setStats(statsRes.data);
        setClicks(clicksRes.data || []);
      } catch {
        /* swallow */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getAccessToken]);

  const chartDays = useMemo(() => {
    const map = new Map(clicks.map(c => [c.day, c.click_count]));
    const out: { label: string; shortLabel: string; clicks: number }[] = [];
    const today = new Date();
    const dayCount = 30;
    for (let i = dayCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({
        label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        shortLabel: d.toLocaleDateString('en-GB', { weekday: 'narrow' }),
        clicks: map.get(key) || 0,
      });
    }
    return out;
  }, [clicks]);

  // Mobile: last 14 days for bar chart; desktop uses full 30 in same component with smaller bars
  const mobileChartDays = chartDays.slice(-14);

  const maxClicksMobile = Math.max(1, ...mobileChartDays.map(d => d.clicks));
  const maxClicksDesktop = Math.max(1, ...chartDays.map(d => d.clicks));
  const totalClicks30 = chartDays.reduce((s, d) => s + d.clicks, 0);

  const referralUrl = affiliate?.code
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${affiliate.code}`
    : null;

  const handleCopy = async () => {
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

  const payoutMin = Number(affiliate?.payout_min ?? 50);
  const payable = Number(stats?.payable_amount ?? 0);
  const payoutProgress = Math.min(100, (payable / payoutMin) * 100);

  if (loading) {
    return (
      <AffiliateLayout>
        <div className='flex flex-col items-center justify-center py-20 lg:py-32 gap-3'>
          <Loader2 className='w-7 h-7 animate-spin text-[#f63a9e]' />
          <p className='text-sm text-gray-500'>Loading your stats…</p>
        </div>
      </AffiliateLayout>
    );
  }

  const balanceHero = (
    <section className='rounded-3xl lg:rounded-2xl bg-gradient-to-br from-[#f63a9e] to-[#e02d8d] p-5 lg:p-8 text-white shadow-lg shadow-pink-200/40 lg:shadow-pink-200/30 h-full flex flex-col justify-between'>
      <div>
        <p className='text-sm lg:text-base text-white/80'>Ready to withdraw</p>
        <p className="font-['Bricolage_Grotesque',_sans-serif] text-4xl lg:text-5xl font-bold mt-1 tracking-tight">
          {money(stats?.payable_amount)}
        </p>
        <p className='text-xs lg:text-sm text-white/70 mt-2 max-w-md'>
          {payable >= payoutMin
            ? 'You’ve reached the minimum payout threshold — we’ll include this in the next run.'
            : `${money(payoutMin - payable)} until the £${payoutMin.toFixed(0)} minimum`}
        </p>
        <div className='mt-4 lg:mt-6 h-1.5 rounded-full bg-white/25 overflow-hidden max-w-md'>
          <div
            className='h-full rounded-full bg-white transition-all duration-500'
            style={{ width: `${payoutProgress}%` }}
          />
        </div>
      </div>
      <div className='mt-6 lg:mt-8 flex flex-wrap gap-8 lg:gap-12 text-sm'>
        <div>
          <p className='text-white/70 text-xs uppercase tracking-wide'>Pending</p>
          <p className='font-semibold text-lg lg:text-xl mt-0.5'>{money(stats?.pending_amount)}</p>
        </div>
        <div>
          <p className='text-white/70 text-xs uppercase tracking-wide'>Paid out</p>
          <p className='font-semibold text-lg lg:text-xl mt-0.5'>{money(stats?.paid_amount)}</p>
        </div>
        <div className='hidden lg:block'>
          <p className='text-white/70 text-xs uppercase tracking-wide'>Lifetime revenue</p>
          <p className='font-semibold text-lg lg:text-xl mt-0.5'>{money(stats?.revenue_total)}</p>
        </div>
      </div>
    </section>
  );

  return (
    <AffiliateLayout>
      <div className='space-y-5 lg:space-y-8'>
        {/* Page intro */}
        <div className='lg:flex lg:items-end lg:justify-between lg:gap-8'>
          <div>
            <p className='text-sm text-gray-500'>Hey {firstName(affiliate?.name)},</p>
            <h1 className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 text-2xl lg:text-3xl font-bold tracking-tight mt-0.5">
              Here&apos;s how you&apos;re doing
            </h1>
          </div>
          <p className='hidden lg:block text-sm text-gray-500 max-w-sm text-right'>
            Earn 10% on every referred sale. Commission is approved after delivery and the
            holding period.
          </p>
        </div>

        {/* Top row: balance + referral (side by side on desktop) */}
        <div className='lg:grid lg:grid-cols-5 lg:gap-6'>
          <div className='lg:col-span-3'>{balanceHero}</div>
          {affiliate?.code && (
            <div className='mt-5 lg:mt-0 lg:col-span-2'>
              <ReferralShareCard code={affiliate.code} onCopy={handleCopy} copied={copied} />
            </div>
          )}
        </div>

        {/* Stats — 2×2 mobile, 4-col desktop */}
        <section className='grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4'>
          <MiniStat label='Clicks (30 days)' value={String(stats?.clicks_30d ?? 0)} />
          <MiniStat label='Sales (30 days)' value={String(stats?.orders_count_30d ?? 0)} />
          <MiniStat label='Revenue (30 days)' value={money(stats?.revenue_30d)} />
          <MiniStat label='Lifetime sales' value={String(stats?.orders_count ?? 0)} />
        </section>

        {/* Chart + quick links */}
        <div className='lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start'>
          <section className='rounded-2xl lg:rounded-xl bg-white border border-gray-200/80 p-4 lg:p-6 shadow-sm lg:col-span-2'>
            <div className='flex items-baseline justify-between mb-4 lg:mb-6'>
              <h2 className='text-sm lg:text-base font-semibold text-gray-900'>Link clicks</h2>
              <span className='text-xs lg:text-sm text-gray-500'>
                <span className='lg:hidden'>Last 14 days</span>
                <span className='hidden lg:inline'>Last 30 days</span>
                {' · '}
                {totalClicks30} total
              </span>
            </div>

            {/* Mobile chart — 14 days */}
            <div className='lg:hidden flex items-end justify-between gap-1 h-24'>
              {mobileChartDays.map((d, i) => (
                <Bar key={i} d={d} max={maxClicksMobile} short />
              ))}
            </div>

            {/* Desktop chart — 30 days, taller */}
            <div className='hidden lg:flex items-end justify-between gap-0.5 h-40'>
              {chartDays.map((d, i) => (
                <Bar key={i} d={d} max={maxClicksDesktop} short={false} />
              ))}
            </div>
          </section>

          {/* Shortcuts — list on mobile; card stack on desktop */}
          <section className='mt-5 lg:mt-0 lg:col-span-1 space-y-3'>
            <h2 className='hidden lg:block text-sm font-semibold text-gray-900 px-1'>
              Quick links
            </h2>
            <div className='rounded-2xl lg:rounded-xl bg-white border border-gray-200/80 overflow-hidden shadow-sm lg:space-y-3 lg:overflow-visible lg:border-0 lg:shadow-none lg:bg-transparent lg:divide-y-0 divide-y divide-gray-100'>
              <DesktopShortcut
                label='All sales'
                detail={`${stats?.orders_count ?? 0} orders`}
                onClick={() => navigate('/affiliate/sales')}
              />
              <DesktopShortcut
                label='Payouts'
                detail={money(stats?.paid_amount) + ' received'}
                onClick={() => navigate('/affiliate/payouts')}
              />
              <DesktopShortcut
                label='Settings'
                detail='Payout details'
                onClick={() => navigate('/affiliate/settings')}
              />
            </div>
          </section>
        </div>

        <p className='text-center lg:text-left text-xs text-gray-400 pb-2 lg:pb-0'>
          <span className='lg:hidden'>
            Commission is 10% of product total (delivery excluded).
          </span>
          <span className='hidden lg:inline'>
            Questions? Contact us at support@photify.co
          </span>
        </p>
      </div>
    </AffiliateLayout>
  );
}

function Bar({
  d,
  max,
  short,
}: {
  d: { label: string; shortLabel: string; clicks: number };
  max: number;
  short: boolean;
}) {
  const heightPx = short ? 72 : 128;
  return (
    <div
      className='flex-1 flex flex-col items-center gap-1 min-w-0 group'
      title={`${d.label}: ${d.clicks} clicks`}
    >
      <div
        className='w-full max-w-[1.25rem] lg:max-w-none mx-auto rounded-t-md bg-[#f63a9e]/90 transition-all group-hover:bg-[#f63a9e]'
        style={{
          height: `${Math.max(4, (d.clicks / max) * heightPx)}px`,
          opacity: d.clicks > 0 ? 1 : 0.15,
        }}
      />
      <span className='text-[9px] lg:text-[10px] text-gray-400 truncate w-full text-center'>
        {short ? d.shortLabel : d.label.split(' ')[0]}
      </span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-2xl lg:rounded-xl bg-white border border-gray-200/80 px-4 py-3.5 lg:py-4 shadow-sm'>
      <p className='text-[11px] lg:text-xs text-gray-500 leading-tight'>{label}</p>
      <p className='text-lg lg:text-2xl font-bold text-gray-900 mt-1 lg:mt-2 tracking-tight truncate'>
        {value}
      </p>
    </div>
  );
}

/** Mobile: full-width row with chevron. Desktop: bordered card button. */
function DesktopShortcut({
  label,
  detail,
  onClick,
}: {
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <>
      <button
        type='button'
        onClick={onClick}
        className='lg:hidden w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50'
      >
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium text-gray-900'>{label}</p>
          <p className='text-xs text-gray-500 truncate mt-0.5'>{detail}</p>
        </div>
        <ChevronRight className='w-5 h-5 text-gray-300 shrink-0' />
      </button>
      <button
        type='button'
        onClick={onClick}
        className='hidden lg:flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 text-left shadow-sm hover:border-[#f63a9e]/40 hover:shadow-md transition-all'
      >
        <div>
          <p className='text-sm font-semibold text-gray-900'>{label}</p>
          <p className='text-xs text-gray-500 mt-0.5'>{detail}</p>
        </div>
        <ChevronRight className='w-5 h-5 text-gray-400 shrink-0' />
      </button>
    </>
  );
}
