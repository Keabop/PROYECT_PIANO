// Progreso del usuario, persistido en localStorage.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LessonRecord {
  score: number; // 0..100
  stars: number; // 0..3
  completedAt: string; // ISO date
}

interface ProgressState {
  lessons: Record<string, LessonRecord>;
  xp: number;
  streak: number;
  lastActiveDay: string | null; // YYYY-MM-DD
  achievements: string[];
  completeLesson: (key: string, score: number, xpGain?: number) => void;
  addXp: (amount: number) => void;
  unlock: (achievement: string) => void;
  isCompleted: (key: string) => boolean;
  reset: () => void;
}

function todayKey(): string {
  // Fecha local en formato YYYY-MM-DD.
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      lessons: {},
      xp: 0,
      streak: 0,
      lastActiveDay: null,
      achievements: [],

      completeLesson: (key, score, xpGain = 20) => {
        const state = get();
        const today = todayKey();

        // Racha diaria
        let streak = state.streak;
        if (state.lastActiveDay == null) {
          streak = 1;
        } else {
          const diff = daysBetween(state.lastActiveDay, today);
          if (diff === 0) {
            streak = state.streak || 1;
          } else if (diff === 1) {
            streak = state.streak + 1;
          } else {
            streak = 1;
          }
        }

        const prev = state.lessons[key];
        const bestScore = Math.max(prev?.score ?? 0, score);
        const record: LessonRecord = {
          score: bestScore,
          stars: starsFor(bestScore),
          completedAt: new Date().toISOString(),
        };

        // XP: solo la primera vez que se completa se otorga el bono completo.
        const gain = prev ? Math.round(xpGain / 2) : xpGain;

        set({
          lessons: { ...state.lessons, [key]: record },
          xp: state.xp + gain,
          streak,
          lastActiveDay: today,
        });

        // Logros básicos
        const done = Object.keys(get().lessons).length;
        if (done >= 1) get().unlock('primera-leccion');
        if (done >= 5) get().unlock('cinco-lecciones');
        if (streak >= 3) get().unlock('racha-3');
        if (get().xp >= 200) get().unlock('200-xp');
      },

      addXp: (amount) => set((s) => ({ xp: s.xp + amount })),

      unlock: (achievement) =>
        set((s) => (s.achievements.includes(achievement) ? s : { achievements: [...s.achievements, achievement] })),

      isCompleted: (key) => !!get().lessons[key],

      reset: () => set({ lessons: {}, xp: 0, streak: 0, lastActiveDay: null, achievements: [] }),
    }),
    { name: 'pianoapp-progress' }
  )
);

export const ACHIEVEMENTS: Record<string, { title: string; emoji: string }> = {
  'primera-leccion': { title: 'Primera lección', emoji: '🌱' },
  'cinco-lecciones': { title: '5 lecciones', emoji: '🚀' },
  'racha-3': { title: 'Racha de 3 días', emoji: '🔥' },
  '200-xp': { title: '200 XP', emoji: '⭐' },
};
