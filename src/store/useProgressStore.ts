// Progreso del usuario, persistido en localStorage.
//
// Sistema de maestría: cada ítem practicable (frase de canción, drill, lección)
// acumula repeticiones. Tocarlo UNA vez no es aprenderlo:
//   — Nuevo (0 reps) · 🥉 Bronce (≥1 rep) · 🥈 Plata (≥3 reps y ≥1 limpia)
//   · 🥇 Oro (3 limpias SEGUIDAS)
// Además: repaso espaciado (1→3→7→14→30 días) y registro de la sesión diaria.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Mastery = 'new' | 'bronze' | 'silver' | 'gold';

export interface PracticeRecord {
  score: number; // 0..100 (mejor puntuación)
  stars: number; // 0..3
  completedAt: string; // ISO date
  reps: number; // veces completado
  cleanReps: number; // veces completado sin errores
  streak: number; // limpias seguidas (se rompe con errores)
  lastErrors: number;
}

export interface ReviewEntry {
  due: string; // YYYY-MM-DD
  interval: number; // días
}

export type SessionStep = 'warmup' | 'lesson' | 'song' | 'review';

interface ProgressState {
  lessons: Record<string, PracticeRecord>;
  reviews: Record<string, ReviewEntry>;
  sessionLog: Record<string, Partial<Record<SessionStep, boolean>>>; // por día
  xp: number;
  streak: number;
  lastActiveDay: string | null; // YYYY-MM-DD
  achievements: string[];
  /** Registra una ejecución completada de un ítem (con sus errores). */
  recordPractice: (key: string, errors: number, xpGain?: number) => void;
  addXp: (amount: number) => void;
  unlock: (achievement: string) => void;
  isCompleted: (key: string) => boolean;
  /** Ítems con repaso vencido a fecha de hoy. */
  dueReviews: () => string[];
  reset: () => void;
}

export const REVIEW_INTERVALS = [1, 3, 7, 14, 30];

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(day: string, n: number): string {
  const d = new Date(day + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return todayKey(d);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

function starsFor(score: number): number {
  if (score >= 95) return 3;
  if (score >= 75) return 2;
  if (score >= 40) return 1;
  return 0;
}

/** Nivel de maestría de un registro. */
export function masteryOf(record: PracticeRecord | undefined): Mastery {
  if (!record || record.reps <= 0) return 'new';
  if (record.streak >= 3) return 'gold';
  if (record.reps >= 3 && record.cleanReps >= 1) return 'silver';
  return 'bronze';
}

export const MASTERY_RANK: Record<Mastery, number> = { new: 0, bronze: 1, silver: 2, gold: 3 };
export const MASTERY_LABEL: Record<Mastery, string> = { new: '—', bronze: '🥉', silver: '🥈', gold: '🥇' };

/** Aplica una ejecución (pura, testeable). */
export function applyPractice(prev: PracticeRecord | undefined, errors: number): PracticeRecord {
  const clean = errors === 0;
  const score = Math.max(prev?.score ?? 0, Math.max(40, 100 - errors * 10));
  return {
    score,
    stars: starsFor(score),
    completedAt: new Date().toISOString(),
    reps: (prev?.reps ?? 0) + 1,
    cleanReps: (prev?.cleanReps ?? 0) + (clean ? 1 : 0),
    streak: clean ? (prev?.streak ?? 0) + 1 : 0,
    lastErrors: errors,
  };
}

/** Siguiente intervalo de repaso (puro, testeable). Limpio sube, con errores baja. */
export function nextReviewInterval(current: number, errors: number): number {
  const idx = REVIEW_INTERVALS.indexOf(current);
  if (errors === 0) {
    return REVIEW_INTERVALS[Math.min(idx < 0 ? 0 : idx + 1, REVIEW_INTERVALS.length - 1)];
  }
  return REVIEW_INTERVALS[Math.max(idx < 0 ? 0 : idx - 1, 0)];
}

/** Paso de la sesión diaria al que corresponde un ítem. */
function sessionStepFor(key: string, wasDueReview: boolean): SessionStep {
  if (wasDueReview) return 'review';
  if (key.startsWith('drill/')) return 'warmup';
  if (key.startsWith('cancion/')) return 'song';
  return 'lesson';
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      lessons: {},
      reviews: {},
      sessionLog: {},
      xp: 0,
      streak: 0,
      lastActiveDay: null,
      achievements: [],

      recordPractice: (key, errors, xpGain = 10) => {
        const state = get();
        const today = todayKey();

        // Racha diaria
        let streak = state.streak;
        if (state.lastActiveDay == null) {
          streak = 1;
        } else {
          const diff = daysBetween(state.lastActiveDay, today);
          if (diff === 0) streak = state.streak || 1;
          else if (diff === 1) streak = state.streak + 1;
          else streak = 1;
        }

        const prev = state.lessons[key];
        const record = applyPractice(prev, errors);

        // XP: completo la primera vez; después una fracción por repetición.
        const gain = prev ? Math.max(2, Math.round(xpGain / 3)) : xpGain;

        // Repaso espaciado
        const review = state.reviews[key];
        const wasDue = !!review && review.due <= today;
        let nextReview: ReviewEntry;
        if (!review) {
          nextReview = { due: addDays(today, 1), interval: 1 };
        } else if (wasDue) {
          const interval = nextReviewInterval(review.interval, errors);
          nextReview = { due: addDays(today, interval), interval };
        } else {
          nextReview = review; // práctica extra antes de tiempo: no mueve el repaso
        }

        // Registro de la sesión de hoy
        const step = sessionStepFor(key, wasDue);
        const daySteps = { ...(state.sessionLog[today] ?? {}), [step]: true };

        set({
          lessons: { ...state.lessons, [key]: record },
          reviews: { ...state.reviews, [key]: nextReview },
          sessionLog: { ...state.sessionLog, [today]: daySteps },
          xp: state.xp + gain,
          streak,
          lastActiveDay: today,
        });

        // Logros
        const s = get();
        const done = Object.keys(s.lessons).length;
        if (done >= 1) s.unlock('primera-leccion');
        if (done >= 5) s.unlock('cinco-lecciones');
        if (streak >= 3) s.unlock('racha-3');
        if (s.xp >= 200) s.unlock('200-xp');
        if (Object.values(s.lessons).some((r) => masteryOf(r) === 'gold')) s.unlock('primer-oro');
      },

      addXp: (amount) => set((s) => ({ xp: s.xp + amount })),

      unlock: (achievement) =>
        set((s) => (s.achievements.includes(achievement) ? s : { achievements: [...s.achievements, achievement] })),

      isCompleted: (key) => !!get().lessons[key],

      dueReviews: () => {
        const today = todayKey();
        return Object.entries(get().reviews)
          .filter(([, r]) => r.due <= today)
          .map(([k]) => k);
      },

      reset: () =>
        set({ lessons: {}, reviews: {}, sessionLog: {}, xp: 0, streak: 0, lastActiveDay: null, achievements: [] }),
    }),
    {
      name: 'pianoapp-progress',
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Partial<ProgressState> & {
          lessons?: Record<string, Partial<PracticeRecord>>;
        };
        if (version < 1 && state.lessons) {
          // Lo ya completado en la versión anterior cuenta como 1 repetición limpia.
          const lessons: Record<string, PracticeRecord> = {};
          for (const [k, r] of Object.entries(state.lessons)) {
            lessons[k] = {
              score: r.score ?? 100,
              stars: r.stars ?? 3,
              completedAt: r.completedAt ?? new Date().toISOString(),
              reps: r.reps ?? 1,
              cleanReps: r.cleanReps ?? 1,
              streak: r.streak ?? 1,
              lastErrors: r.lastErrors ?? 0,
            };
          }
          return { ...state, lessons, reviews: state.reviews ?? {}, sessionLog: state.sessionLog ?? {} };
        }
        return state;
      },
    }
  )
);

export const ACHIEVEMENTS: Record<string, { title: string; emoji: string }> = {
  'primera-leccion': { title: 'Primera lección', emoji: '🌱' },
  'cinco-lecciones': { title: '5 lecciones', emoji: '🚀' },
  'racha-3': { title: 'Racha de 3 días', emoji: '🔥' },
  '200-xp': { title: '200 XP', emoji: '⭐' },
  'primer-oro': { title: 'Primer oro', emoji: '🥇' },
};
