const OPEN_SIGNALS = [
  'open to all',
  'anyone can',
  'no restrictions',
  'everyone is welcome',
  'open to developers worldwide',
  'no prerequisites',
];

const GATED_SIGNALS = [
  'students only',
  'must be enrolled',
  '18+',
  '18 years',
  'invite only',
  'invite-only',
  'membership required',
  'kyc',
  'must be a member',
  'university students',
  'college students',
];

const PARTIAL_SIGNALS = [
  '18+ preferred',
  'team of 2',
  'team of 2-4',
  'solo or team',
  'preferred background',
  'recommended experience',
];

/**
 * @param {string} text - eligibilityRaw + page heading text, combined
 * @returns {{ badge: "OPEN"|"GATED"|"PARTIAL"|"UNKNOWN", requirements: string[] }}
 */
export function classify(text) {
  const lower = text.toLowerCase();

  const partialMatches = PARTIAL_SIGNALS.filter(s => lower.includes(s));

  // GATED signals that are not already covered by a longer PARTIAL match
  const gatedMatches = GATED_SIGNALS.filter(s =>
    lower.includes(s) && !partialMatches.some(p => p.includes(s))
  );

  if (gatedMatches.length > 0) {
    return { badge: 'GATED', requirements: gatedMatches };
  }

  if (partialMatches.length > 0) {
    return { badge: 'PARTIAL', requirements: partialMatches };
  }

  const hasOpen = OPEN_SIGNALS.some(s => lower.includes(s));
  if (hasOpen) {
    return { badge: 'OPEN', requirements: [] };
  }

  return { badge: 'UNKNOWN', requirements: [] };
}
