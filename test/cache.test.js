import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isCacheValid, diffResults } from '../src/cache.js';

describe('isCacheValid', () => {
  it('returns true when fetchedAt is within TTL', () => {
    const recent = new Date(Date.now() - 1000 * 60 * 30).toISOString(); // 30 min ago
    expect(isCacheValid(recent)).toBe(true);
  });

  it('returns false when fetchedAt is beyond TTL', () => {
    const old = new Date(Date.now() - 1000 * 60 * 90).toISOString(); // 90 min ago
    expect(isCacheValid(old)).toBe(false);
  });

  it('respects HACKATHON_RADAR_CACHE_TTL_MS env override', () => {
    process.env.HACKATHON_RADAR_CACHE_TTL_MS = '60000'; // 1 minute
    const twoMinutesAgo = new Date(Date.now() - 120000).toISOString();
    expect(isCacheValid(twoMinutesAgo)).toBe(false);
    delete process.env.HACKATHON_RADAR_CACHE_TTL_MS;
  });
});

describe('diffResults', () => {
  it('returns only records not in cached set', () => {
    const cached = [{ url: 'https://a.com' }, { url: 'https://b.com' }];
    const fresh = [{ url: 'https://a.com' }, { url: 'https://c.com' }];
    const diff = diffResults(fresh, cached);
    expect(diff).toHaveLength(1);
    expect(diff[0].url).toBe('https://c.com');
  });

  it('returns all records when cache is empty', () => {
    const fresh = [{ url: 'https://a.com' }, { url: 'https://b.com' }];
    expect(diffResults(fresh, [])).toHaveLength(2);
  });

  it('returns empty array when all records are already cached', () => {
    const records = [{ url: 'https://a.com' }];
    expect(diffResults(records, records)).toHaveLength(0);
  });
});
