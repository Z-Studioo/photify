import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client for server-side usage (build-time loaders, prerender).
 * Reads env from import.meta.env (Vite-injected at build time) or process.env
 * (available in Node contexts like react-router.config.ts).
 */
export function createServerClient() {
  const url =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    process.env.VITE_SUPABASE_URL ||
    '';
  const key =
    (typeof import.meta !== 'undefined' &&
      import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
