import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = (name) => join(__dirname, 'fixtures/pages', name);

// Mock fetch before importing the module under test
vi.stubGlobal('fetch', vi.fn());

const { enrichRecord } = await import('../src/enrich.js');

afterEach(() => vi.clearAllMocks());

async function mockFetch(filename) {
  const html = await readFile(fixturePath(filename), 'utf8');
  fetch.mockResolvedValueOnce({ ok: true, text: async () => html });
}

describe('enrichRecord', () => {
  it('skips fetch for HTTP URLs and marks pageVisited false', async () => {
    const record = { url: 'http://insecure.example.com', prize: null, objective: null, eligibilityRaw: null };
    const result = await enrichRecord(record);
    expect(result.pageVisited).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('extracts prize and eligibility from OPEN fixture', async () => {
    await mockFetch('open.html');
    const record = { url: 'https://globalai2026.devpost.com', prize: null, objective: null, eligibilityRaw: null, joinUrl: null };
    const result = await enrichRecord(record);
    expect(result.pageVisited).toBe(true);
    expect(result.prize).toMatch(/50,000/);
    expect(result.eligibilityRaw).toMatch(/open to all/i);
  });

  it('extracts requirements from GATED fixture', async () => {
    await mockFetch('gated.html');
    const record = { url: 'https://buildfest.xyz', prize: null, objective: null, eligibilityRaw: null, joinUrl: null };
    const result = await enrichRecord(record);
    expect(result.pageVisited).toBe(true);
    expect(result.badge).toBe('GATED');
    expect(result.requirements.length).toBeGreaterThan(0);
  });

  it('marks pageVisited false and preserves snippet values when fetch fails', async () => {
    fetch.mockRejectedValueOnce(new Error('network error'));
    const record = { url: 'https://example.com', prize: '$999', objective: 'win', eligibilityRaw: 'open to all', joinUrl: null };
    const result = await enrichRecord(record);
    expect(result.pageVisited).toBe(false);
    expect(result.prize).toBe('$999');
    expect(result.objective).toBe('win');
  });

  it('extracts badge PARTIAL from partial fixture', async () => {
    const html = await readFile(fixturePath('partial.html'), 'utf8');
    fetch.mockResolvedValueOnce({ ok: true, text: async () => html });
    const record = { url: 'https://devfest.example.com', prize: null, objective: null, eligibilityRaw: null, joinUrl: null };
    const result = await enrichRecord(record);
    expect(result.pageVisited).toBe(true);
    expect(result.badge).toBe('PARTIAL');
  });

  it('returns UNKNOWN badge for page with no eligibility text', async () => {
    const html = await readFile(fixturePath('unknown.html'), 'utf8');
    fetch.mockResolvedValueOnce({ ok: true, text: async () => html });
    const record = { url: 'https://mysteryhack.example.com', prize: null, objective: null, eligibilityRaw: null, joinUrl: null };
    const result = await enrichRecord(record);
    expect(result.pageVisited).toBe(true);
    expect(result.badge).toBe('UNKNOWN');
  });

  it('truncates long text fields to configured limits', async () => {
    const longHtml = `<!DOCTYPE html><html><head>
      <meta name="description" content="${'Build '.repeat(50)}">
    </head><body>
      <span class="prize-amount">${'$' + '0'.repeat(200)}</span>
      <div class="eligibility">${'open to all '.repeat(50)}</div>
    </body></html>`;
    fetch.mockResolvedValueOnce({ ok: true, text: async () => longHtml });
    const record = { url: 'https://example.com', prize: null, objective: null, eligibilityRaw: null, joinUrl: null };
    const result = await enrichRecord(record);
    expect(result.prize.length).toBeLessThanOrEqual(83); // 80 chars + '…'
    expect(result.objective.length).toBeLessThanOrEqual(83);
    expect(result.eligibilityRaw.length).toBeLessThanOrEqual(153); // 150 chars + '…'
  });
});
