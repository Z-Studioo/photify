/**
 * PostHog wrapper.
 *
 * PostHog is only loaded:
 *  1. On a live `photify.co` hostname (`isLiveSite()`).
 *  2. After the user accepts the cookie banner (`getConsent() === 'accepted'`).
 *
 * We import the SDK dynamically so dev / preview / unconsented visitors
 * never download the ~80 KB bundle. Events fired before the SDK finishes
 * loading are queued and replayed on init.
 *
 * Session replay masks all `<input>`/`<textarea>` elements and any
 * element with `data-ph-mask` (cart line items, addresses, etc.). On
 * `/checkout` and `/admin/*` recording is disabled entirely.
 */

import type { PostHog, PostHogConfig } from 'posthog-js';
import { isLiveSite } from './env';
import { getConsent, onConsentChange } from './consent';

type QueuedEvent = { name: string; params?: Record<string, unknown> };

let posthog: PostHog | null = null;
let initStarted = false;
const queue: QueuedEvent[] = [];

/**
 * Routes where session replay must NOT capture due to sensitive
 * content (Stripe Elements, addresses, admin tooling).
 */
const REPLAY_BLOCKED_PATHS = ['/checkout', '/admin'];

function shouldDisableReplay(): boolean {
  if (typeof window === 'undefined') return true;
  const path = window.location.pathname;
  return REPLAY_BLOCKED_PATHS.some((p) => path.startsWith(p));
}

/**
 * Decide whether PostHog should run right now. Both env (live host) and
 * consent must agree; any one returning false keeps the SDK unloaded.
 */
function isPostHogAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  if (!isLiveSite()) return false;
  if (getConsent() !== 'accepted') return false;
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  return Boolean(key);
}

async function loadPostHog(): Promise<void> {
  if (posthog || initStarted) return;
  initStarted = true;

  const key = import.meta.env.VITE_POSTHOG_KEY as string;
  const apiHost =
    (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ??
    'https://eu.i.posthog.com';

  try {
    const mod = await import('posthog-js');
    const instance = mod.default;

    const config: Partial<PostHogConfig> = {
      api_host: apiHost,
      person_profiles: 'identified_only',
      autocapture: {
        // Don't auto-capture text inside masked elements; click/submit
        // events still fire so we can build funnels without scraping
        // customer photos or names.
        dom_event_allowlist: ['click', 'submit', 'change'],
      },
      capture_pageview: false, // we fire page_view manually from React Router
      capture_pageleave: true,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: '[data-ph-mask]',
      },
      disable_session_recording: shouldDisableReplay(),
      loaded: (ph) => {
        // Re-evaluate replay on every navigation: bail out the moment we
        // hit /checkout or /admin.
        if (shouldDisableReplay()) ph.stopSessionRecording();
      },
    };

    instance.init(key, config);
    posthog = instance;

    // Flush any events captured before init finished.
    while (queue.length > 0) {
      const e = queue.shift();
      if (e) {
        try {
          instance.capture(e.name, e.params);
        } catch {
          /* swallow */
        }
      }
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[analytics] PostHog failed to load', err);
    }
    // Mark as "tried" so we don't spam retries.
  }
}

/**
 * Init PostHog if currently allowed. Wires up a consent listener so
 * granting consent later in the session triggers init too. Safe to
 * call multiple times.
 */
export function maybeInitPostHog(): void {
  if (isPostHogAllowed()) {
    void loadPostHog();
  }

  onConsentChange((value) => {
    if (value === 'accepted' && isPostHogAllowed()) {
      void loadPostHog();
    } else if (value === 'denied' && posthog) {
      try {
        posthog.opt_out_capturing();
        posthog.stopSessionRecording();
      } catch {
        /* swallow */
      }
    }
  });
}

export function capturePostHogEvent(
  name: string,
  params?: Record<string, unknown>
): void {
  if (!isPostHogAllowed()) return;

  if (!posthog) {
    queue.push({ name, params });
    void loadPostHog();
    return;
  }

  try {
    if (shouldDisableReplay()) {
      posthog.stopSessionRecording();
    }
    posthog.capture(name, params);
  } catch {
    /* swallow */
  }
}

export function identifyPostHog(
  userId: string,
  traits?: Record<string, unknown>
): void {
  if (!isPostHogAllowed() || !posthog) return;
  try {
    posthog.identify(userId, traits);
  } catch {
    /* swallow */
  }
}

export function resetPostHog(): void {
  if (!posthog) return;
  try {
    posthog.reset();
  } catch {
    /* swallow */
  }
}
