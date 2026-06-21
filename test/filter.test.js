import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseDaysLeft, isRecent, filterRecords, deduplicateByUrl } from '../src/filter.js';

describe('parseDaysLeft', () => {
  it('returns positive integer for future deadline', () => {
    const future = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
    expect(parseDaysLeft(future)).toBe(5);
  });

  it('returns 0 for today', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(parseDaysLeft(today)).toBe(0);
  });

  it('returns null for null input', () => {
    expect(parseDaysLeft(null)).toBeNull();
  });

  it('returns null for unparseable string', () => {
    expect(parseDaysLeft('not-a-date')).toBeNull();
  });
});

describe('isRecent', () => {
  it('returns true for date within maxAgeDays', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
    expect(isRecent(threeDaysAgo, 7)).toBe(true);
  });

  it('returns false for date older than maxAgeDays', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10);
    expect(isRecent(tenDaysAgo, 7)).toBe(false);
  });

  it('returns true for null publishedAt (unknown passes filter)', () => {
    expect(isRecent(null, 7)).toBe(true);
  });
});

describe('filterRecords', () => {
  const makeRecord = (overrides) => ({
    url: 'https://example.com/hack',
    publishedAt: null,
    deadlineAt: null,
    daysLeft: null,
    badge: 'OPEN',
    requirements: [],
    ...overrides,
  });

  it('keeps records with daysLeft >= minDays', () => {
    const r = makeRecord({ daysLeft: 5 });
    expect(filterRecords([r], { minDays: 3 })).toHaveLength(1);
  });

  it('drops records with daysLeft < minDays', () => {
    const r = makeRecord({ daysLeft: 1 });
    expect(filterRecords([r], { minDays: 3 })).toHaveLength(0);
  });

  it('keeps records with null daysLeft (unknown deadline passes)', () => {
    const r = makeRecord({ daysLeft: null });
    expect(filterRecords([r], { minDays: 3 })).toHaveLength(1);
  });

  it('drops records with stale publishedAt', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10);
    const r = makeRecord({ publishedAt: tenDaysAgo });
    expect(filterRecords([r], { minDays: 3, maxAgeDays: 7 })).toHaveLength(0);
  });
});

describe('deduplicateByUrl', () => {
  it('removes duplicate URLs, keeping the entry with more non-null fields', () => {
    const rich = { url: 'https://a.com', prize: '$1000', objective: 'build', eligibilityRaw: 'open' };
    const sparse = { url: 'https://a.com', prize: null, objective: null, eligibilityRaw: null };
    const result = deduplicateByUrl([sparse, rich]);
    expect(result).toHaveLength(1);
    expect(result[0].prize).toBe('$1000');
  });

  it('normalises URLs by stripping trailing slash', () => {
    const a = { url: 'https://a.com/', prize: null };
    const b = { url: 'https://a.com', prize: '$500' };
    expect(deduplicateByUrl([a, b])).toHaveLength(1);
  });
});
