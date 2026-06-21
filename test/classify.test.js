import { describe, it, expect } from 'vitest';
import { classify } from '../src/classify.js';

describe('classify', () => {
  it('returns OPEN for open-to-all text', () => {
    expect(classify('open to all developers worldwide').badge).toBe('OPEN');
    expect(classify('anyone can join, no restrictions').badge).toBe('OPEN');
    expect(classify('everyone is welcome to participate').badge).toBe('OPEN');
    expect(classify('no prerequisites required').badge).toBe('OPEN');
  });

  it('returns GATED for student-only text', () => {
    const r = classify('students only, must be enrolled in university');
    expect(r.badge).toBe('GATED');
    expect(r.requirements).toContain('students only');
  });

  it('returns GATED for age-gated text', () => {
    const r = classify('participants must be 18+ to join');
    expect(r.badge).toBe('GATED');
    expect(r.requirements).toContain('18+');
  });

  it('returns GATED for invite-only text', () => {
    expect(classify('this is an invite-only event').badge).toBe('GATED');
    expect(classify('membership required to participate').badge).toBe('GATED');
  });

  it('returns GATED for KYC text', () => {
    const r = classify('kyc verification required');
    expect(r.badge).toBe('GATED');
    expect(r.requirements).toContain('kyc');
  });

  it('returns PARTIAL for soft restrictions', () => {
    expect(classify('18+ preferred for this challenge').badge).toBe('PARTIAL');
    expect(classify('solo or team of 2-4 members').badge).toBe('PARTIAL');
    expect(classify('recommended experience in machine learning').badge).toBe('PARTIAL');
  });

  it('GATED takes priority over PARTIAL', () => {
    expect(classify('students only, solo or team of 2').badge).toBe('GATED');
  });

  it('OPEN only when no GATED or PARTIAL signals', () => {
    expect(classify('open to all, no prerequisites').badge).toBe('OPEN');
    expect(classify('').badge).toBe('UNKNOWN');
  });

  it('returns UNKNOWN for empty or unrelated text', () => {
    expect(classify('').badge).toBe('UNKNOWN');
    expect(classify('build amazing projects and win prizes').badge).toBe('UNKNOWN');
  });

  it('requirements array contains only matched signals, not all signals', () => {
    const r = classify('must be enrolled in university, kyc required');
    expect(r.requirements).toContain('must be enrolled');
    expect(r.requirements).toContain('kyc');
    expect(r.requirements).not.toContain('18+');
  });

  it('is case-insensitive', () => {
    expect(classify('STUDENTS ONLY').badge).toBe('GATED');
    expect(classify('Open To All').badge).toBe('OPEN');
  });
});
