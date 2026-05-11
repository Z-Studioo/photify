/**
 * Parcel2Go API client.
 *
 * Implements OAuth2 client_credentials authentication with in-memory token
 * caching plus typed wrappers around the endpoints we need (quotes, orders,
 * tracking, labels, webhooks). Docs: https://www.parcel2go.com/api/docs
 */
import crypto from 'crypto';
import { config } from '@/config/environment';

const SANDBOX_BASE = 'https://sandbox.parcel2go.com';
const LIVE_BASE = 'https://www.parcel2go.com';

function baseUrl(): string {
  return config.PARCEL2GO_ENV === 'live' ? LIVE_BASE : SANDBOX_BASE;
}

export class Parcel2GoConfigError extends Error {
  constructor(message = 'Parcel2Go is not configured') {
    super(message);
    this.name = 'Parcel2GoConfigError';
  }
}

export class Parcel2GoApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'Parcel2GoApiError';
    this.status = status;
    this.body = body;
  }
}

export function isParcel2GoConfigured(): boolean {
  return Boolean(
    config.PARCEL2GO_CLIENT_ID && config.PARCEL2GO_CLIENT_SECRET
  );
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: CachedToken | null = null;
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '==='.slice((normalized.length + 3) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function fetchAccessToken(): Promise<string> {
  if (!isParcel2GoConfigured()) {
    throw new Parcel2GoConfigError(
      'PARCEL2GO_CLIENT_ID and PARCEL2GO_CLIENT_SECRET must be set'
    );
  }

  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt - TOKEN_REFRESH_BUFFER_MS > now) {
    return tokenCache.accessToken;
  }

  const clientId = (config.PARCEL2GO_CLIENT_ID as string).trim();
  const clientSecret = (config.PARCEL2GO_CLIENT_SECRET as string).trim();

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'public-api payment',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const tokenUrl = `${baseUrl()}/auth/connect/token`;
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });

  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Parcel2GoApiError(
      res.status,
      `Parcel2Go auth failed (${tokenUrl}): ${json.error_description || json.error || res.statusText}`,
      json
    );
  }

  const accessToken: string | undefined = json.access_token;
  const expiresIn: number = Number(json.expires_in) || 7200;
  if (!accessToken) {
    throw new Parcel2GoApiError(
      res.status,
      'Parcel2Go auth response missing access_token',
      json
    );
  }

  tokenCache = {
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  return accessToken;
}

export interface AuthDebugInfo {
  env: 'sandbox' | 'live';
  tokenEndpoint: string;
  tokenReceived: boolean;
  expiresIn?: number | undefined;
  scopes?: string[] | undefined;
  audience?: string | string[] | undefined;
  issuer?: string | undefined;
  tokenPayload?: Record<string, unknown> | null;
}

export async function debugAuth(): Promise<AuthDebugInfo> {
  tokenCache = null;
  const tokenEndpoint = `${baseUrl()}/auth/connect/token`;
  const env: 'sandbox' | 'live' =
    config.PARCEL2GO_ENV === 'live' ? 'live' : 'sandbox';
  const token = await fetchAccessToken();
  const payload = decodeJwtPayload(token);
  const scopeRaw = (payload as any)?.scope;
  const scopes: string[] | undefined = Array.isArray(scopeRaw)
    ? scopeRaw
    : typeof scopeRaw === 'string'
      ? scopeRaw.split(' ')
      : undefined;
  const cached = tokenCache as CachedToken | null;
  const expiresIn =
    cached !== null
      ? Math.round((cached.expiresAt - Date.now()) / 1000)
      : undefined;
  return {
    env,
    tokenEndpoint,
    tokenReceived: true,
    expiresIn,
    scopes,
    audience: (payload as any)?.aud,
    issuer: (payload as any)?.iss,
    tokenPayload: payload,
  };
}

function invalidateToken(): void {
  tokenCache = null;
}

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retryOn401 = true
): Promise<T> {
  const token = await fetchAccessToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    ...((init.headers as Record<string, string>) || {}),
  };
  if (init.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${baseUrl()}${path}`, { ...init, headers });

  if (res.status === 401 && retryOn401) {
    invalidateToken();
    return apiFetch<T>(path, init, false);
  }

  const text = await res.text();
  let body: any;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!res.ok) {
    throw new Parcel2GoApiError(
      res.status,
      `Parcel2Go ${init.method || 'GET'} ${path} failed: ${
        body?.Message || body?.error || res.statusText
      }`,
      body
    );
  }

  return body as T;
}

// ---------- Types ----------

export interface QuoteAddress {
  ContactName?: string | undefined;
  Email?: string | undefined;
  Phone?: string | undefined;
  Property?: string | undefined;
  Street?: string | undefined;
  Town?: string | undefined;
  County?: string | undefined;
  Postcode?: string | undefined;
  Country: string;
  VatStatus?: 'Individual' | 'NotRegistered' | 'Registered';
}

export interface OrderAddress {
  ContactName?: string | undefined;
  Organisation?: string | undefined;
  Email?: string | undefined;
  Phone?: string | undefined;
  Property?: string | undefined;
  Street?: string | undefined;
  Locality?: string | undefined;
  Town?: string | undefined;
  County?: string | undefined;
  Postcode?: string | undefined;
  CountryIsoCode: string;
  SpecialInstructions?: string | undefined;
}

export type Parcel2GoAddress = QuoteAddress;

export interface QuoteParcel {
  Value?: number;
  Weight: number;
  Length: number;
  Width: number;
  Height: number;
}

export type Parcel2GoParcel = QuoteParcel;

export interface OrderParcel {
  Id: string;
  Height: number;
  Length: number;
  Width: number;
  Weight: number;
  EstimatedValue?: number;
  DeliveryAddress: OrderAddress;
  ContentsSummary: string;
  Contents?: Array<{
    Description?: string;
    Quantity?: number;
    EstimatedValue?: number;
    TariffCode?: string;
    OriginCountry?: string;
  }>;
}

export interface QuoteRequest {
  Service?: string;
  CollectionAddress: QuoteAddress;
  DeliveryAddress: QuoteAddress;
  Parcels: QuoteParcel[];
}

export interface QuoteOption {
  Service?: {
    Slug?: string;
    Name?: string;
    CourierName?: string;
    Links?: { Logo?: string };
  };
  TotalPrice?: number;
  TotalPriceExVat?: number;
  TotalVat?: number;
  EstimatedDeliveryDate?: string;
  CollectionType?: string;
  Hash?: string;
  [key: string]: unknown;
}

export interface QuotesResponse {
  Quotes?: QuoteOption[];
  [key: string]: unknown;
}

export interface BookOrderItem {
  Id: string;
  CollectionDate: string;
  Service: string;
  Reference?: string;
  CustomerReference?: string;
  OriginCountry?: string;
  VatStatus?: 'Individual' | 'NotRegistered' | 'Registered';
  RecipientVatStatus?: 'Individual' | 'NotRegistered' | 'Registered';
  CollectionAddress: OrderAddress;
  Parcels: OrderParcel[];
}

export interface BookOrderRequest {
  Items: BookOrderItem[];
  CustomerDetails?: {
    Email?: string;
    Forename?: string;
    Surname?: string;
    Telephone?: string;
  };
}

export interface BookOrderResponse {
  OrderId?: number | string;
  Links?: {
    PayWithPrePay?: string;
    payment?: string;
    help?: string;
  };
  Items?: Array<{
    Id?: number | string;
    Service?: string;
    Courier?: string;
    CollectionDate?: string;
    TrackingNumber?: string;
    Parcels?: Array<{
      Id?: number | string;
      Links?: Record<string, string>;
    }>;
  }>;
  TotalPrice?: number;
  TotalVat?: number;
  TotalPriceExVat?: number;
  [key: string]: unknown;
}

export interface PayWithPrepayResponse {
  Links?: Array<{ Name?: string; Link?: string }>;
  Errors?: Array<{ Name?: string; Description?: string }>;
  [key: string]: unknown;
}

/**
 * Parcel2Go tracking response. `Stage` is the canonical lifecycle value we
 * drive automation off:
 *   Booked → Collected | DroppedOff → InTransit → AtDepot →
 *   DeliveryScheduled → Delivered (or MajorError on exception).
 */
export interface TrackingEvent {
  Code?: string;
  Description?: string;
  Timestamp?: string;
  Location?: string;
  Stage?: string;
}

export interface TrackingResponse {
  OrderLineId?: number | string;
  TrackingNumber?: string;
  Stage?: string;
  Carrier?: string;
  Service?: string;
  EstimatedDelivery?: string;
  Delivered?: string;
  Collected?: string;
  Results?: TrackingEvent[];
  [key: string]: unknown;
}

// ---------- Public API ----------

export async function getQuotes(req: QuoteRequest): Promise<QuotesResponse> {
  return apiFetch<QuotesResponse>('/api/quotes', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export async function createDraftOrder(
  payload: BookOrderRequest
): Promise<BookOrderResponse> {
  return apiFetch<BookOrderResponse>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function extractPayWithPrepayHash(
  url: string | undefined
): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return u.searchParams.get('hash') || undefined;
  } catch {
    const match = url.match(/[?&]hash=([^&]+)/);
    return match ? decodeURIComponent(match[1] as string) : undefined;
  }
}

export async function payOrderWithPrepay(
  orderId: number | string,
  hash?: string
): Promise<PayWithPrepayResponse> {
  const query = hash ? `?hash=${encodeURIComponent(hash)}` : '';
  return apiFetch<PayWithPrepayResponse>(
    `/api/orders/${encodeURIComponent(String(orderId))}/paywithprepay${query}`,
    { method: 'POST' }
  );
}

export async function getOrder(orderId: number | string): Promise<unknown> {
  return apiFetch(`/api/orders/${encodeURIComponent(String(orderId))}`);
}

/**
 * Best-effort cancellation of a booked Parcel2Go order/orderline. Parcel2Go's
 * public docs don't specify a single canonical cancel endpoint and the
 * behaviour differs by service (some shipments are non-cancellable once
 * collected). We try the documented DELETE first; if it surfaces as a 4xx
 * that isn't auth-related, the caller treats it as "cancel manually in the
 * Parcel2Go dashboard" rather than failing the customer-facing refund.
 *
 * Returns the raw Parcel2Go response on success. Throws Parcel2GoApiError on
 * non-recoverable failures (auth, server errors).
 */
export async function cancelOrder(
  orderId: number | string
): Promise<unknown> {
  return apiFetch(`/api/orders/${encodeURIComponent(String(orderId))}`, {
    method: 'DELETE',
  });
}

export function findLabelLink(
  links: Array<{ Name?: string; Link?: string }> | undefined
): string | undefined {
  if (!links) return undefined;
  const isLabel = (name: string) =>
    /label/i.test(name) && !/picking/i.test(name);
  const direct = links.find(l => l.Name && l.Link && isLabel(l.Name));
  if (direct?.Link) return direct.Link;
  const loose = links.find(l => l.Name && l.Link && /label/i.test(l.Name));
  return loose?.Link;
}

export interface LabelsResponse {
  SuccessfulLabels?: number;
  FailedLabels?: number;
  Base64EncodedLabels?: string[];
  ErrorCode?: string;
  Message?: string;
  Help?: string;
}

export async function getLabels(opts: {
  reference: number | string;
  hash: string;
  referenceType?: 'OrderId' | 'OrderLineId';
  labelFormat?: 'PDF' | 'PNG';
  labelMedia?: 'A4' | 'Label4X6';
  detailLevel?: 'All' | 'Labels' | 'AdditionalDocuments' | 'Instructions';
}): Promise<LabelsResponse> {
  const query = new URLSearchParams({
    referenceType: opts.referenceType || 'OrderId',
    labelFormat: opts.labelFormat || 'PDF',
    labelMedia: opts.labelMedia || 'A4',
    detailLevel: opts.detailLevel || 'Labels',
    hash: opts.hash,
  });
  return apiFetch<LabelsResponse>(
    `/api/labels/${encodeURIComponent(String(opts.reference))}?${query.toString()}`
  );
}

/**
 * `orderLineRef` accepts either Parcel2Go's OrderLineId (the P2G number
 * returned as `Items[].Id` from the order creation response) or a raw
 * tracking number — the tracking endpoint resolves both.
 */
export async function getTracking(
  orderLineRef: string | number
): Promise<TrackingResponse> {
  return apiFetch<TrackingResponse>(
    `/api/tracking/${encodeURIComponent(String(orderLineRef))}`
  );
}

// ---------- Webhooks ----------

/**
 * Per Parcel2Go docs, the signature is HMAC-SHA256 of
 *   `Id + ":" + Timestamp.ToString("yyyy-MM-dd HH:mm:ss") + ":" + Type`
 * using the shared secret you configured in My Account → API → Webhooks.
 *
 * Their reference uses .NET's default `DateTime.ToString` (no timezone
 * conversion on the instance). We reformat using UTC components, which is
 * what every working Parcel2Go webhook example we've seen does (Z-marker
 * timestamps from their side, formatted as plain `yyyy-MM-dd HH:mm:ss`).
 */
export function formatWebhookTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid webhook timestamp: ${iso}`);
  }
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    ` ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  );
}

export interface WebhookEnvelope {
  Id?: string;
  Timestamp?: string;
  Signature?: string;
  Type?: string;
  Payload?: Record<string, unknown>;
}

export function computeWebhookSignature(
  id: string,
  timestamp: string,
  type: string,
  secret: string
): string {
  const ts = formatWebhookTimestamp(timestamp);
  const toHash = `${id}:${ts}:${type}`;
  return crypto
    .createHmac('sha256', secret)
    .update(toHash, 'utf8')
    .digest('hex');
}

export interface VerifyResult {
  valid: boolean;
  expected: string;
  toHash: string;
}

export function verifyWebhookSignature(
  envelope: WebhookEnvelope,
  secret: string
): VerifyResult {
  const { Id, Timestamp, Type, Signature } = envelope;
  if (!Id || !Timestamp || !Type || !Signature || !secret) {
    return { valid: false, expected: '', toHash: '' };
  }
  let expected: string;
  let ts: string;
  try {
    ts = formatWebhookTimestamp(Timestamp);
    expected = computeWebhookSignature(Id, Timestamp, Type, secret);
  } catch {
    return { valid: false, expected: '', toHash: '' };
  }
  const toHash = `${Id}:${ts}:${Type}`;
  const a = Buffer.from(expected.toLowerCase(), 'utf8');
  const b = Buffer.from(Signature.toLowerCase(), 'utf8');
  if (a.length !== b.length) return { valid: false, expected, toHash };
  return { valid: crypto.timingSafeEqual(a, b), expected, toHash };
}

export const parcel2go = {
  baseUrl,
  isConfigured: isParcel2GoConfigured,
  getQuotes,
  createDraftOrder,
  payOrderWithPrepay,
  extractPayWithPrepayHash,
  findLabelLink,
  getOrder,
  cancelOrder,
  getLabels,
  getTracking,
  verifyWebhookSignature,
  computeWebhookSignature,
  formatWebhookTimestamp,
};
