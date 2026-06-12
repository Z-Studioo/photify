import type { PromoScope, PromoSession, PromoSource } from './types';
import { SITEWIDE_SCOPE } from './types';

const COOKIE_NAME = 'photify_promo';
const DEFAULT_TTL_DAYS = 30;

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function parseSession(raw: string): PromoSession | null {
  try {
    const parsed = JSON.parse(raw) as Partial<PromoSession>;
    if (
      !parsed?.code ||
      typeof parsed.percent !== 'number' ||
      !parsed.source ||
      typeof parsed.expiresAt !== 'number'
    ) {
      return null;
    }
    if (Date.now() > parsed.expiresAt) return null;

    const scope: PromoScope = parsed.scope ?? SITEWIDE_SCOPE;
    return {
      code: normalizeCode(parsed.code),
      percent: parsed.percent,
      source: parsed.source as PromoSource,
      scope: {
        categories: scope.categories ?? ['all'],
        excludedProductIds: scope.excludedProductIds ?? [],
      },
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

function expiryFromEndDate(endDate?: string | null): number {
  if (endDate) {
    const end = new Date(`${endDate}T23:59:59.999Z`).getTime();
    if (Number.isFinite(end)) return end;
  }
  return Date.now() + DEFAULT_TTL_DAYS * 24 * 60 * 60 * 1000;
}

export function setPromoSession(
  session: Omit<PromoSession, 'expiresAt'> & { expiresAt?: number },
  endDate?: string | null
): void {
  if (typeof document === 'undefined') return;
  const normalized = normalizeCode(session.code);
  if (!normalized || session.percent <= 0) return;

  const payload: PromoSession = {
    code: normalized,
    percent: session.percent,
    source: session.source,
    scope: session.scope,
    expiresAt: session.expiresAt ?? expiryFromEndDate(endDate),
  };

  const maxAgeSec = Math.max(
    60,
    Math.floor((payload.expiresAt - Date.now()) / 1000)
  );
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(payload))}; Max-Age=${maxAgeSec}; Path=/; SameSite=Lax${secure}`;
}

export function getPromoSession(): PromoSession | null {
  if (typeof document === 'undefined') return null;

  const cookie = document.cookie
    .split('; ')
    .find(c => c.startsWith(`${COOKIE_NAME}=`));

  if (!cookie) return null;

  const raw = cookie.slice(COOKIE_NAME.length + 1);
  return parseSession(decodeURIComponent(raw));
}

export function clearPromoSession(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}
