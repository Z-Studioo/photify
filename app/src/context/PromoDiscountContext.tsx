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
import { getAffiliateRef } from '@/lib/affiliate-ref';
import { createClient } from '@/lib/supabase/client';
import { pickHighestPromo } from '@/lib/pricing/resolve-promo-candidates';
import type { PromoCandidate, ResolvedPromo } from '@/lib/pricing/types';

interface PromoRow {
  code: string;
  value: number;
  type: string;
}

interface PromoDiscountContextValue extends ResolvedPromo {
  loading: boolean;
}

const PromoDiscountContext = createContext<PromoDiscountContextValue | undefined>(
  undefined
);

function normalizePercent(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
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

  const fetchAutoApplyPromo = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('promotions')
        .select('code, value, type')
        .eq('auto_apply', true)
        .maybeSingle();

      if (error) {
        // Column may not exist before migration — treat as no auto-apply.
        if (error.code === '42703' || error.message?.includes('auto_apply')) {
          setAutoApplyPromo(null);
          return;
        }
        console.warn('[PromoDiscount] auto_apply fetch failed:', error.message);
        setAutoApplyPromo(null);
        return;
      }

      if (data && data.type === 'percentage') {
        setAutoApplyPromo(data as PromoRow);
      } else {
        setAutoApplyPromo(null);
      }
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
        const { data, error } = await supabase
          .from('promotions')
          .select('code, value, type')
          .in('code', candidateCodes);

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

  const resolved = useMemo(() => {
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
        });
      }
    }

    return pickHighestPromo(candidates);
  }, [candidateRows, userAppliedPromoCode, affiliateRef, autoApplyPromo]);

  // Sync the winning code to cart charge state when items exist.
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

  const value = useMemo(
    () => ({
      ...resolved,
      loading,
    }),
    [resolved, loading]
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
