import { describe, it, expect } from 'vitest';
import { renderLog, renderJson, renderSummaryLine } from '../src/output.js';

const makeRecord = (overrides) => ({
  name: 'Test Hack',
  url: 'https://test.devpost.com',
  joinUrl: 'https://test.devpost.com/register',
  daysLeft: 5,
  prize: '$10,000',
  objective: 'Build something great',
  eligibilityRaw: 'Open to all developers',
  badge: 'OPEN',
  requirements: [],
  source: 'ddg',
  pageVisited: true,
  fetchedAt: '2026-06-21T10:00:00Z',
  ...overrides,
});

describe('renderLog', () => {
  it('includes hackathon name', () => {
    const out = renderLog([makeRecord({ name: 'My Hack' })], { quiet: true });
    expect(out).toContain('My Hack');
  });

  it('includes OPEN badge indicator', () => {
    const out = renderLog([makeRecord({ badge: 'OPEN' })], { quiet: true });
    expect(out).toContain('OPEN TO ALL');
  });

  it('includes GATED badge indicator', () => {
    const out = renderLog([makeRecord({ badge: 'GATED', requirements: ['18+'] })], { quiet: true });
    expect(out).toContain('GATED');
    expect(out).toContain('18+');
  });

  it('includes PARTIAL badge indicator', () => {
    const out = renderLog([makeRecord({ badge: 'PARTIAL', requirements: ['team of 2-4'] })], { quiet: true });
    expect(out).toContain('PARTIAL');
  });

  it('shows daysLeft', () => {
    const out = renderLog([makeRecord({ daysLeft: 7 })], { quiet: true });
    expect(out).toContain('7d left');
  });

  it('shows joinUrl when present', () => {
    const out = renderLog([makeRecord({ joinUrl: 'https://test.com/join' })], { quiet: true });
    expect(out).toContain('https://test.com/join');
  });

  it('shows requirement for gated entries', () => {
    const out = renderLog([makeRecord({ badge: 'GATED', requirements: ['kyc'] })], { quiet: true });
    expect(out).toContain('kyc');
  });

  it('shows objective on line 3 for OPEN entries', () => {
    const out = renderLog([makeRecord({ badge: 'OPEN', objective: 'Build climate tools' })], { quiet: true });
    expect(out).toContain('Build climate tools');
  });

  it('shows requirements on line 3 for GATED, not objective', () => {
    const out = renderLog([makeRecord({ badge: 'GATED', requirements: ['18+'], objective: 'Build things' })], { quiet: true });
    expect(out).toContain('⚠ Requirements: 18+');
    expect(out).not.toContain('Build things');
  });

  it('shows requirements on line 3 for PARTIAL', () => {
    const out = renderLog([makeRecord({ badge: 'PARTIAL', requirements: ['team of 2-4'] })], { quiet: true });
    expect(out).toContain('⚠ Requirements: team of 2-4');
  });

  it('has no line 3 for UNKNOWN badge', () => {
    const out = renderLog([makeRecord({ badge: 'UNKNOWN', requirements: [], objective: null })], { quiet: true });
    const lines = out.trim().split('\n').filter(l => l.trim());
    expect(lines.length).toBeLessThanOrEqual(3); // name line + url line + summary line
  });

  it('suppresses summary line when quiet is true', () => {
    const out = renderLog([makeRecord()], { quiet: true });
    expect(out).not.toContain('found');
    expect(out).not.toContain('cached 1h');
  });

  it('shows summary line when quiet is false', () => {
    const out = renderLog([makeRecord()], { quiet: false });
    expect(out).toContain('found');
  });

  it('truncates prize at 60 chars', () => {
    const longPrize = '$' + '1'.repeat(200);
    const out = renderLog([makeRecord({ prize: longPrize })], { quiet: true });
    const prizeInOut = out.split('\n').find(l => l.includes('$'));
    expect(prizeInOut).toBeDefined();
    expect(prizeInOut.length).toBeLessThan(300);
    expect(out).toContain('…');
  });

  it('does not print eligibilityRaw in log output', () => {
    const out = renderLog([makeRecord({ badge: 'OPEN', eligibilityRaw: 'UNIQUE_ELIG_STRING_12345' })], { quiet: true });
    expect(out).not.toContain('UNIQUE_ELIG_STRING_12345');
  });
});

describe('renderJson', () => {
  it('returns valid JSON array', () => {
    const out = renderJson([makeRecord()]);
    expect(() => JSON.parse(out)).not.toThrow();
    expect(JSON.parse(out)).toHaveLength(1);
  });

  it('sorts OPEN before GATED', () => {
    const records = [
      makeRecord({ badge: 'GATED', name: 'Gated' }),
      makeRecord({ badge: 'OPEN', name: 'Open' }),
    ];
    const parsed = JSON.parse(renderJson(records));
    expect(parsed[0].name).toBe('Open');
    expect(parsed[1].name).toBe('Gated');
  });

  it('sorts all four badge levels correctly', () => {
    const records = [
      makeRecord({ badge: 'UNKNOWN', name: 'Unknown' }),
      makeRecord({ badge: 'GATED', name: 'Gated' }),
      makeRecord({ badge: 'PARTIAL', name: 'Partial' }),
      makeRecord({ badge: 'OPEN', name: 'Open' }),
    ];
    const parsed = JSON.parse(renderJson(records));
    expect(parsed[0].name).toBe('Open');
    expect(parsed[1].name).toBe('Partial');
    expect(parsed[2].name).toBe('Gated');
    expect(parsed[3].name).toBe('Unknown');
  });

  it('sorts PARTIAL before GATED', () => {
    const records = [
      makeRecord({ badge: 'GATED', name: 'Gated' }),
      makeRecord({ badge: 'PARTIAL', name: 'Partial' }),
    ];
    const parsed = JSON.parse(renderJson(records));
    expect(parsed[0].name).toBe('Partial');
    expect(parsed[1].name).toBe('Gated');
  });
});

describe('renderSummaryLine', () => {
  it('counts badges correctly', () => {
    const records = [
      makeRecord({ badge: 'OPEN' }),
      makeRecord({ badge: 'OPEN' }),
      makeRecord({ badge: 'GATED' }),
      makeRecord({ badge: 'PARTIAL' }),
    ];
    const line = renderSummaryLine(records);
    expect(line).toContain('4 found');
    expect(line).toContain('2 open to all');
    expect(line).toContain('1 gated');
    expect(line).toContain('1 partial');
  });
});
