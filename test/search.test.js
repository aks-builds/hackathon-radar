import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('duck-duck-scrape', () => ({
  search: vi.fn(),
  SafeSearchType: { OFF: 0 },
}));

vi.stubGlobal('fetch', vi.fn());

const { search: ddgSearch, SafeSearchType } = await import('duck-duck-scrape');
const { searchHackathons } = await import('../src/search.js');

afterEach(() => vi.clearAllMocks());

describe('searchHackathons', () => {
  it('returns records from DDG when results are available', async () => {
    ddgSearch.mockResolvedValueOnce({
      results: [
        { title: 'Global AI Hackathon', url: 'https://globalai.devpost.com', description: 'Open to all. Deadline: 2026-06-30. Prize: $50,000' },
      ],
    });
    const records = await searchHackathons(2026);
    expect(records).toHaveLength(1);
    expect(records[0].name).toBe('Global AI Hackathon');
    expect(records[0].source).toBe('ddg');
    expect(records[0].url).toBe('https://globalai.devpost.com');
  });

  it('falls back to Devpost API when DDG returns 0 results', async () => {
    ddgSearch.mockResolvedValueOnce({ results: [] });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        hackathons: [
          { title: 'Devpost Hack', url: 'https://devposthack.devpost.com', prize_amount: '10000', submission_period_dates: 'Jun 28 - Jul 10, 2026' },
        ],
      }),
    });
    const records = await searchHackathons(2026);
    expect(records[0].source).toBe('devpost-api');
    expect(records[0].name).toBe('Devpost Hack');
  });

  it('falls back to MLH sitemap when DDG and Devpost both fail', async () => {
    ddgSearch.mockRejectedValueOnce(new Error('bot blocked'));
    fetch
      .mockRejectedValueOnce(new Error('Devpost down'))
      .mockResolvedValueOnce({
        ok: true,
        text: async () => `<?xml version="1.0"?>
          <urlset>
            <url><loc>https://mlh.io/seasons/2026/events</loc><lastmod>2026-06-20</lastmod></url>
          </urlset>`,
      });
    const records = await searchHackathons(2026);
    expect(records[0].source).toBe('mlh-sitemap');
  });

  it('returns empty array when all sources fail', async () => {
    ddgSearch.mockRejectedValueOnce(new Error('blocked'));
    fetch.mockRejectedValueOnce(new Error('devpost down'));
    fetch.mockRejectedValueOnce(new Error('mlh down'));
    const records = await searchHackathons(2026);
    expect(records).toHaveLength(0);
  });

  it('appends location to DDG query when provided', async () => {
    ddgSearch.mockResolvedValueOnce({
      results: [
        { title: 'Asia Hack', url: 'https://asiahack.devpost.com', description: 'Open in Asia.' },
      ],
    });
    await searchHackathons(2026, { location: 'Asia' });
    expect(ddgSearch).toHaveBeenCalledWith(
      expect.stringContaining('Asia'),
      expect.any(Object)
    );
  });

  it('appends department to DDG query when provided', async () => {
    ddgSearch.mockResolvedValueOnce({
      results: [
        { title: 'Fintech Hack', url: 'https://fintechhack.devpost.com', description: 'Build fintech.' },
      ],
    });
    await searchHackathons(2026, { department: 'fintech' });
    expect(ddgSearch).toHaveBeenCalledWith(
      expect.stringContaining('fintech'),
      expect.any(Object)
    );
  });

  it('builds query "hackathon 2026 India IT" with both location and department', async () => {
    ddgSearch.mockResolvedValueOnce({ results: [] });
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hackathons: [] }) })
      .mockResolvedValueOnce({ ok: true, text: async () => '<urlset></urlset>' });
    await searchHackathons(2026, { location: 'India', department: 'IT' });
    expect(ddgSearch).toHaveBeenCalledWith('hackathon 2026 India IT', expect.any(Object));
  });

  it('uses plain year query when no opts given', async () => {
    ddgSearch.mockResolvedValueOnce({ results: [] });
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hackathons: [] }) })
      .mockResolvedValueOnce({ ok: true, text: async () => '<urlset></urlset>' });
    await searchHackathons(2026);
    expect(ddgSearch).toHaveBeenCalledWith('hackathon 2026', expect.any(Object));
  });
});
