import { useEffect, useState } from 'react';
import { AffiliateLayout } from './affiliate-layout';
import { affiliateFetch } from './affiliate-api';
import { useAffiliate } from '@/context/AffiliateContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface Commission {
  id: string;
  order_id: string;
  commission_base: number;
  commission_amount: number;
  rate: number;
  status: 'pending' | 'approved' | 'reversed' | 'paid';
  available_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
  created_at: string;
  orders?: { order_number?: string; total?: number };
}

function formatDate(s?: string | null): string {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: Commission['status'] }) {
  const map: Record<Commission['status'], string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    paid: 'bg-gray-100 text-gray-700 border-gray-200',
    reversed: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full border ${map[status]}`}
      style={{ fontWeight: 500 }}
    >
      {status}
    </span>
  );
}

export function AffiliateSalesPage() {
  const { getAccessToken } = useAffiliate();
  const [items, setItems] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const token = await getAccessToken();
      const qs = new URLSearchParams();
      if (status !== 'all') qs.set('status', status);
      try {
        const res = await affiliateFetch<{ data: Commission[]; next_cursor: string | null }>(
          `/api/affiliates/me/commissions?${qs.toString()}`,
          { token }
        );
        if (cancelled) return;
        setItems(res.data || []);
        setCursor(res.next_cursor);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getAccessToken, status]);

  const handleLoadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    const token = await getAccessToken();
    const qs = new URLSearchParams();
    if (status !== 'all') qs.set('status', status);
    qs.set('cursor', cursor);
    try {
      const res = await affiliateFetch<{ data: Commission[]; next_cursor: string | null }>(
        `/api/affiliates/me/commissions?${qs.toString()}`,
        { token }
      );
      setItems(prev => [...prev, ...(res.data || [])]);
      setCursor(res.next_cursor);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <AffiliateLayout>
      <div className='space-y-6'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <h2
              className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
              style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}
            >
              Sales
            </h2>
            <p className='text-gray-500 mt-1'>
              Every order attributed to your referral link.
            </p>
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              <SelectItem value='pending'>Pending</SelectItem>
              <SelectItem value='approved'>Approved</SelectItem>
              <SelectItem value='paid'>Paid</SelectItem>
              <SelectItem value='reversed'>Reversed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='bg-white border border-gray-200 rounded-xl overflow-hidden'>
          {loading ? (
            <div className='flex items-center justify-center py-16 text-gray-500'>
              <Loader2 className='w-5 h-5 animate-spin mr-2' />
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className='py-16 text-center text-gray-500 text-sm'>
              No sales yet. Share your referral link to start earning.
            </div>
          ) : (
            <table className='w-full text-sm'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr className='text-left text-xs uppercase tracking-wider text-gray-500'>
                  <th className='px-4 py-3'>Order</th>
                  <th className='px-4 py-3'>Date</th>
                  <th className='px-4 py-3'>Order total</th>
                  <th className='px-4 py-3'>Base</th>
                  <th className='px-4 py-3'>Rate</th>
                  <th className='px-4 py-3'>Commission</th>
                  <th className='px-4 py-3'>Status</th>
                  <th className='px-4 py-3'>Available</th>
                </tr>
              </thead>
              <tbody>
                {items.map(c => (
                  <tr
                    key={c.id}
                    className='border-b border-gray-100 last:border-0 hover:bg-gray-50'
                  >
                    <td className='px-4 py-3 font-mono text-xs text-gray-700'>
                      {c.orders?.order_number || c.order_id.slice(0, 8)}
                    </td>
                    <td className='px-4 py-3 text-gray-700'>{formatDate(c.created_at)}</td>
                    <td className='px-4 py-3 text-gray-700'>
                      £{Number(c.orders?.total || 0).toFixed(2)}
                    </td>
                    <td className='px-4 py-3 text-gray-700'>
                      £{Number(c.commission_base).toFixed(2)}
                    </td>
                    <td className='px-4 py-3 text-gray-500'>
                      {(Number(c.rate) * 100).toFixed(0)}%
                    </td>
                    <td className='px-4 py-3 text-gray-900' style={{ fontWeight: 600 }}>
                      £{Number(c.commission_amount).toFixed(2)}
                    </td>
                    <td className='px-4 py-3'>
                      <StatusBadge status={c.status} />
                    </td>
                    <td className='px-4 py-3 text-gray-500 text-xs'>
                      {c.status === 'pending' ? formatDate(c.available_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {cursor && (
          <div className='flex justify-center'>
            <Button
              variant='outline'
              onClick={handleLoadMore}
              disabled={loadingMore}
              className='border-gray-300'
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </Button>
          </div>
        )}
      </div>
    </AffiliateLayout>
  );
}
