import * as cheerio from 'cheerio';
import { classify } from './classify.js';

const FETCH_DELAY_MS = 500;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractText($, selectors) {
  for (const sel of selectors) {
    const text = $(sel).first().text().trim();
    if (text) return text;
  }
  return null;
}

function extractJoinUrl($, pageUrl) {
  const linkTexts = ['register', 'join', 'apply', 'sign up', 'participate'];
  let found = null;
  $('a').each((_, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().toLowerCase();
    if (href && linkTexts.some(t => text.includes(t))) {
      try {
        found = new URL(href, pageUrl).toString();
        return false; // break
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
      headers: { 'User-Agent': 'hackathon-radar/0.1.0 (+https://github.com/aks-builds/hackathon-radar)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch {
    return { ...record, pageVisited: false };
  }

  const $ = cheerio.load(html);

  const eligibilityRaw = extractText($, [
    '.eligibility', '.eligibility-info', '[class*="eligib"]',
    'section:contains("Who Can")', 'section:contains("Eligib")',
    'p:contains("open to all")', 'p:contains("students only")',
  ]) ?? record.eligibilityRaw;

  const prize = extractText($, [
    '.prize', '.prize-amount', '[class*="prize"]',
    'p:contains("prize")', 'span:contains("$")',
  ]) ?? record.prize;

  const objective = extractText($, [
    '.about p', '.description p', 'meta[name="description"]',
    'section:contains("About") p',
  ]) ?? record.objective;

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
