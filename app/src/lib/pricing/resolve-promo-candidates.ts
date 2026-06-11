import type { PromoCandidate, ResolvedPromo } from './types';

export function pickHighestPromo(candidates: PromoCandidate[]): ResolvedPromo {
  if (candidates.length === 0) {
    return { winningCode: null, discountPercent: 0, source: null };
  }

  const winner = candidates.reduce((best, current) =>
    current.percent > best.percent ? current : best
  );

  return {
    winningCode: winner.code,
    discountPercent: winner.percent,
    source: winner.source,
  };
}
