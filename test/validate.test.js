import { describe, it, expect } from 'vitest';
import { validateFlags } from '../src/validate.js';

const base = { 'min-days': '3', limit: '20', watch: '', json: false, location: '', department: '' };

describe('validateFlags', () => {
  it('returns ok:true for all-default flags', () => {
    const r = validateFlags(base);
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it('returns ok:true for valid min-days and limit', () => {
    expect(validateFlags({ ...base, 'min-days': '7', limit: '10' }).ok).toBe(true);
  });

  it('rejects non-integer min-days', () => {
    const r = validateFlags({ ...base, 'min-days': 'abc' });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/--min-days must be a whole number/);
  });

  it('rejects zero min-days', () => {
    expect(validateFlags({ ...base, 'min-days': '0' }).ok).toBe(false);
  });

  it('rejects decimal min-days', () => {
    expect(validateFlags({ ...base, 'min-days': '3.5' }).ok).toBe(false);
  });

  it('rejects non-integer limit', () => {
    const r = validateFlags({ ...base, limit: 'x' });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/--limit must be a whole number/);
  });

  it('rejects zero limit', () => {
    expect(validateFlags({ ...base, limit: '0' }).ok).toBe(false);
  });

  it('rejects invalid watch format', () => {
    const r = validateFlags({ ...base, watch: '1d' });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/--watch must be a duration/);
  });

  it('accepts valid watch formats', () => {
    expect(validateFlags({ ...base, watch: '30m' }).ok).toBe(true);
    expect(validateFlags({ ...base, watch: '1h' }).ok).toBe(true);
    expect(validateFlags({ ...base, watch: '2h' }).ok).toBe(true);
  });

  it('rejects --watch + --json combo', () => {
    const r = validateFlags({ ...base, watch: '1h', json: true });
    expect(r.ok).toBe(false);
    expect(r.errors.some(e => /--watch and --json cannot be used together/.test(e))).toBe(true);
  });

  it('collects combo error even when watch format is also invalid', () => {
    const r = validateFlags({ ...base, watch: '1d', json: true });
    expect(r.ok).toBe(false);
    expect(r.errors.some(e => /--watch and --json/.test(e))).toBe(true);
    expect(r.errors.some(e => /--watch must be a duration/.test(e))).toBe(true);
  });

  it('rejects unknown location', () => {
    const r = validateFlags({ ...base, location: 'Aisa' });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/Unknown location "Aisa"/);
    expect(r.errors[0]).toMatch(/Asia, Europe/);
  });

  it('accepts valid region — case-insensitive', () => {
    expect(validateFlags({ ...base, location: 'asia' }).ok).toBe(true);
    expect(validateFlags({ ...base, location: 'Asia' }).ok).toBe(true);
    expect(validateFlags({ ...base, location: 'EUROPE' }).ok).toBe(true);
  });

  it('accepts valid country — case-insensitive', () => {
    expect(validateFlags({ ...base, location: 'India' }).ok).toBe(true);
    expect(validateFlags({ ...base, location: 'germany' }).ok).toBe(true);
    expect(validateFlags({ ...base, location: 'USA' }).ok).toBe(true);
  });

  it('accepts multi-word country names with spaces', () => {
    expect(validateFlags({ ...base, location: 'New Zealand' }).ok).toBe(true);
    expect(validateFlags({ ...base, location: 'South Korea' }).ok).toBe(true);
    expect(validateFlags({ ...base, location: 'Saudi Arabia' }).ok).toBe(true);
    expect(validateFlags({ ...base, location: 'South Africa' }).ok).toBe(true);
  });

  it('accepts any department value — no validation', () => {
    expect(validateFlags({ ...base, department: 'climate tech' }).ok).toBe(true);
    expect(validateFlags({ ...base, department: 'xyz123' }).ok).toBe(true);
  });

  it('collects multiple errors', () => {
    const r = validateFlags({ ...base, 'min-days': 'abc', limit: '0' });
    expect(r.errors).toHaveLength(2);
  });
});
