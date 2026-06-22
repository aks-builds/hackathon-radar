import { search as ddgSearch, SafeSearchType } from 'duck-duck-scrape';

function mapDDGResult(r) {
  return {
    name: r.title,
    url: r.url,
    joinUrl: null,
    publishedAt: null,
    deadlineAt: null,
    // daysLeft populated by enrich step after page fetch
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
    prize: (() => {
      if (!h.prize_amount) return null;
      const s = String(h.prize_amount).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      if (s === '' || /^[^\d]*0[^\d]*$/.test(s)) return null; // "$0", "₹ 0", "€0", etc.
      return s;
    })(),
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

async function fromDDG(year, location, department) {
  const parts = [`hackathon ${year}`];
  if (location) parts.push(location);
  if (department) parts.push(department);
  const { results } = await ddgSearch(parts.join(' '), { safeSearch: SafeSearchType.OFF });
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

function mapGitHubResult(repo) {
  const desc = repo.description
    ? repo.description.replace(/\s+/g, ' ').trim().slice(0, 80)
    : null;
  return {
    name: repo.name,
    url: repo.html_url,
    joinUrl: repo.html_url,
    publishedAt: repo.updated_at?.slice(0, 10) ?? null,
    deadlineAt: null,
    daysLeft: null,
    prize: null,
    objective: desc,
    eligibilityRaw: null,
    badge: 'UNKNOWN',
    requirements: [],
    source: 'github',
    pageVisited: false,
    fetchedAt: new Date().toISOString(),
  };
}

async function fromGitHub(year, location, department) {
  const terms = ['hackathon', String(year), location, department].filter(Boolean);
  const q = terms.map(t => `topic:${encodeURIComponent(t)}`).join('+');
  const res = await fetch(
    `https://api.github.com/search/repositories?q=${q}&sort=updated&per_page=10`,
    {
      headers: {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'hackathon-radar/0.4.0',
      },
      signal: AbortSignal.timeout(10000),
    }
  );
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const data = await res.json();
  return (data.items ?? []).map(mapGitHubResult);
}

/**
 * @param {number} year
 * @param {{ location?: string, department?: string, platform?: string }} [opts]
 * @returns {Promise<object[]>}
 */
export async function searchHackathons(year, { location, department, platform = 'web' } = {}) {
  if (platform === 'devpost') {
    try { return (await fromDevpost()) ?? []; } catch { return []; }
  }
  if (platform === 'mlh') {
    try { return (await fromMLH()) ?? []; } catch { return []; }
  }
  if (platform === 'github') {
    try { return (await fromGitHub(year, location, department)) ?? []; } catch { return []; }
  }

  // platform === 'web': existing DDG → Devpost → MLH fallback chain
  try {
    const results = await fromDDG(year, location, department);
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
