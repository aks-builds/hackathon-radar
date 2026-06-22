const VALID_PLATFORMS = new Set(['web', 'devpost', 'mlh', 'github']);

const VALID_LOCATIONS = new Set([
  'asia', 'europe', 'americas', 'africa', 'oceania', 'global',
  'india', 'usa', 'uk', 'germany', 'canada', 'australia', 'japan', 'brazil',
  'singapore', 'france', 'netherlands', 'uae', 'sweden', 'norway', 'denmark',
  'finland', 'switzerland', 'spain', 'italy', 'poland', 'portugal', 'belgium',
  'austria', 'ireland', 'newzealand', 'southafrica', 'nigeria', 'kenya', 'egypt',
  'ghana', 'ethiopia', 'china', 'southkorea', 'indonesia', 'vietnam', 'thailand',
  'malaysia', 'philippines', 'pakistan', 'bangladesh', 'srilanka', 'nepal',
  'mexico', 'argentina', 'colombia', 'chile', 'peru', 'venezuela', 'ecuador',
  'israel', 'turkey', 'saudiarabia', 'qatar', 'kuwait',
]);

export function validateFlags(flags) {
  const errors = [];

  if (flags.location) {
    if (!VALID_LOCATIONS.has(flags.location.toLowerCase().replace(/\s+/g, ''))) {
      errors.push(
        `Unknown location "${flags.location}". Valid values: Asia, Europe, Americas, Africa, Oceania, Global, or a country name (e.g. India, Germany, USA).`
      );
    }
  }

  if (flags['min-days'] !== undefined) {
    const n = Number(flags['min-days']);
    if (!Number.isInteger(n) || n < 1) {
      errors.push('--min-days must be a whole number greater than 0 (e.g. --min-days 7).');
    }
  }

  if (flags.limit !== undefined) {
    const n = Number(flags.limit);
    if (!Number.isInteger(n) || n < 1) {
      errors.push('--limit must be a whole number greater than 0 (e.g. --limit 10).');
    }
  }

  if (flags.watch) {
    if (!/^\d+(m|h)$/.test(flags.watch)) {
      errors.push('--watch must be a duration like 30m or 1h.');
    }
  }

  if (flags.watch && flags.json) {
    errors.push('--watch and --json cannot be used together.');
  }

  if (flags.platform) {
    if (!VALID_PLATFORMS.has(flags.platform)) {
      errors.push(`Unknown platform "${flags.platform}". Valid values: web, devpost, mlh, github.`);
    }
    if (flags.platform === 'github' && Number(flags.limit) > 10) {
      errors.push('--platform github supports a maximum of 10 results (--limit 10 or less).');
    }
  }

  return { ok: errors.length === 0, errors };
}
