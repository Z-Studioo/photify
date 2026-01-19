// Note: This file was originally for Next.js server-side rendering.
// In a Vite/React app, use the client.ts file instead.
// This re-exports the client for compatibility.

import { createClient as createBrowserClient } from './client';

export async function createClient() {
  // In Vite, we use the browser client instead of server client
  return createBrowserClient();
}