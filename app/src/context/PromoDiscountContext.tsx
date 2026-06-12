import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useCart } from '@/context/CartContext';
import { createClient } from '@/lib/supabase/client';
import {
  clearPromoSession,
  EMPTY_RESOLVED_PROMO,
  getDiscountPercentForProduct,
  getPromoSession,
  normalizeScope,
  pickHighestPromo,
  savingsForItems,
  savingsForSubtotal,
  setPromoSession,
  type ProductPromoContext,
  type PromoCandidate,
  type PromoLineItem,
  type PromoScope,
  type ResolvedPromo,
} from '@/lib/pricing/promo';

interface PromoRow {
  code: string;
  value: number;
  type: string;
  categories?: string[] | null;
  excluded_product_ids?: string[] | null;
  end_date?: string | null;
}

interface PromoDiscountContextValue extends ResolvedPromo {
  loading: boolean;
  getDiscountForProduct: (context?: ProductPromoContext) => number;
  savingsForItems: (items: PromoLineItem[]) => number;
  savingsFor: (subtotal: number) => number;
}

const PromoDiscountContext = createContext<PromoDiscountContextValue | undefined>(
  undefined
);

function normalizePercent(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function sessionToResolved(session: ReturnType<typeof getPromoSession>): ResolvedPromo {
  if (!session) return EMPTY_RESOLVED_PROMO;
  return {
    winningCode: session.code,
    discountPercent: session.percent,
    source: session.source,
    scope: session.scope,
  };
}

function rowScope(row: PromoRow): PromoScope {
  return normalizeScope(row.categories, row.excluded_product_ids);
}

export function PromoDiscountProvider({ children }: { children: ReactNode }) {
  const {
    cartItems,
    userAppliedPromoCode,
    affiliateRef,
    setPromoApplied,
    setDiscount,
    setAppliedPromoCode,
    hydrated,
  } = useCart();

  const [autoApplyPromo, setAutoApplyPromo] = useState<PromoRow | null>(null);
  const [candidateRows, setCandidateRows] = useState<PromoRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Hydrate instantly from cookie before network.
  const [resolved, setResolved] = useState<ResolvedPromo>(() =>
    sessionToResolved(getPromoSession())
  );

  const fetchAutoApplyPromo = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_active_auto_promo');

      if (!error && data && data.length > 0) {
        const row = data[0] as PromoRow;
        if (row.type === 'percentage') {
          setAutoApplyPromo(row);
          return;
        }
      }

      // Fallback when RPC not deployed yet. Mirror the RPC's active/date
      // guards so we never hydrate an inactive or expired auto promo.
      if (error) {
        const today = new Date().toISOString().split('T')[0];
        const { data: fallback, error: fbErr } = await supabase
          .from('promotions')
          .select(
            'code, value, type, categories, excluded_product_ids, end_date'
          )
          .eq('auto_apply', true)
          .eq('is_active', true)
          .lte('start_date', today)
          .gte('end_date', today)
          .maybeSingle();

        if (!fbErr && fallback && fallback.type === 'percentage') {
          setAutoApplyPromo(fallback as PromoRow);
          return;
        }
      }

      setAutoApplyPromo(null);
    } catch {
      setAutoApplyPromo(null);
    }
  }, []);

  useEffect(() => {
    void fetchAutoApplyPromo();
  }, [fetchAutoApplyPromo]);

  const candidateCodes = useMemo(() => {
    const codes = new Set<string>();
    if (userAppliedPromoCode) codes.add(userAppliedPromoCode);
    if (affiliateRef) codes.add(affiliateRef);
    if (autoApplyPromo?.code) codes.add(autoApplyPromo.code);
    return [...codes];
  }, [userAppliedPromoCode, affiliateRef, autoApplyPromo?.code]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (candidateCodes.length === 0) {
        setCandidateRows([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const supabase = createClient();
        // Case-insensitive match so codes resolve regardless of stored
        // casing (DB validation also uses upper(code) = upper(...)).
        const orFilter = candidateCodes
          .map(code => `code.ilike.${code}`)
          .join(',');
        const { data, error } = await supabase
          .from('promotions')
          .select(
            'code, value, type, categories, excluded_product_ids, end_date'
          )
          .or(orFilter);

        if (cancelled) return;

        if (error) {
          console.warn('[PromoDiscount] candidate fetch failed:', error.message);
          setCandidateRows([]);
          return;
        }

        setCandidateRows(
          (data ?? []).filter((row): row is PromoRow => row.type === 'percentage')
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [candidateCodes.join('|')]);

  const computedResolved = useMemo(() => {
    const byCode = new Map(candidateRows.map(row => [row.code.toUpperCase(), row]));
    const candidates: PromoCandidate[] = [];

    if (userAppliedPromoCode) {
      const row = byCode.get(userAppliedPromoCode.toUpperCase());
      const percent = normalizePercent(row?.value);
      if (percent > 0) {
        candidates.push({
          code: userAppliedPromoCode.toUpperCase(),
          percent,
          source: 'manual',
          scope: row ? rowScope(row) : normalizeScope(),
        });
      }
    }

    if (affiliateRef) {
      const row = byCode.get(affiliateRef.toUpperCase());
      const percent = normalizePercent(row?.value);
      if (percent > 0) {
        candidates.push({
          code: affiliateRef.toUpperCase(),
          percent,
          source: 'affiliate',
          scope: row ? rowScope(row) : normalizeScope(),
        });
      }
    }

    if (autoApplyPromo?.code) {
      const percent = normalizePercent(autoApplyPromo.value);
      if (percent > 0) {
        candidates.push({
          code: autoApplyPromo.code.toUpperCase(),
          percent,
          source: 'auto_apply',
          scope: rowScope(autoApplyPromo),
        });
      }
    }

    return pickHighestPromo(candidates);
  }, [candidateRows, userAppliedPromoCode, affiliateRef, autoApplyPromo]);

  // Update resolved state and persist cookie when network resolution completes.
  // The cookie is reserved for sitewide auto-apply promos only: it exists to
  // pre-paint discounted pricing on first paint before any network call.
  // Manual codes live in cart storage and affiliate codes in `photify_ref`,
  // so we never persist those here (and we clear any stale cookie).
  useEffect(() => {
    if (computedResolved.winningCode) {
      setResolved(computedResolved);
      if (computedResolved.source === 'auto_apply') {
        const row =
          candidateRows.find(
            r =>
              r.code.toUpperCase() ===
              computedResolved.winningCode!.toUpperCase()
          ) ?? autoApplyPromo;
        setPromoSession(
          {
            code: computedResolved.winningCode,
            percent: computedResolved.discountPercent,
            source: computedResolved.source,
            scope: computedResolved.scope,
          },
          row?.end_date
        );
      } else {
        clearPromoSession();
      }
    } else if (!loading) {
      // Resolution finished with no winner (no candidates, or all expired/
      // inactive). Drop any previously cached cookie so pricing resets.
      setResolved(EMPTY_RESOLVED_PROMO);
      clearPromoSession();
    }
  }, [computedResolved, candidateRows, autoApplyPromo, loading]);

  // Sync winning code to cart charge state when items exist.
  useEffect(() => {
    if (!hydrated) return;

    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (!resolved.winningCode || cartItems.length === 0 || subtotal <= 0) {
      if (cartItems.length === 0) {
        setPromoApplied(false);
        setDiscount(0);
        setAppliedPromoCode('');
      }
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('is_promotion_valid', {
          promotion_code: resolved.winningCode,
          order_total: subtotal,
        });

        if (cancelled || error) return;

        if (data && data.length > 0 && data[0].valid) {
          setPromoApplied(true);
          setDiscount(data[0].discount_amount);
          setAppliedPromoCode(resolved.winningCode!);
        } else {
          setPromoApplied(false);
          setDiscount(0);
          setAppliedPromoCode('');
        }
      } catch {
        /* best-effort charge sync */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    hydrated,
    resolved.winningCode,
    cartItems,
    setPromoApplied,
    setDiscount,
    setAppliedPromoCode,
  ]);

  const getDiscountForProduct = useCallback(
    (context?: ProductPromoContext) =>
      getDiscountPercentForProduct(resolved, context),
    [resolved]
  );

  const savingsForItemsFn = useCallback(
    (items: PromoLineItem[]) => savingsForItems(resolved, items),
    [resolved]
  );

  const savingsFor = useCallback(
    (subtotal: number) => savingsForSubtotal(resolved, subtotal),
    [resolved]
  );

  const value = useMemo(
    () => ({
      ...resolved,
      loading,
      getDiscountForProduct,
      savingsForItems: savingsForItemsFn,
      savingsFor,
    }),
    [resolved, loading, getDiscountForProduct, savingsForItemsFn, savingsFor]
  );

  return (
    <PromoDiscountContext.Provider value={value}>
      {children}
    </PromoDiscountContext.Provider>
  );
}

export function usePromoDiscount() {
  const context = useContext(PromoDiscountContext);
  if (context === undefined) {
    throw new Error('usePromoDiscount must be used within a PromoDiscountProvider');
  }
  return context;
}
