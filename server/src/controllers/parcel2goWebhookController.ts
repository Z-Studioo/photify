/**
 * Parcel2Go webhook receiver.
 *
 * Webhook envelope (per https://www.parcel2go.com/api/docs/articles/webhooks.html):
 *   { Id, Timestamp, Signature, Type, Payload }
 *
 * Signature = lowercase HEX HMAC-SHA256(secret, `Id:Timestamp(yyyy-MM-dd HH:mm:ss):Type`)
 *
 * The publicly documented payload is `Case` (claim/enquiry events) — we log
 * those for now. Tracking-flavoured payloads (the dashboard exposes additional
 * subscribable types) are dispatched into our status-transition pipeline. The
 * receiver is intentionally generous: any payload carrying an `OrderLineId`
 * or `CustomerReference` + a `Stage`/`Status` triggers a tracking sync, which
 * is the safest match for the variety of webhook types Parcel2Go offers.
 */
import { Request, Response } from 'express';
import { supabase } from '@/lib/supabase';
import { config } from '@/config/environment';
import {
  verifyWebhookSignature,
  type WebhookEnvelope,
} from '@/lib/parcel2go';
import { syncOrderByParcel2GoRef } from '@/jobs/syncShipmentStatus';

interface NormalisedTrackingHint {
  orderlineId: string | null;
  customerReference: string | null;
  stage: string | null;
}

/**
 * Best-effort extraction of tracking-shaped fields from a webhook Payload.
 * Parcel2Go's `Case` payload (the only publicly-documented schema) carries
 * `OrderLineId` + `CustomerReference` but no stage; tracking-flavoured
 * payloads (exposed via the dashboard) typically add `Stage` or `Status`.
 */
function extractTrackingHint(
  payload: Record<string, unknown> | undefined
): NormalisedTrackingHint {
  if (!payload) {
    return { orderlineId: null, customerReference: null, stage: null };
  }
  const orderlineId =
    (payload.OrderLineId as string | number | undefined) ??
    (payload.orderLineId as string | number | undefined) ??
    null;
  const customerReference =
    (payload.CustomerReference as string | undefined) ??
    (payload.customerReference as string | undefined) ??
    (payload.Reference as string | undefined) ??
    null;
  const stage =
    (payload.Stage as string | undefined) ??
    (payload.stage as string | undefined) ??
    (payload.Status as string | undefined) ??
    null;
  return {
    orderlineId: orderlineId !== null ? String(orderlineId) : null,
    customerReference: customerReference ? String(customerReference) : null,
    stage: stage ? String(stage) : null,
  };
}

async function logWebhook(
  envelope: WebhookEnvelope,
  hint: NormalisedTrackingHint,
  opts: { processed: boolean; error?: string }
): Promise<void> {
  if (!envelope.Id) return;
  const row: Record<string, unknown> = {
    id: envelope.Id,
    type: envelope.Type || 'Unknown',
    event_timestamp: envelope.Timestamp
      ? new Date(envelope.Timestamp).toISOString()
      : null,
    signature: envelope.Signature || null,
    payload: envelope.Payload || null,
    order_number: hint.customerReference,
    orderline_id: hint.orderlineId,
    processed: opts.processed,
    processed_at: opts.processed ? new Date().toISOString() : null,
    error: opts.error || null,
  };
  const { error } = await supabase
    .from('parcel2go_webhook_events')
    .upsert(row, { onConflict: 'id', ignoreDuplicates: false });
  if (error) {
    // Don't fail the webhook over logging — Parcel2Go will retry forever if
    // we 500, and observability is best-effort.
    console.error('[parcel2go-webhook] failed to persist event log', error);
  }
}

/**
 * POST /api/shipping/webhook
 *
 * Public endpoint — authenticity is verified by HMAC-SHA256 signature.
 * Always returns 200 quickly (Parcel2Go will retry until 200 with backoff).
 * Signature/secret problems still return 401 so misconfig surfaces clearly.
 */
export async function handleParcel2GoWebhook(
  req: Request,
  res: Response
): Promise<void> {
  if (!config.PARCEL2GO_WEBHOOK_SECRET) {
    // We can't verify — refuse rather than silently process spoofed traffic.
    res.status(503).json({
      error: 'Parcel2Go webhook secret not configured',
      hint: 'Set PARCEL2GO_WEBHOOK_SECRET in the server env to enable webhook processing.',
    });
    return;
  }

  const envelope: WebhookEnvelope = (req.body || {}) as WebhookEnvelope;
  if (!envelope.Id || !envelope.Type || !envelope.Timestamp) {
    res.status(400).json({
      error: 'Invalid webhook envelope',
      message:
        'Expected { Id, Timestamp, Signature, Type, Payload } per Parcel2Go docs.',
    });
    return;
  }

  // 1. Verify signature.
  const verify = verifyWebhookSignature(
    envelope,
    config.PARCEL2GO_WEBHOOK_SECRET
  );
  if (!verify.valid) {
    console.warn(
      `[parcel2go-webhook] bad signature for id=${envelope.Id} type=${envelope.Type}`
    );
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  // 2. Replay guard via timestamp window (±15 min from now).
  const ageMs = Math.abs(Date.now() - new Date(envelope.Timestamp).getTime());
  if (Number.isFinite(ageMs) && ageMs > 15 * 60 * 1000) {
    console.warn(
      `[parcel2go-webhook] stale timestamp for id=${envelope.Id} (age=${Math.round(ageMs / 1000)}s) — accepting but flagging`
    );
    // We still process; just log the anomaly. Replay attacks are prevented
    // by the unique-Id PK below.
  }

  const hint = extractTrackingHint(envelope.Payload);

  // 3. Idempotency: if we've already processed this Id, ack and stop.
  const { data: existing } = await supabase
    .from('parcel2go_webhook_events')
    .select('id, processed')
    .eq('id', envelope.Id)
    .maybeSingle();
  if (existing?.processed) {
    res.status(200).json({ ok: true, idempotent: true });
    return;
  }

  // 4. Persist pre-processing.
  await logWebhook(envelope, hint, { processed: false });

  // 5. Dispatch by type. We treat any payload carrying tracking-shaped fields
  //    as a tracking event regardless of `Type`, since Parcel2Go uses
  //    dashboard-side subscriptions with names we can't predict.
  let processed = false;
  let error: string | undefined;

  const isCaseType = (envelope.Type || '').toLowerCase() === 'case';
  const looksLikeTracking =
    !isCaseType && (hint.orderlineId || hint.customerReference);

  try {
    if (looksLikeTracking) {
      const result = await syncOrderByParcel2GoRef({
        orderlineId: hint.orderlineId,
        customerReference: hint.customerReference,
        source: 'parcel2go-webhook',
      });
      if (!result) {
        error = `No order found for orderlineId=${hint.orderlineId} customerReference=${hint.customerReference}`;
      } else if (result.error) {
        error = result.error;
      } else {
        processed = true;
        // eslint-disable-next-line no-console
        console.log(
          `[parcel2go-webhook] ${envelope.Type} → ${result.order_number}: ${result.previous_status} → ${result.new_status} (stage=${result.stage}, transitioned=${result.transitioned})`
        );
      }
    } else {
      // Case events + unrecognised types: log + ack, no automation impact.
      processed = true;
      // eslint-disable-next-line no-console
      console.log(
        `[parcel2go-webhook] received Type=${envelope.Type} id=${envelope.Id} — logged, no automation applied`
      );
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown processing error';
    console.error('[parcel2go-webhook] processing failed', err);
  }

  await logWebhook(envelope, hint, {
    processed,
    ...(error ? { error } : {}),
  });

  // 6. Always ack 200 so Parcel2Go doesn't retry. Errors are surfaced via
  //    the event log + server logs.
  res.status(200).json({ ok: true, processed, error: error || null });
}
