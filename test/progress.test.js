import { describe, it, expect, vi, afterEach } from 'vitest';
import { createProgress } from '../src/progress.js';

describe('createProgress', () => {
  afterEach(() => vi.useRealTimers());

  it('returns no-ops when isTTY is false', () => {
    const p = createProgress({ isTTY: false, quiet: false });
    expect(() => p.update('msg')).not.toThrow();
    expect(() => p.done('done')).not.toThrow();
    expect(() => p.clear()).not.toThrow();
  });

  it('returns no-ops when quiet is true', () => {
    const p = createProgress({ isTTY: true, quiet: true });
    const write = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    p.update('msg');
    p.done();
    expect(write).not.toHaveBeenCalled();
    write.mockRestore();
  });

  it('writes spinner + message to stderr immediately on update()', () => {
    vi.useFakeTimers();
    const write = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const p = createProgress({ isTTY: true, quiet: false });
    p.update('searching…');
    // first frame written immediately — no timer advance needed
    expect(write).toHaveBeenCalledWith(
      expect.stringMatching(/\r\x1b\[K.*searching…/)
    );
    p.clear();
    write.mockRestore();
  });

  it('clears the line and stops spinning on clear()', () => {
    vi.useFakeTimers();
    const write = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const p = createProgress({ isTTY: true, quiet: false });
    p.update('enriching…');
    vi.advanceTimersByTime(200);
    write.mockClear();
    p.clear();
    expect(write).toHaveBeenCalledWith('\r\x1b[K');
    expect(write).toHaveBeenCalledTimes(1);
    write.mockRestore();
  });

  it('writes done message to stderr after clearing line', () => {
    vi.useFakeTimers();
    const calls = [];
    const write = vi.spyOn(process.stderr, 'write').mockImplementation((s) => { calls.push(s); return true; });
    const p = createProgress({ isTTY: true, quiet: false });
    p.update('working…');
    p.done('✓ done in 2s');
    expect(calls).toContain('\r\x1b[K');
    expect(calls).toContain('✓ done in 2s\n');
    write.mockRestore();
  });

  it('done() with no message: spinner frame written immediately, then cleared', () => {
    vi.useFakeTimers();
    const calls = [];
    const write = vi.spyOn(process.stderr, 'write').mockImplementation((s) => { calls.push(s); return true; });
    const p = createProgress({ isTTY: true, quiet: false });
    p.update('running…');
    p.done();
    // update() writes one frame immediately; done() clears the line; no extra message
    expect(calls.some(s => s.includes('running…'))).toBe(true);
    expect(calls).toContain('\r\x1b[K');
    expect(calls.some(s => s !== '\r\x1b[K' && !s.includes('running…'))).toBe(false);
    write.mockRestore();
  });

  it('cycles through spinner frames', () => {
    vi.useFakeTimers();
    const written = [];
    const write = vi.spyOn(process.stderr, 'write').mockImplementation((s) => { written.push(s); return true; });
    const p = createProgress({ isTTY: true, quiet: false });
    p.update('test');
    vi.advanceTimersByTime(640); // 8 frames × 80ms
    p.clear();
    const frames = written.map(s => s.replace('\r\x1b[K', '').split(' ')[0]).filter(Boolean);
    const uniqueFrames = new Set(frames);
    expect(uniqueFrames.size).toBeGreaterThan(1);
    write.mockRestore();
  });
});
