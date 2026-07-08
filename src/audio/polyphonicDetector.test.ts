import { describe, expect, it } from 'vitest';
import { detectPolyphony, matchChord } from './polyphonicDetector';
import { pitchClass } from './noteUtils';

const SR = 44100;

/** Suma de senoides a las frecuencias dadas (con algún armónico para parecerse al piano). */
function chordBuffer(freqs: number[], n = 16384, amp = 0.25): Float32Array {
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (const f of freqs) {
      s += amp * Math.sin((2 * Math.PI * f * i) / SR);
      s += amp * 0.3 * Math.sin((2 * Math.PI * f * 2 * i) / SR); // 2º armónico
    }
    buf[i] = s;
  }
  return buf;
}

describe('detectPolyphony (acordes)', () => {
  it('detecta las 3 notas de un Do mayor (C4-E4-G4)', () => {
    // Do4=261.63, Mi4=329.63, Sol4=392.00
    const notes = detectPolyphony(chordBuffer([261.63, 329.63, 392.0]), SR, { fftSize: 16384 });
    const pcs = new Set(notes.map((n) => pitchClass(n.midi)));
    expect(pcs.has(0)).toBe(true); // Do
    expect(pcs.has(4)).toBe(true); // Mi
    expect(pcs.has(7)).toBe(true); // Sol
    expect(notes.length).toBeGreaterThanOrEqual(3);
    expect(notes.length).toBeLessThanOrEqual(5);
  });

  it('detecta una díada (quinta Do-Sol)', () => {
    const notes = detectPolyphony(chordBuffer([261.63, 392.0]), SR, { fftSize: 16384 });
    const pcs = new Set(notes.map((n) => pitchClass(n.midi)));
    expect(pcs.has(0)).toBe(true);
    expect(pcs.has(7)).toBe(true);
  });

  it('devuelve vacío con silencio', () => {
    expect(detectPolyphony(new Float32Array(16384), SR)).toHaveLength(0);
  });
});

describe('matchChord (template matching)', () => {
  it('acepta el acorde correcto', () => {
    const detected = [
      { midi: 60, salience: 1 },
      { midi: 64, salience: 0.8 },
      { midi: 67, salience: 0.7 },
    ];
    const res = matchChord(detected, [60, 64, 67]);
    expect(res.complete).toBe(true);
    expect(res.missing).toHaveLength(0);
  });

  it('marca notas faltantes', () => {
    const detected = [{ midi: 60, salience: 1 }];
    const res = matchChord(detected, [60, 64, 67]);
    expect(res.complete).toBe(false);
    expect(res.missing.length).toBeGreaterThan(0);
  });

  it('tolera la octava (compara por clase de altura)', () => {
    const detected = [
      { midi: 72, salience: 1 }, // Do5
      { midi: 76, salience: 0.8 }, // Mi5
      { midi: 79, salience: 0.7 }, // Sol5
    ];
    const res = matchChord(detected, [60, 64, 67]);
    expect(res.complete).toBe(true);
  });
});
