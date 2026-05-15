import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';
import { maybeInitPostHog } from '@/lib/analytics/posthog';

// PostHog opt-in: this checks `isLiveSite()` + consent state internally,
// so on dev / preview / unconsented visitors the SDK never loads and no
// network request is made. Returning customers who previously accepted
// will get PostHog booted right at hydration time.
maybeInitPostHog();

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
