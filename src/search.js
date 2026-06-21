import { search as ddgSearch, SafeSearchType } from 'duck-duck-scrape';
import { parseDaysLeft } from './filter.js';

function mapDDGResult(r) {
  return {
    name: r.title,
    url: r.url,
    joinUrl: null,
    publishedAt: null,
    deadlineAt: null,
    daysLeft: null,
    prize: extractPrize(r.description),
    objective: null,
    eligibilityRaw: r.description ?? null,
    badge: 'UNKNOWN',
    requirements: [],
    source: 'ddg',
    pageVisited: false,
    fetchedAt: new Date().toISOString(),
  };
}

function mapDevpostResult(h) {
  return {
    name: h.title,
    url: h.url,
    joinUrl: null,
    publishedAt: null,
    deadlineAt: null,
    daysLeft: null,
    prize: h.prize_amount ? `$${h.prize_amount}` : null,
    objective: null,
    eligibilityRaw: null,
    badge: 'UNKNOWN',
    requirements: [],
    source: 'devpost-api',
    pageVisited: false,
    fetchedAt: new Date().toISOString(),
  };
}

function mapMLHResult(loc, lastmod) {
  return {
    name: loc.split('/').filter(Boolean).pop() ?? 'MLH Event',
    url: loc,
    joinUrl: loc,
    publishedAt: lastmod ?? null,
    deadlineAt: null,
    daysLeft: null,
    prize: null,
    objective: null,
    eligibilityRaw: null,
    badge: 'UNKNOWN',
    requirements: [],
    source: 'mlh-sitemap',
    pageVisited: false,
    fetchedAt: new Date().toISOString(),
  };
}

function extractPrize(text) {
  if (!text) return null;
  const match = text.match(/\$[\d,]+/);
  return match ? match[0] : null;
}

async function fromDDG(year) {
  const { results } = await ddgSearch(`hackathon ${year}`, { safeSearch: SafeSearchType.OFF });
  if (!results?.length) return null;
  return results.map(mapDDGResult);
}

async function fromDevpost() {
  const res = await fetch('https://devpost.com/api/hackathons?status=open&order_by=deadline&per_page=20');
  if (!res.ok) throw new Error(`Devpost API ${res.status}`);
  const data = await res.json();
  return (data.hackathons ?? []).map(mapDevpostResult);
}

async function fromMLH() {
  const res = await fetch('https://mlh.io/sitemap.xml');
  if (!res.ok) throw new Error(`MLH sitemap ${res.status}`);
  const xml = await res.text();
  const entries = [];
  const urlRegex = /<url>\s*<loc>(https:\/\/mlh\.io\/[^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g;
  let match;
  while ((match = urlRegex.exec(xml)) !== null) {
    entries.push(mapMLHResult(match[1], match[2] ?? null));
  }
  return entries.length ? entries : null;
}

/**
 * @param {number} year
 * @returns {Promise<object[]>}
 */
export async function searchHackathons(year) {
  try {
    const results = await fromDDG(year);
    if (results) return results;
  } catch { /* fall through */ }

  try {
    const results = await fromDevpost();
    if (results?.length) return results;
  } catch { /* fall through */ }

  try {
    const results = await fromMLH();
    if (results?.length) return results;
  } catch { /* fall through */ }

  return [];
}
