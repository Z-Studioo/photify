import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';

export interface AffiliateProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  code: string | null;
  promotion_id: string | null;
  commission_rate: number;
  customer_discount_pct: number;
  holding_days: number;
  payout_min: number;
  payout_method: string | null;
  payout_details: Record<string, unknown> | null;
  status: string;
}

interface AffiliateContextType {
  isAuthenticated: boolean;
  affiliate: AffiliateProfile | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AffiliateContext = createContext<AffiliateContextType | undefined>(undefined);

function isAffiliateAreaPath(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/affiliate');
}

function readRole(user: {
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}): string | undefined {
  const role = user.user_metadata?.role ?? user.app_metadata?.role;
  return typeof role === 'string' ? role : undefined;
}

export function AffiliateProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [affiliate, setAffiliate] = useState<AffiliateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchAffiliate = async () => {
    if (!isAffiliateAreaPath()) {
      setIsAuthenticated(false);
      setAffiliate(null);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setIsAuthenticated(false);
      setAffiliate(null);
      return;
    }

    if (readRole(session.user) !== 'affiliate') {
      setIsAuthenticated(false);
      setAffiliate(null);
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/affiliates/me`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );
      if (res.ok) {
        const json = await res.json();
        setAffiliate(json.data as AffiliateProfile);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setAffiliate(null);
      }
    } catch {
      setIsAuthenticated(false);
      setAffiliate(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchAffiliate();
      if (!cancelled) setLoading(false);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isAffiliateAreaPath()) return;
      if (session) {
        await supabase.auth.refreshSession();
      }
      await fetchAffiliate();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login: AffiliateContextType['login'] = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };

      if (!data.user || readRole(data.user) !== 'affiliate') {
        await supabase.auth.signOut();
        return { success: false, error: 'This account is not an affiliate account.' };
      }

      await supabase.auth.refreshSession();
      await fetchAffiliate();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setAffiliate(null);
  };

  const getAccessToken = async (): Promise<string | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  if (loading) return null;

  return (
    <AffiliateContext.Provider
      value={{
        isAuthenticated,
        affiliate,
        loading,
        login,
        logout,
        refresh: fetchAffiliate,
        getAccessToken,
      }}
    >
      {children}
    </AffiliateContext.Provider>
  );
}

export function useAffiliate() {
  const context = useContext(AffiliateContext);
  if (context === undefined) {
    throw new Error('useAffiliate must be used within an AffiliateProvider');
  }
  return context;
}
