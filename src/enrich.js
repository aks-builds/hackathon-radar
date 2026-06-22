import * as cheerio from 'cheerio';
import { classify } from './classify.js';

const FETCH_DELAY_MS = 500;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function clean(text, maxLen = 150) {
  const s = text.replace(/\s+/g, ' ').trim();
  return s.length > maxLen ? s.slice(0, maxLen) + '…' : s;
}

function extractText($, selectors) {
  for (const sel of selectors) {
    const text = $(sel).first().text().trim();
    if (text) return text;
  }
  return null;
}

const GENERIC_HOSTS = ['secure.devpost.com', 'devpost.com/users', 'mlh.io/users'];

function extractJoinUrl($, pageUrl) {
  const linkTexts = ['register', 'join', 'apply', 'sign up', 'participate'];
  let found = null;
  $('a').each((_, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().toLowerCase();
    if (href && linkTexts.some(t => text.includes(t))) {
      try {
        const resolved = new URL(href, pageUrl).toString();
        if (GENERIC_HOSTS.some(h => resolved.includes(h))) return; // skip site-wide auth pages
        found = resolved;
        return false;
      } catch { /* skip malformed hrefs */ }
    }
  });
  return found;
}

/**
 * @param {object} record
 * @returns {Promise<object>}
 */
export async function enrichRecord(record) {
  if (!record.url.startsWith('https://')) {
    return { ...record, pageVisited: false };
  }

  await sleep(FETCH_DELAY_MS);

  let html;
  try {
    const res = await fetch(record.url, {
      headers: { 'User-Agent': 'hackathon-radar/0.2.0 (+https://github.com/aks-builds/hackathon-radar)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch {
    return { ...record, pageVisited: false };
  }

  const $ = cheerio.load(html);

  const eligibilityRaw = clean(
    extractText($, ['.eligibility', '.eligibility-info', '[class*="eligib"]']) ?? record.eligibilityRaw ?? '',
    150
  ) || null;

  const prize = clean(
    extractText($, ['.prize-amount', '[data-prize]']) ?? record.prize ?? '',
    80
  ) || null;

  const objective = clean(
    $('meta[name="description"]').attr('content') ||
    extractText($, ['article p:first-of-type', 'main p:first-of-type']) ||
    record.objective || '',
    80
  ) || null;

  const joinUrl = extractJoinUrl($, record.url) ?? record.joinUrl;

  const classifyText = [eligibilityRaw, $('h1,h2,h3').text()].filter(Boolean).join(' ');
  const { badge, requirements } = classify(classifyText);

  return {
    ...record,
    prize,
    objective,
    eligibilityRaw,
    joinUrl,
    badge,
    requirements,
    pageVisited: true,
  };
}
