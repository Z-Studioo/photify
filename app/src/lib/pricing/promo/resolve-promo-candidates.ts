import type { PromoCandidate, ResolvedPromo } from './types';
import { EMPTY_RESOLVED_PROMO } from './types';

export function pickHighestPromo(candidates: PromoCandidate[]): ResolvedPromo {
  if (candidates.length === 0) {
    return EMPTY_RESOLVED_PROMO;
  }

  const winner = candidates.reduce((best, current) =>
    current.percent > best.percent ? current : best
  );

  return {
    winningCode: winner.code,
    discountPercent: winner.percent,
    source: winner.source,
    scope: winner.scope,
  };
}
