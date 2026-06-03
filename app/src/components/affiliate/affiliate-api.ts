/**
 * Thin fetch wrapper that adds the affiliate's Supabase access token
 * to every API call. Centralised so all pages share the same auth/error
 * handling shape.
 */
export async function affiliateFetch<T = unknown>(
  path: string,
  options: RequestInit & { token: string | null }
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      message = body?.message || body?.error || message;
    } catch {
      /* response body wasn't JSON */
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
