/**
 * Admin shipping card for the order detail page.
 *
 * Talks to the Photify backend (which proxies Parcel2Go):
 *   GET    /api/shipping/config            → server feature flags + default collection address
 *   GET    /api/shipping/test-auth         → diagnostics for 401s
 *   POST   /api/shipping/orders/:n/quotes  → fetch courier quotes
 *   POST   /api/shipping/orders/:n/book    → book a chosen quote
 *   GET    /api/shipping/orders/:n/label   → PDF stream (proxied)
 *   GET    /api/shipping/orders/:n/tracking → read-only tracking snapshot
 *
 * Status automation: once booked, status transitions to `shipped` / `delivered`
 * are driven by Parcel2Go tracking webhooks + the polling cron — this card
 * never flips status itself.
 */
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { createClient } from '@/lib/supabase/client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/** Only Evri ParcelShop services are bookable from this UI. */
const ALLOWED_SERVICE_SLUGS = new Set<string>([
  'myhermes-parcelshop',
  'myhermes-parcelshop-next-day',
]);

interface SenderAddress {
  contactName: string;
  property: string;
  street: string;
  town: string;
  postcode: string;
}

export interface ShippingOrderInfo {
  order_number: string;
  parcel2go_order_id?: string | null;
  parcel2go_orderline_id?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  tracking_stage?: string | null;
  carrier_name?: string | null;
  service_name?: string | null;
  service_id?: string | null;
  label_url?: string | null;
  shipped_at?: string | null;
  shipment_cost?: number | string | null;
  parcel_dimensions?: unknown;
  status?: string;
}

interface QuoteService {
  Slug?: string;
  Name?: string;
  CourierName?: string;
  Links?: { Logo?: string };
}

interface Quote {
  Service?: QuoteService;
  TotalPrice?: number;
  TotalPriceExVat?: number;
  EstimatedDeliveryDate?: string;
  Hash?: string;
  [key: string]: unknown;
}

interface Props {
  order: ShippingOrderInfo;
  onShipmentBooked?: (updates: Partial<ShippingOrderInfo>) => void;
}

function isAllowedQuote(q: Quote): boolean {
  const slug = (q.Service?.Slug || '').toLowerCase();
  return ALLOWED_SERVICE_SLUGS.has(slug);
}

function formatPrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(n)) return '—';
  return `£${n.toFixed(2)}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function stageBadgeClasses(stage: string | null | undefined): string {
  switch ((stage || '').toLowerCase()) {
    case 'delivered':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'droppedoff':
    case 'collected':
    case 'intransit':
    case 'atdepot':
    case 'deliveryscheduled':
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    case 'majorerror':
      return 'bg-red-100 text-red-700 border border-red-200';
    case 'booked':
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

export function AdminOrderShipping({ order, onShipmentBooked }: Props) {
  const supabase = createClient();

  const isBooked = Boolean(order.parcel2go_order_id);

  const [configured, setConfigured] = useState<boolean | null>(null);
  const [env, setEnv] = useState<'sandbox' | 'live' | null>(null);
  const [webhooksConfigured, setWebhooksConfigured] = useState<boolean>(false);
  const [senderAddress, setSenderAddress] = useState<SenderAddress | null>(
    null
  );
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authTesting, setAuthTesting] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [collectionDate, setCollectionDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });

  const [trackingLoading, setTrackingLoading] = useState(false);
  const [labelLoading, setLabelLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        if (!sess.session?.access_token) return;
        const res = await fetch(`${API_BASE}/api/shipping/config`, {
          headers: { Authorization: `Bearer ${sess.session.access_token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setConfigured(Boolean(data.configured));
        setEnv(data.env || null);
        setWebhooksConfigured(Boolean(data.webhooksConfigured));
        if (data.senderAddress) {
          setSenderAddress({
            contactName: data.senderAddress.contactName || '',
            property: data.senderAddress.property || '',
            street: data.senderAddress.street || '',
            town: data.senderAddress.town || '',
            postcode: data.senderAddress.postcode || '',
          });
        }
      } catch (err) {
        console.warn('shipping config fetch failed', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const slugAvailability = useMemo(() => {
    const present = new Set(
      allQuotes
        .map(q => (q.Service?.Slug || '').toLowerCase())
        .filter(Boolean)
    );
    return Array.from(ALLOWED_SERVICE_SLUGS).map(slug => ({
      slug,
      available: present.has(slug),
    }));
  }, [allQuotes]);

  async function authHeader(): Promise<Record<string, string>> {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) throw new Error('Not authenticated');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async function handleTestAuth() {
    try {
      setAuthTesting(true);
      const headers = await authHeader();
      const res = await fetch(`${API_BASE}/api/shipping/test-auth`, {
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Parcel2Go auth failed', {
          description: data.hint || undefined,
        });
        return;
      }
      toast.success(`Parcel2Go auth OK (${data.data?.env})`, {
        description: `Scopes: ${(data.data?.scopes || []).join(', ') || 'n/a'}`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Auth test failed');
    } finally {
      setAuthTesting(false);
    }
  }

  async function handleFetchQuotes() {
    try {
      setLoading(true);
      const headers = await authHeader();
      const res = await fetch(
        `${API_BASE}/api/shipping/orders/${encodeURIComponent(order.order_number)}/quotes`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({}),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Failed to fetch quotes', {
          description: data.hint || undefined,
        });
        return;
      }
      const all: Quote[] = data.data?.quotes || [];
      const filtered = all.filter(isAllowedQuote);
      setAllQuotes(all);
      setQuotes(filtered);
      // Auto-select if there's exactly one allowed service — saves a click.
      setSelectedIndex(filtered.length === 1 ? 0 : null);
      if (filtered.length === 0) {
        toast.info(
          'No Evri ParcelShop services available for this address. Allowed: myhermes-parcelshop, myhermes-parcelshop-next-day.'
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Quotes failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleBookSelected() {
    if (selectedIndex === null) {
      toast.error('Select a quote first');
      return;
    }
    const quote = quotes[selectedIndex];
    if (!quote) {
      toast.error('Selected quote no longer available');
      return;
    }
    try {
      setLoading(true);
      const headers = await authHeader();
      const res = await fetch(
        `${API_BASE}/api/shipping/orders/${encodeURIComponent(order.order_number)}/book`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            serviceSlug: quote.Service?.Slug,
            hash: quote.Hash,
            collectionDate,
            payWithPrepay: true,
            serviceName: quote.Service?.Name,
            courierName: quote.Service?.CourierName,
            totalPrice: quote.TotalPrice,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        const detailLines: string[] = [];
        if (Array.isArray(data?.details?.Errors)) {
          for (const e of data.details.Errors) {
            detailLines.push(JSON.stringify(e));
          }
        }
        if (Array.isArray(data?.missingFields) && data.missingFields.length) {
          detailLines.push(`Missing: ${data.missingFields.join(', ')}`);
        }
        toast.error(data.message || 'Booking failed', {
          description: detailLines.join(' • ') || data.hint || undefined,
        });
        return;
      }
      toast.success(data.message || 'Shipment booked', {
        description:
          'Order will auto-flip to Dispatched once Parcel2Go reports drop-off.',
      });
      const updates: Partial<ShippingOrderInfo> = {
        parcel2go_order_id: String(data.data?.parcel2go_order_id || ''),
        parcel2go_orderline_id: data.data?.parcel2go_orderline_id || null,
        tracking_number: data.data?.tracking_number || null,
        tracking_url: data.data?.tracking_url || null,
        tracking_stage: data.data?.tracking_stage || 'Booked',
        label_url: data.data?.label_url || null,
        carrier_name: data.data?.carrier_name || quote.Service?.CourierName,
        service_name: data.data?.service_name || quote.Service?.Name,
        service_id: quote.Service?.Slug || null,
      };
      onShipmentBooked?.(updates);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadLabel() {
    try {
      setLabelLoading(true);
      const headers = await authHeader();
      const res = await fetch(
        `${API_BASE}/api/shipping/orders/${encodeURIComponent(order.order_number)}/label`,
        { headers: { Authorization: headers.Authorization || '' } }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || data.error || 'Label download failed', {
          description: data.hint || undefined,
        });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `parcel2go-label-${order.order_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Label failed');
    } finally {
      setLabelLoading(false);
    }
  }

  async function handleRefreshTracking() {
    try {
      setTrackingLoading(true);
      const headers = await authHeader();
      const res = await fetch(
        `${API_BASE}/api/shipping/orders/${encodeURIComponent(order.order_number)}/sync-tracking`,
        { method: 'POST', headers }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Tracking sync failed');
        return;
      }
      const r = data.data || {};
      const stage = r.stage || 'Unknown';
      if (r.transitioned === 'shipped') {
        toast.success(`Stage: ${stage} — order marked Dispatched`, {
          description: r.emailSent
            ? 'Dispatch email sent to customer.'
            : 'Dispatch email could not be sent (see server logs).',
        });
        onShipmentBooked?.({
          tracking_stage: stage,
          shipped_at: new Date().toISOString(),
          status: 'shipped',
        } as Partial<ShippingOrderInfo>);
      } else if (r.transitioned === 'delivered') {
        toast.success(`Stage: ${stage} — order marked Delivered`, {
          description: r.emailSent
            ? 'Delivered email sent to customer.'
            : 'Delivered email could not be sent (see server logs).',
        });
        onShipmentBooked?.({
          tracking_stage: stage,
          status: 'delivered',
        } as Partial<ShippingOrderInfo>);
      } else {
        toast.success(`Stage: ${stage}`, {
          description:
            'Status unchanged. Will auto-advance to Dispatched on DroppedOff and Delivered when Parcel2Go confirms.',
        });
        if (stage && stage !== order.tracking_stage) {
          onShipmentBooked?.({ tracking_stage: stage } as Partial<ShippingOrderInfo>);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tracking failed');
    } finally {
      setTrackingLoading(false);
    }
  }

  // ---------- Render ----------

  if (configured === false) {
    return (
      <div className='rounded-lg border bg-white p-4 shadow-sm'>
        <h3 className='text-sm font-semibold text-slate-900'>Shipping</h3>
        <p className='mt-2 text-xs text-slate-600'>
          Parcel2Go isn't configured on the server. Set{' '}
          <code className='text-[11px]'>PARCEL2GO_CLIENT_ID</code> and{' '}
          <code className='text-[11px]'>PARCEL2GO_CLIENT_SECRET</code>.
        </p>
      </div>
    );
  }

  return (
    <div className='rounded-lg border bg-white p-4 shadow-sm'>
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <h3 className='text-sm font-semibold text-slate-900'>Shipping</h3>
          {env && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                env === 'live'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {env}
            </span>
          )}
          {isBooked && (
            <span className='rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200'>
              Booked
            </span>
          )}
          {order.tracking_stage && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${stageBadgeClasses(order.tracking_stage)}`}
            >
              {order.tracking_stage}
            </span>
          )}
        </div>
        <button
          type='button'
          onClick={handleTestAuth}
          disabled={authTesting}
          className='text-[11px] text-slate-500 hover:text-slate-800 disabled:opacity-50'
        >
          {authTesting ? 'Testing…' : 'Test auth'}
        </button>
      </div>

      {!isBooked ? (
        <div className='mt-3 space-y-2'>
          <p className='text-xs text-slate-600'>
            Book an Evri ParcelShop label through Parcel2Go. The order's status
            will flip to Dispatched automatically when the customer drops it
            off.
          </p>
          <Button
            size='sm'
            className='w-full'
            onClick={() => setOpen(true)}
            disabled={loading}
          >
            Book shipment
          </Button>
          {!webhooksConfigured && (
            <p className='text-[11px] text-slate-500'>
              Tip: set <code>PARCEL2GO_WEBHOOK_SECRET</code> + register{' '}
              <code>/api/shipping/webhook</code> in Parcel2Go's dashboard for
              instant status updates.
            </p>
          )}
        </div>
      ) : (
        <div className='mt-3'>
          <dl className='space-y-1.5 text-xs'>
            <div className='flex justify-between gap-2'>
              <dt className='text-slate-500'>Carrier</dt>
              <dd className='font-medium text-slate-900 text-right'>
                {order.carrier_name || '—'}
              </dd>
            </div>
            <div className='flex justify-between gap-2'>
              <dt className='text-slate-500'>Service</dt>
              <dd className='font-medium text-slate-900 text-right truncate max-w-[180px]'>
                {order.service_name || '—'}
              </dd>
            </div>
            <div className='flex justify-between gap-2'>
              <dt className='text-slate-500'>Tracking #</dt>
              <dd className='font-mono text-[11px] text-slate-900 text-right'>
                {order.tracking_number || '—'}
              </dd>
            </div>
            <div className='flex justify-between gap-2'>
              <dt className='text-slate-500'>Cost</dt>
              <dd className='text-slate-900 text-right'>
                {formatPrice(order.shipment_cost ?? null)}
              </dd>
            </div>
            {order.shipped_at && (
              <div className='flex justify-between gap-2'>
                <dt className='text-slate-500'>Dispatched</dt>
                <dd className='text-slate-900 text-right'>
                  {formatDate(order.shipped_at)}
                </dd>
              </div>
            )}
          </dl>
          <Separator className='my-3' />
          <div className='grid grid-cols-2 gap-2'>
            <Button
              size='sm'
              variant='outline'
              onClick={handleDownloadLabel}
              disabled={labelLoading}
            >
              {labelLoading ? '…' : 'Label'}
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={handleRefreshTracking}
              disabled={trackingLoading}
            >
              {trackingLoading ? '…' : 'Tracking'}
            </Button>
          </div>
        </div>
      )}

      {/* Booking Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              Book Shipment
              <span className='rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200'>
                Evri ParcelShop only
              </span>
            </DialogTitle>
            <DialogDescription>
              Filters to{' '}
              <code className='text-[11px]'>myhermes-parcelshop</code> and{' '}
              <code className='text-[11px]'>myhermes-parcelshop-next-day</code>.
              Status will auto-advance via Parcel2Go webhooks once dropped off.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {senderAddress && (
              <div className='rounded border bg-slate-50 px-3 py-2'>
                <div className='text-[11px] font-medium uppercase tracking-wide text-slate-500'>
                  Sender / return address (printed on label)
                </div>
                <div className='mt-0.5 text-xs leading-relaxed text-slate-800'>
                  {senderAddress.contactName} ·{' '}
                  {[senderAddress.property, senderAddress.street]
                    .filter(Boolean)
                    .join(' ')}
                  , {senderAddress.town}, {senderAddress.postcode}
                </div>
              </div>
            )}

            <div className='flex items-end gap-2'>
              <div className='flex-1'>
                <Label className='text-[11px]'>Drop-off date</Label>
                <Input
                  type='date'
                  value={collectionDate}
                  onChange={e => setCollectionDate(e.target.value)}
                />
                <p className='mt-1 text-[10px] text-slate-500'>
                  Earliest date you'll hand the parcel in at a ParcelShop —
                  drives Parcel2Go's SLA clock.
                </p>
              </div>
              <Button onClick={handleFetchQuotes} disabled={loading} size='sm'>
                {loading ? 'Loading…' : 'Get quotes'}
              </Button>
            </div>

            {allQuotes.length > 0 && (
              <div className='flex flex-wrap items-center gap-1.5 text-[11px]'>
                <span className='text-slate-500'>Allowed slugs:</span>
                {slugAvailability.map(({ slug, available }) => (
                  <span
                    key={slug}
                    className={`rounded px-1.5 py-0.5 ${
                      available
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {slug} {available ? '✓' : '✗'}
                  </span>
                ))}
              </div>
            )}

            {quotes.length === 0 && allQuotes.length > 0 && (
              <Alert>
                <AlertDescription className='text-xs'>
                  {allQuotes.length} quotes returned but none match the allowed
                  Evri ParcelShop slugs.
                </AlertDescription>
              </Alert>
            )}

            {quotes.length > 0 && (
              <div className='max-h-72 space-y-1.5 overflow-y-auto rounded border p-2'>
                {quotes.map((q, i) => {
                  const selected = selectedIndex === i;
                  return (
                    <label
                      key={`${q.Service?.Slug || 'quote'}-${i}`}
                      className={`flex cursor-pointer items-center justify-between gap-2 rounded p-2 text-xs transition ${
                        selected
                          ? 'bg-blue-50 border border-blue-200'
                          : 'border hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedIndex(i)}
                    >
                      <div className='flex items-center gap-2'>
                        <input
                          type='radio'
                          name='quote'
                          checked={selected}
                          onChange={() => setSelectedIndex(i)}
                        />
                        <div>
                          <div className='font-medium text-slate-900'>
                            {q.Service?.CourierName} — {q.Service?.Name}
                          </div>
                          <div className='text-[11px] text-slate-500'>
                            <code>{q.Service?.Slug}</code>
                            {q.EstimatedDeliveryDate
                              ? ` · est. ${new Date(q.EstimatedDeliveryDate).toLocaleDateString('en-GB')}`
                              : ''}
                          </div>
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='font-semibold text-slate-900'>
                          {formatPrice(q.TotalPrice ?? null)}
                        </div>
                        {typeof q.TotalPriceExVat === 'number' && (
                          <div className='text-[11px] text-slate-500'>
                            ex VAT {formatPrice(q.TotalPriceExVat)}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBookSelected}
              disabled={selectedIndex === null || loading}
            >
              {loading ? 'Booking…' : 'Book selected'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
