import { describe, expect, it } from 'vitest';
import {
  applyPractice,
  masteryOf,
  nextReviewInterval,
  type PracticeRecord,
} from '../store/useProgressStore';
import { evaluateJourney, isModuleComplete, songMastery, type Records } from './journey';
import { MODULES, lessonKey } from './curriculum';
import { LIBRARY, phraseKey } from './library';

function rec(reps: number, cleanReps: number, streak: number): PracticeRecord {
  return { score: 100, stars: 3, completedAt: '2026-01-01', reps, cleanReps, streak, lastErrors: 0 };
}

describe('masteryOf', () => {
  it('progresión nuevo → bronce → plata → oro', () => {
    expect(masteryOf(undefined)).toBe('new');
    expect(masteryOf(rec(1, 0, 0))).toBe('bronze');
    expect(masteryOf(rec(2, 1, 1))).toBe('bronze'); // aún no llega a 3 reps
    expect(masteryOf(rec(3, 1, 1))).toBe('silver');
    expect(masteryOf(rec(3, 0, 0))).toBe('bronze'); // 3 reps pero ninguna limpia
    expect(masteryOf(rec(5, 3, 3))).toBe('gold'); // 3 limpias seguidas
    expect(masteryOf(rec(10, 5, 2))).toBe('silver'); // racha rota
  });
});

describe('applyPractice', () => {
  it('acumula reps, limpias y racha', () => {
    const r1 = applyPractice(undefined, 0);
    expect(r1.reps).toBe(1);
    expect(r1.cleanReps).toBe(1);
    expect(r1.streak).toBe(1);
    const r2 = applyPractice(r1, 0);
    const r3 = applyPractice(r2, 0);
    expect(masteryOf(r3)).toBe('gold');
  });

  it('los errores rompen la racha pero no las limpias acumuladas', () => {
    let r = applyPractice(undefined, 0);
    r = applyPractice(r, 0);
    r = applyPractice(r, 2); // con errores
    expect(r.reps).toBe(3);
    expect(r.cleanReps).toBe(2);
    expect(r.streak).toBe(0);
    expect(masteryOf(r)).toBe('silver');
  });

  it('la puntuación refleja los errores (100 − 10·errores, mín. 40)', () => {
    expect(applyPractice(undefined, 0).score).toBe(100);
    expect(applyPractice(undefined, 3).score).toBe(70);
    expect(applyPractice(undefined, 20).score).toBe(40);
    // la mejor puntuación se conserva
    const good = applyPractice(undefined, 0);
    expect(applyPractice(good, 5).score).toBe(100);
  });
});

describe('nextReviewInterval (repaso espaciado)', () => {
  it('sube 1→3→7→14→30 con repasos limpios', () => {
    expect(nextReviewInterval(1, 0)).toBe(3);
    expect(nextReviewInterval(3, 0)).toBe(7);
    expect(nextReviewInterval(7, 0)).toBe(14);
    expect(nextReviewInterval(14, 0)).toBe(30);
    expect(nextReviewInterval(30, 0)).toBe(30); // tope
  });

  it('baja un escalón con errores', () => {
    expect(nextReviewInterval(7, 2)).toBe(3);
    expect(nextReviewInterval(1, 5)).toBe(1); // suelo
  });
});

describe('evaluateJourney (el camino)', () => {
  function completeModules(records: Records, ids: string[]) {
    for (const id of ids) {
      const mod = MODULES.find((m) => m.id === id)!;
      for (const l of mod.lessons) records[lessonKey(id, l.id)] = rec(1, 1, 1);
    }
  }

  function songAt(records: Records, songId: string, level: 'bronze' | 'silver' | 'gold') {
    const song = LIBRARY.find((s) => s.id === songId)!;
    const r = level === 'bronze' ? rec(1, 0, 0) : level === 'silver' ? rec(3, 2, 1) : rec(4, 3, 3);
    song.phrases.forEach((_, i) => (records[phraseKey(songId, i)] = r));
  }

  it('sin progreso: fase 1 con faltantes', () => {
    const j = evaluateJourney({});
    expect(j.currentPhase).toBe(1);
    expect(j.phases[0].done).toBe(false);
    expect(j.phases[0].missing.length).toBeGreaterThan(0);
  });

  it('fase 1 completa al terminar los módulos 0-3', () => {
    const records: Records = {};
    completeModules(records, ['bienvenida', 'teclado', 'dedos', 'ritmo']);
    const j = evaluateJourney(records);
    expect(j.phases[0].done).toBe(true);
    expect(j.currentPhase).toBe(2);
  });

  it('fase 2 exige módulos + 2 canciones fáciles a bronce', () => {
    const records: Records = {};
    completeModules(records, ['bienvenida', 'teclado', 'dedos', 'ritmo', 'melodias', 'partitura']);
    let j = evaluateJourney(records);
    expect(j.currentPhase).toBe(2); // faltan canciones
    songAt(records, 'estrellita', 'bronze');
    songAt(records, 'cumpleanos', 'bronze');
    j = evaluateJourney(records);
    expect(j.phases[1].done).toBe(true);
    expect(j.currentPhase).toBe(3);
  });

  it('los drills cuentan para la fase 3', () => {
    const records: Records = {};
    records['drill/s-do'] = rec(3, 2, 1); // plata
    records['drill/s-sol'] = rec(1, 0, 0); // solo bronce
    const j = evaluateJourney(records);
    const f3 = j.phases[2];
    expect(f3.missing.some((m) => m.includes('llevas 1'))).toBe(true);
  });

  it('songMastery es la mínima de las frases', () => {
    const records: Records = {};
    const song = LIBRARY[0];
    song.phrases.forEach((_, i) => (records[phraseKey(song.id, i)] = rec(3, 2, 1)));
    expect(songMastery(records, song.id)).toBe('silver');
    records[phraseKey(song.id, 0)] = rec(1, 0, 0); // una frase se queda en bronce
    expect(songMastery(records, song.id)).toBe('bronze');
  });

  it('isModuleComplete exige todas las lecciones', () => {
    const records: Records = {};
    expect(isModuleComplete(records, 'teclado')).toBe(false);
    completeModules(records, ['teclado']);
    expect(isModuleComplete(records, 'teclado')).toBe(true);
  });
});
