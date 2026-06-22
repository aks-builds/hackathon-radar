import chalk from 'chalk';

const USE_COLOUR = process.stdout.isTTY ?? false;
const c = USE_COLOUR ? chalk : new Proxy({}, { get: () => (s) => s });

const BADGE_ORDER = { OPEN: 0, PARTIAL: 1, GATED: 2, UNKNOWN: 3 };

function trunc(text, max) {
  if (!text) return text;
  return text.length > max ? text.slice(0, max) + '…' : text;
}

function badgeEmoji(badge) {
  switch (badge) {
    case 'OPEN':    return '🟢';
    case 'GATED':   return '🔴';
    case 'PARTIAL': return '🟡';
    default:        return '⚪';
  }
}

function badgeLabel(badge) {
  switch (badge) {
    case 'OPEN':    return c.green('OPEN TO ALL');
    case 'GATED':   return c.red('GATED');
    case 'PARTIAL': return c.yellow('PARTIAL');
    default:        return 'UNKNOWN';
  }
}

function formatRecord(r) {
  const days = r.daysLeft !== null ? `${r.daysLeft}d left` : 'deadline unknown';
  const prize = trunc(r.prize, 60) ?? 'no prize listed';
  const lines = [
    `${badgeEmoji(r.badge)} ${c.bold(r.name)}  ·  ${days}  ·  ${c.cyan(prize)}  ·  ${badgeLabel(r.badge)}`,
    `   ↳ ${r.joinUrl ?? r.url}`,
  ];
  if ((r.badge === 'GATED' || r.badge === 'PARTIAL') && r.requirements.length > 0) {
    lines.push(`   ↳ ⚠ Requirements: ${trunc(r.requirements.join(', '), 80)}`);
  } else if (r.badge === 'OPEN' && r.objective) {
    lines.push(`   ↳ ${trunc(r.objective, 80)}`);
  }
  return lines.join('\n');
}

/**
 * @param {object[]} records
 * @param {{ quiet?: boolean }} opts
 * @returns {string}
 */
export function renderLog(records, { quiet = false } = {}) {
  const parts = ['', ...records.map(formatRecord), ''];
  if (!quiet) parts.push(renderSummaryLine(records));
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
  const open    = records.filter(r => r.badge === 'OPEN').length;
  const gated   = records.filter(r => r.badge === 'GATED').length;
  const partial = records.filter(r => r.badge === 'PARTIAL').length;
  return `${records.length} found · ${open} open to all · ${gated} gated · ${partial} partial · cached 1h · ${c.blue('--no-cache')} to refresh`;
}
