import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { supabase } from '@/lib/supabase';
import { config } from '@/config/environment';
import {
  parcel2go,
  isParcel2GoConfigured,
  Parcel2GoConfigError,
  Parcel2GoApiError,
  debugAuth,
  extractPayWithPrepayHash,
  findLabelLink,
  type QuoteAddress,
  type OrderAddress,
  type QuoteParcel,
  type OrderParcel,
  type BookOrderRequest,
} from '@/lib/parcel2go';
import { syncOrderByNumber } from '@/jobs/syncShipmentStatus';

/** Default parcel snapshot used when the order/items don't carry dimensions. */
const DEFAULT_PARCEL: QuoteParcel = {
  Value: 50,
  Weight: 2,
  Length: 40,
  Width: 30,
  Height: 5,
};

/**
 * Static sender / return address printed on every label. We only book
 * drop-off services (Evri ParcelShop) so no courier ever visits this
 * address — it just doubles as the "From" / returns address on the label.
 * Single source of truth; edit here if Photify ever moves.
 */
const SENDER_ADDRESS = {
  contactName: 'Photify Studio',
  email: 'shiv@zstudioo.com',
  phone: '07585630176',
  property: '46',
  street: 'James Watt Way',
  town: 'Erith',
  county: '',
  postcode: 'DA8 1SQ',
} as const;

function notConfigured(res: Response): void {
  res.status(503).json({
    error: 'Parcel2Go not configured',
    message:
      'Set PARCEL2GO_CLIENT_ID and PARCEL2GO_CLIENT_SECRET (and PARCEL2GO_ENV) in the server environment.',
  });
}

function handleApiError(err: unknown, res: Response, fallback: string): void {
  if (err instanceof Parcel2GoConfigError) {
    notConfigured(res);
    return;
  }
  if (err instanceof Parcel2GoApiError) {
    const env = config.PARCEL2GO_ENV;
    const isAuth = err.status === 401 || err.status === 403;
    res.status(err.status >= 400 && err.status < 600 ? err.status : 502).json({
      error: 'Parcel2Go API error',
      message: err.message,
      details: err.body,
      env,
      hint: isAuth
        ? `Authorization denied by Parcel2Go (currently targeting "${env}"). Sandbox and live use separate credentials — credentials created on sandbox.parcel2go.com only work with PARCEL2GO_ENV=sandbox, and credentials from www.parcel2go.com only work with PARCEL2GO_ENV=live. Also verify the "public-api" scope is granted on the client in My Account → API. Call GET /api/shipping/test-auth for decoded token diagnostics.`
        : undefined,
    });
    return;
  }
  console.error(fallback, err);
  res.status(500).json({
    error: fallback,
    message: err instanceof Error ? err.message : 'Unknown error',
  });
}

async function getOrderOr404(
  orderNumber: string | undefined,
  res: Response
): Promise<any | null> {
  if (!orderNumber) {
    res.status(400).json({ error: 'Order number is required' });
    return null;
  }
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single();

  if (error || !data) {
    res.status(404).json({ error: 'Order not found' });
    return null;
  }
  return data;
}

function splitAddressLine(raw: string): {
  property?: string | undefined;
  street?: string | undefined;
  town?: string | undefined;
} {
  if (!raw) return {};
  const parts = raw
    .split(/,/g)
    .map(p => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { street: parts[0] };
  const first = parts[0] || '';
  const town = parts[parts.length - 1];
  const propMatch = first.match(/^(\S+)\s+(.+)$/);
  if (propMatch) {
    return {
      property: propMatch[1],
      street: propMatch[2],
      town: parts.length > 1 ? town : undefined,
    };
  }
  return { street: first, town: parts.length > 1 ? town : undefined };
}

interface BuiltAddresses {
  collectionQuote: QuoteAddress;
  deliveryQuote: QuoteAddress;
  collectionOrder: OrderAddress;
  deliveryOrder: OrderAddress;
}

function buildAddressesFromOrder(order: any): BuiltAddresses {
  const shipping = order.shipping_address || {};
  const addressLine: string =
    typeof shipping === 'string' ? shipping : shipping.address || '';
  const postcode: string =
    (typeof shipping === 'object' ? shipping.postcode : '') ||
    order.shipping_postcode ||
    '';

  const split = splitAddressLine(addressLine);

  const deliveryQuote: QuoteAddress = {
    Country: 'GBR',
    ContactName: order.customer_name || undefined,
    Email: order.customer_email || undefined,
    Phone: order.customer_phone || undefined,
    Property: split.property,
    Street: split.street,
    Town: split.town,
    Postcode: postcode || undefined,
  };

  const collectionQuote: QuoteAddress = {
    Country: 'GBR',
    ContactName: SENDER_ADDRESS.contactName,
    Email: SENDER_ADDRESS.email,
    Phone: SENDER_ADDRESS.phone,
    Property: SENDER_ADDRESS.property,
    Street: SENDER_ADDRESS.street,
    Town: SENDER_ADDRESS.town,
    County: SENDER_ADDRESS.county || undefined,
    Postcode: SENDER_ADDRESS.postcode,
  };

  const deliveryOrder: OrderAddress = {
    CountryIsoCode: 'GBR',
    ContactName: order.customer_name || 'Customer',
    Email: order.customer_email || undefined,
    Phone: order.customer_phone || undefined,
    Property: split.property,
    Street: split.street,
    Town: split.town,
    Postcode: postcode || undefined,
  };

  const collectionOrder: OrderAddress = {
    CountryIsoCode: 'GBR',
    ContactName: SENDER_ADDRESS.contactName,
    Email: SENDER_ADDRESS.email,
    Phone: SENDER_ADDRESS.phone,
    Property: SENDER_ADDRESS.property,
    Street: SENDER_ADDRESS.street,
    Town: SENDER_ADDRESS.town,
    County: SENDER_ADDRESS.county || undefined,
    Postcode: SENDER_ADDRESS.postcode,
  };

  return { collectionQuote, deliveryQuote, collectionOrder, deliveryOrder };
}

function validateDeliveryAddress(delivery: OrderAddress): string[] {
  const missing: string[] = [];
  if (!delivery.Postcode) missing.push('delivery postcode');
  if (!delivery.Property && !delivery.Street)
    missing.push('delivery property or street');
  return missing;
}

function normaliseParcels(input: unknown): QuoteParcel[] {
  const arr = Array.isArray(input) ? input : input ? [input] : [];
  if (arr.length === 0) return [DEFAULT_PARCEL];
  return arr.map(p => ({
    Value: Number((p as any).Value ?? (p as any).value ?? DEFAULT_PARCEL.Value),
    Weight: Number(
      (p as any).Weight ?? (p as any).weight ?? DEFAULT_PARCEL.Weight
    ),
    Length: Number(
      (p as any).Length ?? (p as any).length ?? DEFAULT_PARCEL.Length
    ),
    Width: Number((p as any).Width ?? (p as any).width ?? DEFAULT_PARCEL.Width),
    Height: Number(
      (p as any).Height ?? (p as any).height ?? DEFAULT_PARCEL.Height
    ),
  }));
}

/**
 * Parcel2Go's CustomerDetails requires both Forename and Surname (non-empty).
 * Photify stores customer_name as a single string ("Shiv" or "Shiv Karna"),
 * so we have to split heuristically and fall back when no surname is given.
 */
function splitCustomerName(fullName: string | null | undefined): {
  forename: string;
  surname: string;
} {
  const trimmed = (fullName || '').trim();
  if (!trimmed) return { forename: 'Customer', surname: 'Photify' };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    // Single-word name → duplicate so Parcel2Go's validator is satisfied.
    return { forename: parts[0] as string, surname: parts[0] as string };
  }
  const forename = parts[0] as string;
  const surname = parts.slice(1).join(' ');
  return { forename, surname };
}

function buildContentsSummary(order: any): string {
  const items: any[] = Array.isArray(order.items) ? order.items : [];
  if (items.length === 0) return 'Photify canvas print';
  const parts = items.slice(0, 3).map(i => {
    const qty = i.quantity || 1;
    const name = i.name || 'Canvas print';
    return qty > 1 ? `${qty}x ${name}` : name;
  });
  if (items.length > 3) parts.push(`+${items.length - 3} more`);
  return parts.join(', ').slice(0, 200);
}

/**
 * GET /api/shipping/config
 */
export async function getShippingConfig(
  _req: Request,
  res: Response
): Promise<void> {
  res.status(200).json({
    configured: isParcel2GoConfigured(),
    env: config.PARCEL2GO_ENV,
    webhooksConfigured: Boolean(config.PARCEL2GO_WEBHOOK_SECRET),
    senderAddress: {
      contactName: SENDER_ADDRESS.contactName,
      property: SENDER_ADDRESS.property,
      street: SENDER_ADDRESS.street,
      town: SENDER_ADDRESS.town,
      postcode: SENDER_ADDRESS.postcode,
    },
  });
}

/**
 * GET /api/shipping/test-auth
 */
export async function testShippingAuth(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    if (!isParcel2GoConfigured()) return notConfigured(res);
    const result = await debugAuth();
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof Parcel2GoApiError) {
      const status = err.status === 401 ? 401 : 502;
      res.status(status).json({
        success: false,
        error: 'Parcel2Go authentication failed',
        message: err.message,
        details: err.body,
        hint:
          err.status === 400 || err.status === 401
            ? 'Sandbox and live require separate credentials. Credentials created at www.parcel2go.com only work with PARCEL2GO_ENV=live; credentials created at sandbox.parcel2go.com only work with PARCEL2GO_ENV=sandbox. Also verify the "public-api" scope is enabled on the app in My Account.'
            : undefined,
      });
      return;
    }
    handleApiError(err, res, 'Parcel2Go test-auth failed');
  }
}

/**
 * POST /api/shipping/orders/:orderNumber/quotes
 */
export async function getQuotesForOrder(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!isParcel2GoConfigured()) return notConfigured(res);

    const { orderNumber } = req.params;
    const order = await getOrderOr404(orderNumber, res);
    if (!order) return;

    const parcels = normaliseParcels(req.body?.parcels);
    const { collectionQuote, deliveryQuote } = buildAddressesFromOrder(order);

    const quotes = await parcel2go.getQuotes({
      CollectionAddress: collectionQuote,
      DeliveryAddress: deliveryQuote,
      Parcels: parcels,
    });

    res.status(200).json({
      success: true,
      data: {
        parcels,
        collection: collectionQuote,
        delivery: deliveryQuote,
        quotes: quotes.Quotes || [],
        raw: quotes,
      },
    });
  } catch (err) {
    handleApiError(err, res, 'Failed to fetch Parcel2Go quotes');
  }
}

/**
 * POST /api/shipping/orders/:orderNumber/book
 *
 * Books the chosen service with Parcel2Go, optionally pays via prepay
 * balance, and persists shipment details on the order.
 *
 * NOTE: We deliberately do *not* flip the order status to `shipped` here.
 * Booking a label only means the label exists — the parcel isn't dispatched
 * until the customer drops it at the ParcelShop. The actual `shipped` /
 * `delivered` transitions are driven by Parcel2Go tracking webhooks (or the
 * polling cron as a safety net) so the customer-facing status always
 * reflects physical reality.
 */
export async function bookShipmentForOrder(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!isParcel2GoConfigured()) return notConfigured(res);

    const { orderNumber } = req.params;
    const {
      serviceSlug,
      hash,
      collectionDate,
      parcels,
      payWithPrepay = true,
      serviceName,
      courierName,
      totalPrice,
    } = req.body || {};

    if (!serviceSlug) {
      res.status(400).json({ error: 'serviceSlug is required' });
      return;
    }
    if (!collectionDate) {
      res.status(400).json({ error: 'collectionDate is required (ISO date)' });
      return;
    }

    const order = await getOrderOr404(orderNumber, res);
    if (!order) return;

    if (order.parcel2go_order_id) {
      res.status(400).json({
        error: 'Order already has a Parcel2Go shipment booked',
        parcel2go_order_id: order.parcel2go_order_id,
      });
      return;
    }

    const parcelList = normaliseParcels(parcels);
    const { collectionOrder, deliveryOrder } = buildAddressesFromOrder(order);

    const missingFields = validateDeliveryAddress(deliveryOrder);
    if (missingFields.length > 0) {
      res.status(400).json({
        error: 'Delivery address validation failed',
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields,
        hint: 'The order is missing usable shipping_address fields — fix the order record before booking.',
      });
      return;
    }

    const contentsSummary = buildContentsSummary(order);

    const orderParcels: OrderParcel[] = parcelList.map(p => ({
      Id: randomUUID(),
      Height: p.Height,
      Length: p.Length,
      Width: p.Width,
      Weight: p.Weight,
      EstimatedValue: p.Value ?? 50,
      DeliveryAddress: deliveryOrder,
      ContentsSummary: contentsSummary,
    }));

    const itemId = randomUUID();
    const bookRequest: BookOrderRequest = {
      Items: [
        {
          Id: itemId,
          CollectionDate: new Date(collectionDate).toISOString(),
          Service: serviceSlug,
          // Echo our order number back as both refs so webhook deliveries can
          // be matched even if the OrderLineId mapping ever drifts.
          Reference: order.order_number,
          CustomerReference: order.order_number,
          OriginCountry: 'GBR',
          VatStatus: 'Individual',
          RecipientVatStatus: 'Individual',
          CollectionAddress: collectionOrder,
          Parcels: orderParcels,
        },
      ],
      CustomerDetails: (() => {
        const { forename, surname } = splitCustomerName(order.customer_name);
        return {
          Email: order.customer_email || undefined,
          Forename: forename,
          Surname: surname,
          Telephone: order.customer_phone || undefined,
        };
      })(),
    };

    const draft = await parcel2go.createDraftOrder(bookRequest);
    const payHash = extractPayWithPrepayHash(draft.Links?.PayWithPrePay);

    let paid: unknown = null;
    let labelUrl: string | null = null;
    if (payWithPrepay && draft.OrderId) {
      try {
        const payResp = await parcel2go.payOrderWithPrepay(
          draft.OrderId,
          payHash
        );
        paid = payResp;
        labelUrl = findLabelLink(payResp.Links) || null;
      } catch (payErr) {
        const persistOnFailure: Record<string, unknown> = {
          parcel2go_order_id: String(draft.OrderId),
          parcel2go_hash: payHash || hash || null,
          service_id: serviceSlug,
          service_name: serviceName || null,
          carrier_name: courierName || null,
          parcel_dimensions: parcelList,
        };
        await supabase
          .from('orders')
          .update(persistOnFailure)
          .eq('order_number', orderNumber);
        handleApiError(
          payErr,
          res,
          'Parcel2Go shipment created but prepay payment failed'
        );
        return;
      }
    }

    const firstItem = draft.Items?.[0];
    const resolvedCarrier = firstItem?.Courier || courierName || null;
    const resolvedServiceName =
      firstItem?.Service || serviceName || serviceSlug;
    const orderlineId = firstItem?.Id ? String(firstItem.Id) : null;
    const trackingNumber = firstItem?.TrackingNumber || null;

    const nowIso = new Date().toISOString();

    const updatePayload: Record<string, unknown> = {
      parcel2go_order_id: draft.OrderId ? String(draft.OrderId) : null,
      parcel2go_orderline_id: orderlineId,
      parcel2go_hash: payHash || hash || null,
      tracking_number: trackingNumber,
      tracking_url: null,
      tracking_stage: 'Booked',
      tracking_last_synced_at: nowIso,
      carrier_name: resolvedCarrier,
      service_name: resolvedServiceName,
      service_id: serviceSlug,
      label_url: labelUrl,
      parcel_dimensions: parcelList,
      shipment_cost:
        typeof totalPrice === 'number'
          ? totalPrice
          : typeof draft.TotalPrice === 'number'
            ? draft.TotalPrice
            : null,
    };

    const { error: updateErr } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('order_number', orderNumber);

    if (updateErr) {
      console.error(
        'Parcel2Go: shipment booked but failed to persist on order',
        updateErr
      );
      res.status(500).json({
        error: 'Shipment booked but failed to update order record',
        message: updateErr.message,
        parcel2go: draft,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message:
        'Shipment booked. Order will be marked Dispatched automatically once Parcel2Go reports drop-off.',
      data: {
        order_number: orderNumber,
        parcel2go_order_id: draft.OrderId,
        parcel2go_orderline_id: orderlineId,
        tracking_number: trackingNumber,
        tracking_url: null,
        tracking_stage: 'Booked',
        label_url: labelUrl,
        carrier_name: resolvedCarrier,
        service_name: resolvedServiceName,
        paid: Boolean(paid),
        raw: { draft, paid },
      },
    });
  } catch (err) {
    handleApiError(err, res, 'Failed to book Parcel2Go shipment');
  }
}

/**
 * GET /api/shipping/orders/:orderNumber/label
 * Streams the shipping label PDF to the admin client.
 */
export async function getShipmentLabel(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!isParcel2GoConfigured()) return notConfigured(res);

    const { orderNumber } = req.params;
    const order = await getOrderOr404(orderNumber, res);
    if (!order) return;

    if (!order.parcel2go_order_id) {
      res
        .status(400)
        .json({ error: 'Order has no Parcel2Go shipment booked yet' });
      return;
    }
    if (!order.parcel2go_hash) {
      res.status(400).json({
        error: 'Missing Parcel2Go hash on the order — cannot fetch label',
        hint: 'The hash is captured when the shipment is booked. Rebook to populate it, or copy it manually from the Parcel2Go dashboard URL.',
      });
      return;
    }

    const media =
      (req.query.media as string) === 'Label4X6' ? 'Label4X6' : 'A4';
    const format = (req.query.format as string) === 'PNG' ? 'PNG' : 'PDF';
    const inline = req.query.inline === '1' || req.query.inline === 'true';

    let labelResp;
    try {
      labelResp = await parcel2go.getLabels({
        reference: order.parcel2go_order_id,
        hash: order.parcel2go_hash,
        referenceType: 'OrderId',
        labelFormat: format,
        labelMedia: media,
        detailLevel: 'Labels',
      });
    } catch (err) {
      handleApiError(err, res, 'Failed to fetch shipment label');
      return;
    }

    const base64 = labelResp.Base64EncodedLabels?.[0];
    if (!base64 || (labelResp.SuccessfulLabels ?? 0) < 1) {
      res.status(404).json({
        error: 'Label not available yet',
        message:
          labelResp.Message ||
          'Parcel2Go has not generated the label yet — try again in a minute.',
        details: labelResp,
      });
      return;
    }

    const bytes = Buffer.from(base64, 'base64');
    const contentType = format === 'PNG' ? 'image/png' : 'application/pdf';
    const extension = format === 'PNG' ? 'png' : 'pdf';
    const filename = `parcel2go-label-${orderNumber}.${extension}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `${inline ? 'inline' : 'attachment'}; filename="${filename}"`
    );
    res.setHeader('Content-Length', String(bytes.length));
    res.setHeader('Cache-Control', 'private, max-age=0, no-store');
    res.status(200).end(bytes);
  } catch (err) {
    handleApiError(err, res, 'Failed to fetch shipment label');
  }
}

/**
 * POST /api/shipping/orders/:orderNumber/sync-tracking
 *
 * Manually pulls the latest Parcel2Go tracking and applies any matching
 * status transition (DroppedOff → shipped, Delivered → delivered). Fires the
 * customer email exactly once per transition. Useful when a webhook is
 * missed or when running in sandbox without webhooks wired up.
 */
export async function syncOrderTracking(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!isParcel2GoConfigured()) return notConfigured(res);
    const { orderNumber } = req.params;
    if (!orderNumber) {
      res.status(400).json({ error: 'Order number is required' });
      return;
    }
    const result = await syncOrderByNumber(orderNumber, {
      source: 'parcel2go-sync',
    });
    if (!result) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    handleApiError(err, res, 'Failed to sync Parcel2Go tracking');
  }
}

/**
 * GET /api/shipping/orders/:orderNumber/tracking
 * Returns the current Parcel2Go tracking snapshot. Read-only — does NOT
 * advance order status (use POST /sync-tracking for that).
 */
export async function getShipmentTracking(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!isParcel2GoConfigured()) return notConfigured(res);

    const { orderNumber } = req.params;
    const order = await getOrderOr404(orderNumber, res);
    if (!order) return;

    const ref =
      order.parcel2go_orderline_id ||
      order.parcel2go_order_id ||
      order.tracking_number;
    if (!ref) {
      res
        .status(400)
        .json({ error: 'Order has no Parcel2Go reference recorded yet' });
      return;
    }

    const tracking = await parcel2go.getTracking(ref);

    res.status(200).json({
      success: true,
      data: {
        reference: ref,
        tracking_number: order.tracking_number,
        tracking_url: order.tracking_url,
        carrier_name: order.carrier_name,
        service_name: order.service_name,
        stage: tracking.Stage || null,
        events: tracking,
      },
    });
  } catch (err) {
    handleApiError(err, res, 'Failed to fetch shipment tracking');
  }
}
