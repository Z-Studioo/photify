import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from './admin-layout';
import { createClient } from '@/lib/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface Row {
  id: string;
  name: string;
  email: string;
  code: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'disabled';
  commission_rate: number;
  customer_discount_pct: number;
  applied_at: string;
  approved_at: string | null;
  created_at: string;
}

function formatDate(s?: string | null): string {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const STATUS_STYLES: Record<Row['status'], string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  disabled: 'bg-gray-100 text-gray-600 border-gray-200',
};

export function AdminAffiliatesPage() {
  const navigate = useNavigate();
  const supabase = createClient();
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('all');
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    // Fire-and-forget: kick the debounced commission-approval batch whenever an
    // admin opens this page. The endpoint no-ops if it ran within the last
    // 15 minutes, so this is cheap and safe to call on every load.
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      try {
        void fetch(
          `${import.meta.env.VITE_API_URL}/api/affiliates/admin/run-commission-approval`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.access_token}` },
            keepalive: true,
          }
        ).catch(() => {});
      } catch {
        /* swallow */
      }
    })();
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFetchError(null);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        if (!cancelled) {
          setFetchError('You are not signed in. Please log in again.');
          setLoading(false);
        }
        return;
      }
      try {
        const qs = status !== 'all' ? `?status=${status}` : '';
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiBase}/api/affiliates${qs}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            const msg =
              json?.message ||
              json?.error ||
              (res.status === 403
                ? 'Access denied. Run server/scripts/backfill-admin-role.js and sign out/in again.'
                : `Could not load affiliates (${res.status}).`);
            setFetchError(msg);
            setItems([]);
          }
          return;
        }
        if (!cancelled) setItems(json.data || []);
      } catch (err) {
        if (!cancelled) {
          setFetchError(
            err instanceof Error
              ? err.message
              : 'Could not reach the API. Is the server running?'
          );
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, status]);

  const sorted = [...items].sort((a, b) => {
    // Pending pinned to the top, then by applied_at desc
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (b.status === 'pending' && a.status !== 'pending') return 1;
    return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
  });

  const pendingCount = items.filter(r => r.status === 'pending').length;

  return (
    <AdminLayout>
      <div className='space-y-6'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <h2
              className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
              style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}
            >
              Affiliates
            </h2>
            <p className='text-gray-500 mt-1'>
              Review applications, manage commission, and record payouts.
              {pendingCount > 0 && (
                <span className='ml-2 inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-amber-50 text-amber-700 border border-amber-200'>
                  {pendingCount} pending
                </span>
              )}
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
              <SelectItem value='rejected'>Rejected</SelectItem>
              <SelectItem value='disabled'>Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {fetchError && (
          <div className='rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'>
            {fetchError}
            {fetchError.includes('affiliates') || fetchError.includes('relation') ? (
              <span className='block mt-2 text-red-700'>
                If you have not applied migration 004 yet, run{' '}
                <code className='text-xs'>server/supabase/migrations/004_affiliates.sql</code>{' '}
                in the Supabase SQL editor.
              </span>
            ) : null}
          </div>
        )}

        <div className='bg-white border border-gray-200 rounded-xl overflow-hidden'>
          {loading ? (
            <div className='flex items-center justify-center py-16 text-gray-500'>
              <Loader2 className='w-5 h-5 animate-spin mr-2' />
              Loading…
            </div>
          ) : sorted.length === 0 ? (
            <div className='py-16 text-center text-gray-500 text-sm px-4'>
              {fetchError
                ? 'Fix the error above, then refresh this page.'
                : status === 'all'
                  ? 'No affiliate applications yet. They will appear here after someone submits the form at /affiliate.'
                  : 'No affiliates match the current filter.'}
            </div>
          ) : (
            <table className='w-full text-sm'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr className='text-left text-xs uppercase tracking-wider text-gray-500'>
                  <th className='px-4 py-3'>Name</th>
                  <th className='px-4 py-3'>Email</th>
                  <th className='px-4 py-3'>Code</th>
                  <th className='px-4 py-3'>Rate</th>
                  <th className='px-4 py-3'>Discount</th>
                  <th className='px-4 py-3'>Applied</th>
                  <th className='px-4 py-3'>Approved</th>
                  <th className='px-4 py-3'>Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(r => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/admin/affiliates/${r.id}`)}
                    className='border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer'
                  >
                    <td className='px-4 py-3 text-gray-900' style={{ fontWeight: 500 }}>
                      {r.name}
                    </td>
                    <td className='px-4 py-3 text-gray-700'>{r.email}</td>
                    <td className='px-4 py-3 text-gray-700 font-mono text-xs'>
                      {r.code || '—'}
                    </td>
                    <td className='px-4 py-3 text-gray-700'>
                      {(Number(r.commission_rate) * 100).toFixed(0)}%
                    </td>
                    <td className='px-4 py-3 text-gray-700'>
                      {(Number(r.customer_discount_pct) * 100).toFixed(0)}%
                    </td>
                    <td className='px-4 py-3 text-gray-500'>{formatDate(r.applied_at)}</td>
                    <td className='px-4 py-3 text-gray-500'>
                      {formatDate(r.approved_at)}
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full border ${STATUS_STYLES[r.status]}`}
                        style={{ fontWeight: 500 }}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
