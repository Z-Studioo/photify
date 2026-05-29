import { useEffect, useState } from 'react';
import { AffiliateLayout } from './affiliate-layout';
import { affiliateFetch } from './affiliate-api';
import { useAffiliate } from '@/context/AffiliateContext';
import { Loader2 } from 'lucide-react';

interface Payout {
  id: string;
  amount: number;
  method: string | null;
  reference: string | null;
  note: string | null;
  paid_at: string;
}

function formatDate(s?: string | null): string {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function AffiliatePayoutsPage() {
  const { getAccessToken } = useAffiliate();
  const [items, setItems] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getAccessToken();
      try {
        const res = await affiliateFetch<{ data: Payout[] }>(
          '/api/affiliates/me/payouts',
          { token }
        );
        if (!cancelled) setItems(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getAccessToken]);

  return (
    <AffiliateLayout>
      <div className='space-y-6'>
        <div>
          <h2
            className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
            style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            Payouts
          </h2>
          <p className='text-gray-500 mt-1'>
            History of payouts you have received from Photify.
          </p>
        </div>

        <div className='bg-white border border-gray-200 rounded-xl overflow-hidden'>
          {loading ? (
            <div className='flex items-center justify-center py-16 text-gray-500'>
              <Loader2 className='w-5 h-5 animate-spin mr-2' />
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className='py-16 text-center text-gray-500 text-sm'>
              No payouts yet. Earnings appear here once we process them.
            </div>
          ) : (
            <table className='w-full text-sm'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr className='text-left text-xs uppercase tracking-wider text-gray-500'>
                  <th className='px-4 py-3'>Date</th>
                  <th className='px-4 py-3'>Amount</th>
                  <th className='px-4 py-3'>Method</th>
                  <th className='px-4 py-3'>Reference</th>
                  <th className='px-4 py-3'>Note</th>
                </tr>
              </thead>
              <tbody>
                {items.map(p => (
                  <tr
                    key={p.id}
                    className='border-b border-gray-100 last:border-0 hover:bg-gray-50'
                  >
                    <td className='px-4 py-3 text-gray-700'>{formatDate(p.paid_at)}</td>
                    <td className='px-4 py-3 text-gray-900' style={{ fontWeight: 600 }}>
                      £{Number(p.amount).toFixed(2)}
                    </td>
                    <td className='px-4 py-3 text-gray-700'>{p.method || '—'}</td>
                    <td className='px-4 py-3 text-gray-500 font-mono text-xs'>
                      {p.reference || '—'}
                    </td>
                    <td className='px-4 py-3 text-gray-500'>{p.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AffiliateLayout>
  );
}
