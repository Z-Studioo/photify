import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Wraps a `Headers` instance so cookies set by the Supabase client during a
 * loader/action are accumulated and can be merged into the eventual response.
 */
export interface SupabaseLoadResult<T> {
  data: T;
  headers: Headers;
}

interface ServerSupabaseEnv {
  url: string;
  anonKey: string;
}

function readEnv(): ServerSupabaseEnv {
  // Vite inlines VITE_* at build time; on the SSR runtime they're available
  // as `import.meta.env`. Falling back to `process.env` keeps this usable
  // from non-bundled Node contexts (build scripts, tests).
  const url =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    process.env.VITE_SUPABASE_URL ||
    '';
  const anonKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';
  return { url, anonKey };
}

/**
 * Build a Supabase server client bound to the incoming `Request`'s cookies.
 *
 * Use from loaders/actions:
 *
 *   export async function loader({ request }: Route.LoaderArgs) {
 *     const { supabase, headers } = createSupabaseServerClient(request);
 *     const { data: { user } } = await supabase.auth.getUser();
 *     return data({ user }, { headers });
 *   }
 *
 * Any `Set-Cookie` headers emitted by Supabase (token refresh, etc.) are
 * collected on the returned `headers` instance so the loader can attach them
 * to its response.
 */
export function createSupabaseServerClient(request: Request) {
  const { url, anonKey } = readEnv();
  const headers = new Headers();
  const cookieHeader = request.headers.get('Cookie') ?? '';

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(cookieHeader).map(({ name, value }) => ({
          name,
          value: value ?? '',
        }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          headers.append('Set-Cookie', serializeCookieHeader(name, value, options));
        }
      },
    },
  });

  return { supabase, headers };
}

/**
 * Convenience: load the current Supabase session (or null) from cookies on
 * the incoming request. Returns the cookie headers so the loader can forward
 * any Supabase-issued `Set-Cookie` values to the browser.
 */
export async function getServerSession(
  request: Request
): Promise<SupabaseLoadResult<{ session: Session | null; user: User | null }>> {
  const { supabase, headers } = createSupabaseServerClient(request);
  const { data: sessionData } = await supabase.auth.getSession();
  const { data: userData } = await supabase.auth.getUser();
  return {
    data: {
      session: sessionData.session ?? null,
      user: userData.user ?? null,
    },
    headers,
  };
}
