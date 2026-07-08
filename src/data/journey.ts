// El Camino: 6 fases medibles de aprendiz a intermedio.
// Cada fase define requisitos verificables sobre el estado de progreso:
// módulos completados, drills de técnica a cierto nivel de maestría y canciones
// a cierto nivel. evaluateJourney() es pura y testeable.

import { MODULES, lessonKey } from './curriculum';
import { LIBRARY, phraseKey, type LibrarySong } from './library';
import { MASTERY_RANK, masteryOf, type Mastery, type PracticeRecord } from '../store/useProgressStore';

export interface DrillReq {
  /** ids de drills candidatos (de la página Práctica) */
  ids: string[];
  mastery: Mastery;
  count: number;
  label: string;
}

export interface SongReq {
  level?: 'fácil' | 'media' | 'difícil'; // sin nivel = cualquiera
  mastery: Mastery;
  count: number;
  /** true = además exige la canción completa tocada limpia (dominada) */
  dominated?: boolean;
}

export interface Phase {
  num: number;
  title: string;
  emoji: string;
  description: string;
  moduleIds: string[];
  drills?: DrillReq[];
  songs?: SongReq[];
}

export const PHASES: Phase[] = [
  {
    num: 1,
    title: 'Primeros pasos',
    emoji: '🌱',
    description: 'Conoce tu instrumento: teclado, dedos y pulso.',
    moduleIds: ['bienvenida', 'teclado', 'dedos', 'ritmo'],
  },
  {
    num: 2,
    title: 'Primeras melodías',
    emoji: '🎵',
    description: 'Tus primeras canciones reales y la lectura básica.',
    moduleIds: ['melodias', 'partitura'],
    songs: [{ level: 'fácil', mastery: 'bronze', count: 2 }],
  },
  {
    num: 3,
    title: 'Fundamentos',
    emoji: '🧱',
    description: 'Alteraciones, escalas e intervalos, con técnica sólida.',
    moduleIds: ['alteraciones', 'escalas', 'intervalos'],
    drills: [{ ids: ['s-do', 's-sol'], mastery: 'silver', count: 2, label: 'Escalas Do y Sol mayor' }],
    songs: [{ level: 'fácil', mastery: 'silver', count: 2 }],
  },
  {
    num: 4,
    title: 'Acordes y acompañamiento',
    emoji: '🎶',
    description: 'Tríadas, progresiones y las dos manos juntas.',
    moduleIds: ['acordes', 'progresiones', 'dos-manos'],
    drills: [{ ids: ['c-do', 'c-sol', 'c-fa', 'c-lam', 'c-g7'], mastery: 'silver', count: 3, label: 'Acordes' }],
    songs: [{ level: 'media', mastery: 'bronze', count: 1 }],
  },
  {
    num: 5,
    title: 'Rumbo a intermedio',
    emoji: '🚀',
    description: 'Escalas menores, armaduras, inversiones y séptimas.',
    moduleIds: ['escalas-menores', 'armaduras', 'inversiones', 'septimas'],
    drills: [{ ids: ['s-lam'], mastery: 'silver', count: 1, label: 'Escala La menor' }],
    songs: [{ level: 'media', mastery: 'silver', count: 2 }],
  },
  {
    num: 6,
    title: 'Intermedio',
    emoji: '🏆',
    description: 'Arpegios, expresión y lectura a primera vista.',
    moduleIds: ['arpegios', 'expresion', 'lectura-vista'],
    songs: [
      { level: 'difícil', mastery: 'silver', count: 1 },
      { mastery: 'gold', count: 2, dominated: true },
    ],
  },
];

export type Records = Record<string, PracticeRecord>;

/** Etiquetas humanas de los drills de la página Práctica. */
export const DRILL_LABELS: Record<string, string> = {
  's-do': 'Escala Do mayor',
  's-sol': 'Escala Sol mayor',
  's-fa': 'Escala Fa mayor',
  's-lam': 'Escala La menor',
  'c-do': 'Acorde Do mayor',
  'c-sol': 'Acorde Sol mayor',
  'c-fa': 'Acorde Fa mayor',
  'c-lam': 'Acorde La menor',
  'c-g7': 'Acorde Sol 7',
  'a-do': 'Arpegio Do mayor',
  'a-lam': 'Arpegio La menor',
};

/** Drill de calentamiento sugerido según la fase actual. */
export const WARMUP_BY_PHASE: Record<number, { id: string; label: string }> = {
  1: { id: 's-do', label: 'Escala de Do mayor' },
  2: { id: 's-do', label: 'Escala de Do mayor' },
  3: { id: 's-sol', label: 'Escala de Sol mayor' },
  4: { id: 'c-do', label: 'Acorde de Do mayor' },
  5: { id: 's-lam', label: 'Escala de La menor' },
  6: { id: 'a-do', label: 'Arpegio de Do mayor' },
};

/** Etiqueta humana de una clave de progreso (para la lista de repasos). */
export function labelForKey(key: string): string {
  if (key.startsWith('drill/')) {
    const id = key.slice('drill/'.length);
    return `Drill: ${DRILL_LABELS[id] ?? id}`;
  }
  if (key.startsWith('cancion/')) {
    const [, songId, part] = key.split('/');
    const song = LIBRARY.find((s) => s.id === songId);
    if (!song) return key;
    if (part === 'full') return `${song.title} — canción completa`;
    const idx = Number(part);
    return `${song.title} — ${song.phrases[idx]?.name ?? `frase ${idx + 1}`}`;
  }
  const [moduleId, lessonId] = key.split('/');
  const mod = MODULES.find((m) => m.id === moduleId);
  const lesson = mod?.lessons.find((l) => l.id === lessonId);
  return lesson ? `Lección: ${lesson.title}` : key;
}

/** Ruta de la app a la que lleva una clave de progreso. */
export function linkForKey(key: string): string {
  if (key.startsWith('drill/')) return '/practica';
  if (key.startsWith('cancion/')) return `/canciones/${key.split('/')[1]}`;
  const [moduleId, lessonId] = key.split('/');
  return `/leccion/${moduleId}/${lessonId}`;
}

/** ¿Módulo completo? (todas sus lecciones con registro) */
export function isModuleComplete(records: Records, moduleId: string): boolean {
  const mod = MODULES.find((m) => m.id === moduleId);
  if (!mod) return false;
  return mod.lessons.every((l) => !!records[lessonKey(moduleId, l.id)]);
}

/** Maestría de una canción (objeto) = la mínima de sus frases. Sirve también para importadas. */
export function songMasteryOf(records: Records, song: LibrarySong): Mastery {
  let min: Mastery = 'gold';
  for (let i = 0; i < song.phrases.length; i++) {
    const m = masteryOf(records[phraseKey(song.id, i)]);
    if (MASTERY_RANK[m] < MASTERY_RANK[min]) min = m;
  }
  return min;
}

/** Maestría por id (solo biblioteca integrada; para el camino). */
export function songMastery(records: Records, songId: string): Mastery {
  const song = LIBRARY.find((s) => s.id === songId);
  return song ? songMasteryOf(records, song) : 'new';
}

/** Canción dominada (objeto): todas las frases ≥ plata y la completa tocada limpia. */
export function isSongDominatedSong(records: Records, song: LibrarySong): boolean {
  const full = records[`cancion/${song.id}/full`];
  return MASTERY_RANK[songMasteryOf(records, song)] >= MASTERY_RANK.silver && (full?.cleanReps ?? 0) >= 1;
}

/** Canción dominada por id (solo biblioteca integrada). */
export function isSongDominated(records: Records, songId: string): boolean {
  const song = LIBRARY.find((s) => s.id === songId);
  return song ? isSongDominatedSong(records, song) : false;
}

function countSongsAt(records: Records, req: SongReq): number {
  return LIBRARY.filter((s) => {
    if (req.level && s.level !== req.level) return false;
    if (req.dominated) return isSongDominated(records, s.id);
    return MASTERY_RANK[songMastery(records, s.id)] >= MASTERY_RANK[req.mastery];
  }).length;
}

function countDrillsAt(records: Records, req: DrillReq): number {
  return req.ids.filter((id) => MASTERY_RANK[masteryOf(records[`drill/${id}`])] >= MASTERY_RANK[req.mastery]).length;
}

/** Canción sugerida para trabajar hoy según la fase (la primera aún no dominada al nivel útil). */
export function suggestSong(records: Records, phase: number): { id: string; title: string; emoji: string } | null {
  const levelByPhase: Record<number, 'fácil' | 'media' | 'difícil'> = {
    1: 'fácil', 2: 'fácil', 3: 'fácil', 4: 'media', 5: 'media', 6: 'difícil',
  };
  const level = levelByPhase[phase] ?? 'fácil';
  const candidate =
    LIBRARY.find((s) => s.level === level && MASTERY_RANK[songMastery(records, s.id)] < MASTERY_RANK.silver) ??
    LIBRARY.find((s) => !isSongDominated(records, s.id));
  return candidate ? { id: candidate.id, title: candidate.title, emoji: candidate.emoji } : null;
}

export interface PhaseStatus {
  phase: Phase;
  done: boolean;
  /** Requisitos pendientes, en texto humano. */
  missing: string[];
  /** 0..1 aprox para la barra de progreso. */
  progress: number;
}

export interface JourneyStatus {
  phases: PhaseStatus[];
  /** 1..6; si todo está hecho, 6. */
  currentPhase: number;
  completed: boolean;
}

const MASTERY_NAME: Record<Mastery, string> = { new: 'nuevo', bronze: '🥉', silver: '🥈', gold: '🥇' };

export function evaluateJourney(records: Records): JourneyStatus {
  const phases: PhaseStatus[] = PHASES.map((phase) => {
    const missing: string[] = [];
    let total = 0;
    let ok = 0;

    for (const mid of phase.moduleIds) {
      total++;
      if (isModuleComplete(records, mid)) ok++;
      else {
        const mod = MODULES.find((m) => m.id === mid);
        missing.push(`Completa el módulo ${mod?.emoji ?? ''} ${mod?.title ?? mid}`);
      }
    }

    for (const d of phase.drills ?? []) {
      total++;
      const have = countDrillsAt(records, d);
      if (have >= d.count) ok++;
      else missing.push(`${d.label}: ${d.count} drill${d.count > 1 ? 's' : ''} a ${MASTERY_NAME[d.mastery]} (llevas ${have})`);
    }

    for (const sreq of phase.songs ?? []) {
      total++;
      const have = countSongsAt(records, sreq);
      if (have >= sreq.count) ok++;
      else {
        const levelTxt = sreq.level ? `${sreq.level}${sreq.count > 1 ? 's' : ''}` : 'cualquiera';
        const what = sreq.dominated
          ? `${sreq.count} canción(es) dominadas 🥇 (frases a 🥈 + canción completa limpia)`
          : `${sreq.count} canción(es) (${levelTxt}) a ${MASTERY_NAME[sreq.mastery]}`;
        missing.push(`${what} — llevas ${have}`);
      }
    }

    return { phase, done: missing.length === 0, missing, progress: total === 0 ? 1 : ok / total };
  });

  const firstPending = phases.findIndex((p) => !p.done);
  return {
    phases,
    currentPhase: firstPending === -1 ? PHASES.length : firstPending + 1,
    completed: firstPending === -1,
  };
}
