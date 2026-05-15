import { createBrowserClient } from '@supabase/ssr';

/**
 * `createBrowserClient` from `@supabase/ssr` throws synchronously when its
 * URL or anon key are empty strings. That's a problem for SSR / build-time
 * prerender contexts where:
 *   1. The route module graph is evaluated to render HTML, and many
 *      components call `createClient()` inside their function body (or
 *      inside contexts that wrap the entire app), so a missing build env
 *      var would crash the whole render — not just disable Supabase.
 *   2. Build-time prerender of fully-static pages (legal/marketing) has no
 *      need to talk to Supabase at all, yet would still bomb out.
 *
 * To keep the SSR/prerender path resilient, we substitute harmless
 * placeholder values when the real env vars are missing. The browser
 * client object is constructable but any actual query will fail at call
 * time with a network error — which is exactly the existing behaviour
 * when env vars are misconfigured. Pages that don't call Supabase render
 * fine; pages that do surface the misconfiguration via their normal
 * error states.
 */
const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_ANON_KEY = 'placeholder-anon-key';

export function createClient() {
  const url = import.meta.env.VITE_SUPABASE_URL || PLACEHOLDER_URL;
  const anonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY || PLACEHOLDER_ANON_KEY;
  return createBrowserClient(url, anonKey);
}

