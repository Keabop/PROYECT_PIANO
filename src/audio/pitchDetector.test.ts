import { describe, expect, it } from 'vitest';
import { detectPitch } from './pitchDetector';

const SR = 44100;

function sine(freq: number, n = 4096, amp = 0.6): Float32Array {
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) buf[i] = amp * Math.sin((2 * Math.PI * freq * i) / SR);
  return buf;
}

describe('detectPitch (monofónico)', () => {
  it('detecta un La4 (440 Hz) a partir de una senoide sintética', () => {
    const res = detectPitch(sine(440), SR);
    expect(res.frequency).toBeCloseTo(440, 0);
    expect(res.frequency).toBeGreaterThan(438);
    expect(res.frequency).toBeLessThan(442);
    expect(res.clarity).toBeGreaterThan(0.95);
  });

  it('detecta un Do4 (261.63 Hz)', () => {
    const res = detectPitch(sine(261.63), SR);
    expect(res.frequency).toBeGreaterThan(259);
    expect(res.frequency).toBeLessThan(264);
  });

  it('detecta un Sol4 (392 Hz)', () => {
    const res = detectPitch(sine(392), SR);
    expect(res.frequency).toBeGreaterThan(389);
    expect(res.frequency).toBeLessThan(395);
  });

  it('devuelve 0 con silencio', () => {
    const res = detectPitch(new Float32Array(4096), SR);
    expect(res.frequency).toBe(0);
  });

  it('respeta la puerta de volumen minRms', () => {
    const quiet = sine(440, 4096, 0.004); // señal muy débil (rms ≈ 0.0028)
    // Con la puerta por defecto (0.006) se descarta…
    expect(detectPitch(quiet, SR).frequency).toBe(0);
    // …pero con una puerta más sensible sí se detecta.
    const res = detectPitch(quiet, SR, { minRms: 0.002 });
    expect(res.frequency).toBeGreaterThan(437);
    expect(res.frequency).toBeLessThan(443);
  });
});
