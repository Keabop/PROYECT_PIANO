import { describe, expect, it } from 'vitest';
import { ML_SAMPLE_RATE, resampleTo22050 } from './mlDetector';
import { detectPitch } from './pitchDetector';

function sine(freq: number, sampleRate: number, n: number, amp = 0.6): Float32Array {
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) buf[i] = amp * Math.sin((2 * Math.PI * freq * i) / sampleRate);
  return buf;
}

describe('resampleTo22050', () => {
  it('reduce la longitud según la razón de muestreo', () => {
    const out = resampleTo22050(new Float32Array(44100), 44100);
    expect(out.length).toBe(22050);
  });

  it('conserva la frecuencia de la señal (440 Hz sigue siendo 440 Hz)', () => {
    const src = sine(440, 44100, 8192);
    const out = resampleTo22050(src, 44100);
    // Verificamos con el detector de tono sobre la señal remuestreada.
    const res = detectPitch(out.subarray(0, 4096), ML_SAMPLE_RATE);
    expect(res.frequency).toBeGreaterThan(437);
    expect(res.frequency).toBeLessThan(443);
  });

  it('funciona desde 48 kHz', () => {
    const src = sine(261.63, 48000, 9600);
    const out = resampleTo22050(src, 48000);
    const res = detectPitch(out.subarray(0, 4096), ML_SAMPLE_RATE);
    expect(res.frequency).toBeGreaterThan(259);
    expect(res.frequency).toBeLessThan(264);
  });

  it('devuelve copia si ya está a 22050', () => {
    const src = sine(440, ML_SAMPLE_RATE, 1000);
    const out = resampleTo22050(src, ML_SAMPLE_RATE);
    expect(out.length).toBe(1000);
    expect(out).not.toBe(src);
    expect(out[500]).toBeCloseTo(src[500], 6);
  });
});
