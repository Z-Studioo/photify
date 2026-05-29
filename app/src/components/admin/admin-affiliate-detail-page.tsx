import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from './admin-layout';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  Wallet,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

interface Stats {
  pending_amount: number;
  approved_amount: number;
  paid_amount: number;
  reversed_amount: number;
  payable_amount: number;
  orders_count: number;
  revenue_total: number;
  clicks_total: number;
}

interface Commission {
  id: string;
  order_id: string;
  commission_amount: number;
  status: 'pending' | 'approved' | 'reversed' | 'paid';
  created_at: string;
  approved_at: string | null;
  paid_at: string | null;
}

interface Payout {
  id: string;
  amount: number;
  method: string | null;
  reference: string | null;
  note: string | null;
  paid_at: string;
}

interface Detail {
  affiliate: any;
  stats: Stats | null;
  recent_commissions: Commission[];
  payouts: Payout[];
}

function formatDate(s?: string | null): string {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function AdminAffiliateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const supabase = createClient();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Dialogs
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [enableOpen, setEnableOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);

  // Form state
  const [approveCode, setApproveCode] = useState('');
  const [approveRate, setApproveRate] = useState('10');
  const [approveDiscount, setApproveDiscount] = useState('5');
  const [rejectReason, setRejectReason] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
  const [payoutReference, setPayoutReference] = useState('');
  const [payoutNote, setPayoutNote] = useState('');

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token || !id) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/affiliates/${id}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      const json = await res.json();
      setDetail(json.data || null);
      if (json?.data?.affiliate) {
        setApproveRate(String(Math.round(Number(json.data.affiliate.commission_rate) * 100)));
        setApproveDiscount(
          String(Math.round(Number(json.data.affiliate.customer_discount_pct) * 100))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const callAction = async (path: string, body?: any) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');
    const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.message || j?.error || `Request failed: ${res.status}`);
    }
    return res.json();
  };

  const handleApprove = async () => {
    setBusy(true);
    try {
      await callAction(`/api/affiliates/${id}/approve`, {
        code: approveCode || undefined,
        commission_rate: Number(approveRate) / 100,
        customer_discount_pct: Number(approveDiscount) / 100,
      });
      toast.success('Affiliate approved');
      setApproveOpen(false);
      await fetchDetail();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    setBusy(true);
    try {
      await callAction(`/api/affiliates/${id}/reject`, { reason: rejectReason || null });
      toast.success('Application rejected');
      setRejectOpen(false);
      await fetchDetail();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject');
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    try {
      await callAction(`/api/affiliates/${id}/disable`);
      toast.success('Affiliate disabled');
      setDisableOpen(false);
      await fetchDetail();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to disable');
    } finally {
      setBusy(false);
    }
  };

  const handleEnable = async () => {
    setBusy(true);
    try {
      await callAction(`/api/affiliates/${id}/enable`);
      toast.success('Affiliate re-enabled');
      setEnableOpen(false);
      await fetchDetail();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to enable');
    } finally {
      setBusy(false);
    }
  };

  const handlePayout = async () => {
    setBusy(true);
    try {
      const payload: any = { method: payoutMethod };
      if (payoutAmount) payload.amount = Number(payoutAmount);
      if (payoutReference) payload.reference = payoutReference;
      if (payoutNote) payload.note = payoutNote;
      await callAction(`/api/affiliates/${id}/payouts`, payload);
      toast.success('Payout recorded');
      setPayoutOpen(false);
      setPayoutAmount('');
      setPayoutReference('');
      setPayoutNote('');
      await fetchDetail();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to record payout');
    } finally {
      setBusy(false);
    }
  };

  if (loading || !detail) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center py-20 text-gray-500'>
          <Loader2 className='w-5 h-5 animate-spin mr-2' />
          Loading…
        </div>
      </AdminLayout>
    );
  }

  const a = detail.affiliate;
  const stats = detail.stats;
  const isApproved = a.status === 'approved';
  const isPending = a.status === 'pending';
  const isDisabled = a.status === 'disabled';

  return (
    <AdminLayout>
      <div className='space-y-6'>
        <button
          onClick={() => navigate('/admin/affiliates')}
          className='inline-flex items-center text-sm text-gray-500 hover:text-gray-900'
        >
          <ArrowLeft className='w-4 h-4 mr-1' />
          Back to affiliates
        </button>

        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div>
            <h2
              className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
              style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}
            >
              {a.name}
            </h2>
            <p className='text-gray-500 mt-1'>{a.email}</p>
            <div className='flex items-center gap-2 mt-3 text-sm'>
              <span className='inline-flex items-center px-2 py-0.5 text-xs rounded-full border border-gray-200 bg-gray-50 text-gray-700'>
                {a.status}
              </span>
              {a.code && (
                <span className='font-mono text-xs text-gray-700 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full'>
                  /r/{a.code}
                </span>
              )}
              <span className='text-xs text-gray-500'>
                Applied {formatDate(a.applied_at)}
              </span>
            </div>
          </div>

          <div className='flex flex-wrap gap-2'>
            {isPending && (
              <>
                <Button
                  onClick={() => setApproveOpen(true)}
                  className='bg-green-600 hover:bg-green-700 text-white'
                >
                  <CheckCircle2 className='w-4 h-4 mr-1' />
                  Approve
                </Button>
                <Button
                  variant='outline'
                  onClick={() => setRejectOpen(true)}
                  className='border-red-300 text-red-700 hover:bg-red-50'
                >
                  <XCircle className='w-4 h-4 mr-1' />
                  Reject
                </Button>
              </>
            )}
            {(isApproved || isDisabled) && (stats?.payable_amount ?? 0) > 0 && (
              <Button
                onClick={() => setPayoutOpen(true)}
                className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white'
              >
                <Wallet className='w-4 h-4 mr-1' />
                Record payout
              </Button>
            )}
            {isApproved && (
              <Button
                variant='outline'
                onClick={() => setDisableOpen(true)}
                className='border-gray-300'
              >
                <Pause className='w-4 h-4 mr-1' />
                Disable
              </Button>
            )}
            {isDisabled && (
              <Button
                onClick={() => setEnableOpen(true)}
                className='bg-green-600 hover:bg-green-700 text-white'
              >
                <Play className='w-4 h-4 mr-1' />
                Enable
              </Button>
            )}
          </div>
        </div>

        {stats && (
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
            <StatBox label='Payable balance' value={`£${Number(stats.payable_amount).toFixed(2)}`} />
            <StatBox label='Pending' value={`£${Number(stats.pending_amount).toFixed(2)}`} />
            <StatBox label='Lifetime paid' value={`£${Number(stats.paid_amount).toFixed(2)}`} />
            <StatBox
              label='Sales'
              value={`${stats.orders_count} orders · £${Number(stats.revenue_total).toFixed(2)}`}
            />
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <Panel title='Recent commissions'>
            {detail.recent_commissions.length === 0 ? (
              <EmptyRow text='No commissions yet.' />
            ) : (
              <table className='w-full text-sm'>
                <thead className='text-xs uppercase tracking-wider text-gray-500 bg-gray-50 border-b border-gray-200'>
                  <tr className='text-left'>
                    <th className='px-3 py-2'>Date</th>
                    <th className='px-3 py-2'>Order</th>
                    <th className='px-3 py-2'>Amount</th>
                    <th className='px-3 py-2'>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.recent_commissions.map(c => (
                    <tr key={c.id} className='border-b border-gray-100 last:border-0'>
                      <td className='px-3 py-2 text-gray-700'>{formatDate(c.created_at)}</td>
                      <td className='px-3 py-2 font-mono text-xs text-gray-500'>
                        {c.order_id.slice(0, 8)}
                      </td>
                      <td className='px-3 py-2' style={{ fontWeight: 600 }}>
                        £{Number(c.commission_amount).toFixed(2)}
                      </td>
                      <td className='px-3 py-2 capitalize text-gray-700'>{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel title='Payouts'>
            {detail.payouts.length === 0 ? (
              <EmptyRow text='No payouts recorded.' />
            ) : (
              <table className='w-full text-sm'>
                <thead className='text-xs uppercase tracking-wider text-gray-500 bg-gray-50 border-b border-gray-200'>
                  <tr className='text-left'>
                    <th className='px-3 py-2'>Date</th>
                    <th className='px-3 py-2'>Amount</th>
                    <th className='px-3 py-2'>Method</th>
                    <th className='px-3 py-2'>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.payouts.map(p => (
                    <tr key={p.id} className='border-b border-gray-100 last:border-0'>
                      <td className='px-3 py-2 text-gray-700'>{formatDate(p.paid_at)}</td>
                      <td className='px-3 py-2' style={{ fontWeight: 600 }}>
                        £{Number(p.amount).toFixed(2)}
                      </td>
                      <td className='px-3 py-2 text-gray-700'>{p.method || '—'}</td>
                      <td className='px-3 py-2 font-mono text-xs text-gray-500'>
                        {p.reference || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>

        {/* Application details */}
        {(a.phone || a.website || a.social_handle || a.audience_description) && (
          <Panel title='Application details'>
            <dl className='grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-sm p-4'>
              {a.phone && <Detail label='Phone' value={a.phone} />}
              {a.website && <Detail label='Website' value={a.website} link />}
              {a.social_handle && <Detail label='Social' value={a.social_handle} />}
              {a.audience_description && (
                <div className='sm:col-span-2'>
                  <dt className='text-xs uppercase tracking-wider text-gray-500 mb-1'>
                    Audience
                  </dt>
                  <dd className='text-gray-700 whitespace-pre-wrap'>{a.audience_description}</dd>
                </div>
              )}
            </dl>
          </Panel>
        )}
      </div>

      {/* Approve dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {a.name}</DialogTitle>
            <DialogDescription>
              Mint a referral code, create the auto-applied promo, and email the
              affiliate a magic link.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='code'>Referral code (optional)</Label>
              <Input
                id='code'
                value={approveCode}
                onChange={e => setApproveCode(e.target.value)}
                placeholder='Auto-generated from name if blank'
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-2'>
                <Label htmlFor='rate'>Commission rate (%)</Label>
                <Input
                  id='rate'
                  type='number'
                  value={approveRate}
                  onChange={e => setApproveRate(e.target.value)}
                  min={0}
                  max={100}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='discount'>Customer discount (%)</Label>
                <Input
                  id='discount'
                  type='number'
                  value={approveDiscount}
                  onChange={e => setApproveDiscount(e.target.value)}
                  min={0}
                  max={100}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={busy}
              className='bg-green-600 hover:bg-green-700 text-white'
            >
              {busy ? 'Approving…' : 'Approve and send email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {a.name}</DialogTitle>
            <DialogDescription>
              Optionally include a reason. The applicant will be emailed.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-2'>
            <Label htmlFor='reason'>Reason (optional)</Label>
            <textarea
              id='reason'
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
              className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-gray-900 focus:outline-none'
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={busy}
              className='bg-red-600 hover:bg-red-700 text-white'
            >
              {busy ? 'Rejecting…' : 'Reject application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enable confirmation */}
      <AlertDialog open={enableOpen} onOpenChange={setEnableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-enable this affiliate?</AlertDialogTitle>
            <AlertDialogDescription>
              Their referral link and customer discount will work again. Approved
              commission balance is unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEnable}
              disabled={busy}
              className='bg-green-600 hover:bg-green-700'
            >
              {busy ? 'Enabling…' : 'Enable affiliate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable confirmation */}
      <AlertDialog open={disableOpen} onOpenChange={setDisableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable this affiliate?</AlertDialogTitle>
            <AlertDialogDescription>
              The affiliate will no longer accrue commissions. Their referral
              code and auto-discount will be deactivated. Existing approved
              commissions remain payable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable}
              disabled={busy}
              className='bg-red-600 hover:bg-red-700'
            >
              {busy ? 'Disabling…' : 'Disable affiliate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payout dialog */}
      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payout</DialogTitle>
            <DialogDescription>
              Approved balance:{' '}
              <span className='font-semibold'>
                £{Number(stats?.payable_amount || 0).toFixed(2)}
              </span>
              . Leave amount blank to pay the full approved balance.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-2'>
                <Label htmlFor='amount'>Amount (£)</Label>
                <Input
                  id='amount'
                  type='number'
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  placeholder={String((stats?.payable_amount ?? 0).toFixed(2))}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='method'>Method</Label>
                <Input
                  id='method'
                  value={payoutMethod}
                  onChange={e => setPayoutMethod(e.target.value)}
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='reference'>Reference (optional)</Label>
              <Input
                id='reference'
                value={payoutReference}
                onChange={e => setPayoutReference(e.target.value)}
                placeholder='e.g. Bank transaction ID'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='note'>Note (optional)</Label>
              <Input
                id='note'
                value={payoutNote}
                onChange={e => setPayoutNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setPayoutOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePayout}
              disabled={busy}
              className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white'
            >
              {busy ? 'Saving…' : 'Record payout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className='border border-gray-200 rounded-xl bg-white p-4'>
      <p className='text-xs uppercase tracking-wider text-gray-500 mb-1'>{label}</p>
      <p
        className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
        style={{ fontSize: '20px', fontWeight: 700 }}
      >
        {value}
      </p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className='border border-gray-200 rounded-xl bg-white overflow-hidden'>
      <div className='px-4 py-3 border-b border-gray-200'>
        <h3
          className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
          style={{ fontSize: '15px', fontWeight: 700 }}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className='text-sm text-gray-500 px-4 py-6 text-center'>{text}</p>;
}

function Detail({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <div>
      <dt className='text-xs uppercase tracking-wider text-gray-500 mb-1'>{label}</dt>
      <dd className='text-gray-700'>
        {link ? (
          <a
            href={value}
            target='_blank'
            rel='noopener noreferrer'
            className='text-[#f63a9e] hover:underline break-all'
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
