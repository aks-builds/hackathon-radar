/**
 * @param {string|null} deadlineAt - ISO date string or null
 * @returns {number|null}
 */
export function parseDaysLeft(deadlineAt) {
  if (!deadlineAt) return null;
  const ms = Date.parse(deadlineAt);
  if (isNaN(ms)) return null;
  // Align both sides to UTC midnight to avoid fractional-day rounding errors
  const deadlineMidnight = Math.floor(ms / 86400000) * 86400000;
  const todayMidnight = Math.floor(Date.now() / 86400000) * 86400000;
  return Math.round((deadlineMidnight - todayMidnight) / 86400000);
}

/**
 * @param {string|null} publishedAt - ISO date string or null
 * @param {number} maxAgeDays
 * @returns {boolean}
 */
export function isRecent(publishedAt, maxAgeDays = 7) {
  if (!publishedAt) return true; // unknown publication date passes filter
  const ms = Date.parse(publishedAt);
  if (isNaN(ms)) return true;
  // Align both sides to UTC midnight for consistent day-level comparison
  const pubMidnight = Math.floor(ms / 86400000) * 86400000;
  const todayMidnight = Math.floor(Date.now() / 86400000) * 86400000;
  return (todayMidnight - pubMidnight) / 86400000 <= maxAgeDays;
}

/**
 * @param {object[]} records
 * @param {{ minDays?: number, maxAgeDays?: number }} opts
 * @returns {object[]}
 */
export function filterRecords(records, { minDays = 3, maxAgeDays = 7 } = {}) {
  return records.filter(r => {
    if (r.daysLeft !== null && r.daysLeft < minDays) return false;
    if (!isRecent(r.publishedAt, maxAgeDays)) return false;
    return true;
  });
}

function countPopulatedFields(record) {
  return Object.values(record).filter(v => v !== null && v !== undefined).length;
}

function normaliseUrl(url) {
  try {
    const u = new URL(url);
    u.hash = '';
    return u.toString().replace(/\/$/, '');
  } catch {
    return url.replace(/\/$/, '');
  }
}

/**
 * @param {object[]} records
 * @returns {object[]}
 */
export function deduplicateByUrl(records) {
  const seen = new Map();
  for (const record of records) {
    const key = normaliseUrl(record.url);
    if (!seen.has(key)) {
      seen.set(key, record);
    } else {
      const existing = seen.get(key);
      if (countPopulatedFields(record) > countPopulatedFields(existing)) {
        seen.set(key, record);
      }
    }
  }
  return Array.from(seen.values());
}
