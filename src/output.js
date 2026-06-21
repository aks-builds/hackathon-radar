import chalk from 'chalk';

const USE_COLOUR = process.stdout.isTTY ?? false;
const c = USE_COLOUR ? chalk : new Proxy({}, { get: () => (s) => s });

const BADGE_ORDER = { OPEN: 0, PARTIAL: 1, GATED: 2, UNKNOWN: 3 };

function badgeLabel(badge) {
  switch (badge) {
    case 'OPEN':    return c.green('🟢 OPEN TO ALL');
    case 'GATED':   return c.red('🔴 GATED');
    case 'PARTIAL': return c.yellow('🟡 PARTIAL');
    default:        return '⚪ UNKNOWN';
  }
}

function formatRecord(r) {
  const days = r.daysLeft !== null ? `${r.daysLeft}d left` : 'deadline unknown';
  const prize = r.prize ?? 'no prize listed';
  const lines = [
    `✅ ${c.bold(r.name)} · ${days} · ${c.cyan(prize)} · ${badgeLabel(r.badge)}`,
    `   ↳ ${r.joinUrl ?? r.url}`,
  ];
  if (r.objective) lines.push(`   ↳ Objective: ${r.objective}`);
  if (r.eligibilityRaw && r.badge === 'OPEN') lines.push(`   ↳ Eligibility: ${r.eligibilityRaw}`);
  if (r.requirements.length > 0) lines.push(`   ↳ ⚠ Requirements: ${r.requirements.join(', ')}`);
  return lines.join('\n');
}

/**
 * @param {object[]} records
 * @param {{ quiet?: boolean }} opts
 * @returns {string}
 */
export function renderLog(records, { quiet = false } = {}) {
  const parts = [];
  if (!quiet) parts.push(c.blue(`searching · duckduckgo · hackathon ${new Date().getFullYear()} · ${new Date().toISOString().slice(0, 10)}`));
  parts.push('');
  parts.push(...records.map(formatRecord));
  parts.push('');
  parts.push(renderSummaryLine(records));
  return parts.join('\n');
}

/**
 * @param {object[]} records
 * @returns {string}
 */
export function renderJson(records) {
  const sorted = [...records].sort((a, b) => (BADGE_ORDER[a.badge] ?? 3) - (BADGE_ORDER[b.badge] ?? 3));
  return JSON.stringify(sorted, null, 2);
}

/**
 * @param {object[]} records
 * @returns {string}
 */
export function renderSummaryLine(records) {
  const open = records.filter(r => r.badge === 'OPEN').length;
  const gated = records.filter(r => r.badge === 'GATED').length;
  const partial = records.filter(r => r.badge === 'PARTIAL').length;
  return `${records.length} found · ${open} open to all · ${gated} gated · ${partial} partial · cached 1h · ${c.blue('--no-cache')} to refresh`;
}
