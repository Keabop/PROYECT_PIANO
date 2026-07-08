import { describe, expect, it } from 'vitest';
import { LIBRARY, phraseDurationsSec } from './library';

describe('biblioteca de canciones (integridad de datos)', () => {
  it('cada frase con ritmo tiene una duración POR NOTA (misma longitud)', () => {
    for (const song of LIBRARY) {
      for (const phrase of song.phrases) {
        if (phrase.durations) {
          expect(
            phrase.durations.length,
            `${song.id} / ${phrase.name}: durations (${phrase.durations.length}) vs notes (${phrase.notes.length})`
          ).toBe(phrase.notes.length);
        }
      }
    }
  });

  it('todas las notas están en rango de piano razonable (C2..C7)', () => {
    for (const song of LIBRARY) {
      for (const phrase of song.phrases) {
        for (const n of phrase.notes) {
          expect(n, `${song.id} / ${phrase.name}`).toBeGreaterThanOrEqual(36);
          expect(n, `${song.id} / ${phrase.name}`).toBeLessThanOrEqual(96);
        }
      }
    }
  });

  it('los tempos son razonables (40..200 BPM) y las duraciones positivas', () => {
    for (const song of LIBRARY) {
      expect(song.bpm).toBeGreaterThanOrEqual(40);
      expect(song.bpm).toBeLessThanOrEqual(200);
      for (const phrase of song.phrases) {
        for (const d of phrase.durations ?? []) {
          expect(d).toBeGreaterThan(0);
          expect(d).toBeLessThanOrEqual(4);
        }
      }
    }
  });

  it('phraseDurationsSec convierte tiempos a segundos según el BPM', () => {
    const durs = phraseDurationsSec({ name: 'x', notes: [60, 62, 64], durations: [1, 0.5, 2] }, 120);
    expect(durs).toEqual([0.5, 0.25, 1]); // a 120 BPM, 1 tiempo = 0.5 s
    // Sin durations: 1 tiempo por nota.
    const plain = phraseDurationsSec({ name: 'y', notes: [60, 62] }, 60);
    expect(plain).toEqual([1, 1]);
  });
});
