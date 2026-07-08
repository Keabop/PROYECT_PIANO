// Biblioteca de canciones: piezas divididas en FRASES cortas (así se estudian, como con
// un profesor). Melodías simplificadas para mano derecha.
//
// RITMO: `durations` = duración de cada nota EN TIEMPOS (1 = negra, 0.5 = corchea,
// 2 = blanca, 1.5 = negra con puntillo...). El tempo lo da `bpm`. Sin `durations`,
// todas las notas duran 1 tiempo.
//
// REPERTORIO: piezas de dominio público/tradicionales COMPLETAS (su tema íntegro) +
// obras con copyright como ARREGLOS SIMPLIFICADOS del tema reconocible (una sola voz,
// transcripción libre propia, etiquetadas con isExcerpt). App de uso personal.

import { nameToMidi } from '../audio/noteUtils';

/** "C4 E4 G4" -> [60, 64, 67]. Solo nombres ingleses con sostenidos (C#4, D#5...). */
function N(s: string): number[] {
  return s.trim().split(/\s+/).map((x) => nameToMidi(x) as number);
}

export type SongCategory = 'clásica' | 'tradicional' | 'cine y series' | 'moderna' | 'importada';

export interface SongPhrase {
  name: string;
  notes: number[];
  /** Duración de cada nota en tiempos; debe tener la misma longitud que notes. */
  durations?: number[];
  /** Tiempo de INICIO de cada nota en tiempos desde el comienzo de la frase.
   *  Permite silencios reales (partituras importadas). Sin él, las notas van
   *  seguidas (cada una empieza donde termina la anterior). */
  offsets?: number[];
}

export interface LibrarySong {
  id: string;
  title: string;
  origin: string;
  emoji: string;
  category: SongCategory;
  level: 'fácil' | 'media' | 'difícil';
  bpm: number;
  isExcerpt?: boolean; // arreglo simplificado de obra con copyright
  phrases: SongPhrase[];
}

export const LIBRARY: LibrarySong[] = [
  // ============================ CLÁSICA ============================
  {
    id: 'oda-alegria',
    title: 'Oda a la Alegría',
    origin: 'Beethoven — 9.ª sinfonía',
    emoji: '🎼',
    category: 'clásica',
    level: 'fácil',
    bpm: 110,
    phrases: [
      // OJO: la Frase 1 la usa el test e2e — no cambiar sus notas.
      { name: 'Frase 1', notes: N('E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4 D4 D4'), durations: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 0.5, 2] },
      { name: 'Frase 2', notes: N('E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4 C4 C4'), durations: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 0.5, 2] },
      { name: 'Puente', notes: N('D4 D4 E4 C4 D4 E4 F4 E4 C4 D4 E4 F4 E4 D4 C4 D4 G3'), durations: [1, 1, 1, 1, 1, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 1, 1, 1, 1, 2] },
      { name: 'Frase final', notes: N('E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4 C4 C4'), durations: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 0.5, 2] },
    ],
  },
  {
    id: 'fur-elise',
    title: 'Para Elisa (Für Elise)',
    origin: 'Beethoven',
    emoji: '🌸',
    category: 'clásica',
    level: 'media',
    bpm: 80,
    phrases: [
      { name: 'Motivo', notes: N('E5 D#5 E5 D#5 E5 B4 D5 C5 A4'), durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 2] },
      { name: 'Respuesta 1', notes: N('C4 E4 A4 B4'), durations: [0.5, 0.5, 0.5, 2] },
      { name: 'Respuesta 2', notes: N('E4 G#4 B4 C5'), durations: [0.5, 0.5, 0.5, 2] },
      { name: 'Vuelta al motivo', notes: N('E4 E5 D#5 E5 D#5 E5 B4 D5 C5 A4'), durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 2] },
      { name: 'Segunda respuesta', notes: N('C4 E4 A4 B4 E4 C5 B4 A4'), durations: [0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 2] },
      { name: 'Cierre de la sección', notes: N('B4 C5 D5 E5 G4 F5 E5 D5 F4 E5 D5 C5 E4 D5 C5 B4'), durations: [0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 1] },
    ],
  },
  {
    id: 'canon-pachelbel',
    title: 'Canon en Re',
    origin: 'Pachelbel',
    emoji: '🎻',
    category: 'clásica',
    level: 'media',
    bpm: 50,
    phrases: [
      { name: 'Tema 1', notes: N('F#5 E5 D5 C#5 B4 A4 B4 C#5'), durations: [1, 1, 1, 1, 1, 1, 1, 1] },
      { name: 'Tema 2', notes: N('D5 C#5 B4 A4 G4 F#4 G4 E4'), durations: [1, 1, 1, 1, 1, 1, 1, 1] },
      { name: 'Variación 1', notes: N('D4 F#4 A4 G4 F#4 D4 F#4 E4 D4 B3 D4 A4 G4 B4 A4 G4'), durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] },
      { name: 'Variación 2', notes: N('F#4 D4 E4 F#4 D4 E4 F#4 F#3 G3 A3 B3 C#4 D4 E4'), durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] },
    ],
  },
  {
    id: 'claro-de-luna',
    title: 'Claro de Luna (Beethoven)',
    origin: 'Beethoven — Sonata n.º 14',
    emoji: '🌙',
    category: 'clásica',
    level: 'media',
    bpm: 60,
    phrases: [
      { name: 'Arpegio 1 (Do#m)', notes: N('G#3 C#4 E4 G#3 C#4 E4 G#3 C#4 E4'), durations: Array(9).fill(0.5) },
      { name: 'Arpegio 2 (La)', notes: N('A3 C#4 E4 A3 C#4 E4 A3 D4 F#4'), durations: Array(9).fill(0.5) },
      { name: 'Arpegio 3 (Sol#)', notes: N('G#3 C4 D#4 G#3 C4 D#4 G#3 C#4 E4'), durations: Array(9).fill(0.5) },
      { name: 'Arpegio 4 (vuelta)', notes: N('G#3 C#4 E4 G#3 C#4 E4 G#3 C#4 D#4'), durations: Array(9).fill(0.5) },
      { name: 'Con melodía', notes: N('G#3 C#4 E4 G#4 G#3 C#4 E4 G#4 G#3 C#4 E4 A4 G#4'), durations: [0.5, 0.5, 0.5, 1.5, 0.5, 0.5, 0.5, 1.5, 0.5, 0.5, 0.5, 1, 2] },
    ],
  },
  {
    id: 'gymnopedie',
    title: 'Gymnopédie n.º 1',
    origin: 'Erik Satie',
    emoji: '🌫️',
    category: 'clásica',
    level: 'difícil',
    bpm: 70,
    phrases: [
      { name: 'Melodía A', notes: N('F#5 A5 G5 F#5 C#5 B4 C#5 D5 A4'), durations: [2, 1, 1, 1, 1, 1, 1, 1, 4] },
      { name: 'Melodía B', notes: N('F#5 A5 G5 F#5 C#5 B4 C#5 D5 A4 C#5 D5 C#5 B4'), durations: [2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 4] },
      { name: 'Cierre', notes: N('B4 C#5 D5 E5 D5 C#5 B4 A4 F#4 A4 B4 A4'), durations: [1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 4] },
    ],
  },
  {
    id: 'minueto-sol',
    title: 'Minueto en Sol',
    origin: 'Petzold / cuaderno de Bach',
    emoji: '🕯️',
    category: 'clásica',
    level: 'media',
    bpm: 110,
    phrases: [
      { name: 'Frase 1', notes: N('D5 G4 A4 B4 C5 D5 G4 G4'), durations: [1, 0.5, 0.5, 0.5, 0.5, 1, 1, 1] },
      { name: 'Frase 2', notes: N('E5 C5 D5 E5 F#5 G5 G4 G4'), durations: [1, 0.5, 0.5, 0.5, 0.5, 1, 1, 1] },
      { name: 'Frase 3', notes: N('C5 D5 C5 B4 A4 B4 C5 B4 A4 G4'), durations: [1, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5] },
      { name: 'Frase 4', notes: N('F#4 G4 A4 B4 G4 B4 A4'), durations: [1, 0.5, 0.5, 0.5, 0.5, 1, 3] },
    ],
  },
  {
    id: 'preludio-do',
    title: 'Preludio en Do',
    origin: 'J. S. Bach — BWV 846',
    emoji: '⛪',
    category: 'clásica',
    level: 'media',
    bpm: 66,
    phrases: [
      { name: 'Do mayor', notes: N('C4 E4 G4 C5 E5 G4 C5 E5 C4 E4 G4 C5 E5 G4 C5 E5'), durations: Array(16).fill(0.5) },
      { name: 'Re menor', notes: N('C4 D4 A4 D5 F5 A4 D5 F5 C4 D4 A4 D5 F5 A4 D5 F5'), durations: Array(16).fill(0.5) },
      { name: 'Sol séptima', notes: N('B3 D4 G4 D5 F5 G4 D5 F5 B3 D4 G4 D5 F5 G4 D5 F5'), durations: Array(16).fill(0.5) },
      { name: 'Vuelta a Do', notes: N('C4 E4 G4 C5 E5 G4 C5 E5 C4 E4 G4 C5 E5 G4 C5 E5'), durations: Array(16).fill(0.5) },
    ],
  },
  {
    id: 'marcha-turca',
    title: 'Marcha Turca',
    origin: 'Mozart — Rondó alla turca',
    emoji: '🥁',
    category: 'clásica',
    level: 'difícil',
    bpm: 120,
    phrases: [
      { name: 'Frase 1', notes: N('B4 A4 G#4 A4 C5'), durations: [0.5, 0.5, 0.5, 0.5, 1] },
      { name: 'Frase 2', notes: N('D5 C5 B4 C5 E5'), durations: [0.5, 0.5, 0.5, 0.5, 1] },
      { name: 'Frase 3', notes: N('F5 E5 D#5 E5 B5 A5 G#5 A5 B5 A5 G#5 A5 C6'), durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1] },
      { name: 'Cierre', notes: N('A5 C6 B5 A5 G#5 A5 E5 F5 D5 C5 B4 A4'), durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 1] },
    ],
  },
  {
    id: 'nocturno-chopin',
    title: 'Nocturno Op. 9 n.º 2',
    origin: 'Chopin',
    emoji: '🌌',
    category: 'clásica',
    level: 'difícil',
    bpm: 60,
    phrases: [
      { name: 'Tema', notes: N('A#4 G5 F5 G5 F5 D#5 A#5 G5 D#5'), durations: [1, 2, 0.5, 0.5, 1, 1, 2, 1, 3] },
      { name: 'Respuesta', notes: N('C5 D5 D#5 C5 G4 C5 A#4 G4 F4 G4 A#4 G4'), durations: [1, 0.5, 0.5, 1, 1, 1, 1, 0.5, 0.5, 1, 1, 3] },
      { name: 'Segundo giro', notes: N('G5 A5 G5 F5 G5 A#5 G5 F5 D#5 D5 C5 A#4'), durations: [1, 0.5, 0.5, 1, 1, 2, 1, 1, 1, 0.5, 0.5, 3] },
    ],
  },
  {
    id: 'clair-debussy',
    title: 'Clair de Lune (Debussy)',
    origin: 'Debussy — Suite bergamasque (transposición fácil)',
    emoji: '✨',
    category: 'clásica',
    level: 'difícil',
    bpm: 60,
    phrases: [
      { name: 'Apertura', notes: N('E5 E5 D5 C5 D5 C5 B4 A4'), durations: [2, 1, 1, 2, 1, 1, 2, 4] },
      { name: 'Descenso', notes: N('G4 A4 B4 C5 D5 E5 D5 C5 B4'), durations: [1, 1, 1, 1, 1, 2, 1, 1, 4] },
      { name: 'Suspiro final', notes: N('C5 B4 A4 G4 A4 B4 A4'), durations: [1, 1, 2, 1, 1, 1, 4] },
    ],
  },
  {
    id: 'entertainer',
    title: 'The Entertainer',
    origin: 'Scott Joplin (ragtime)',
    emoji: '🎩',
    category: 'clásica',
    level: 'difícil',
    bpm: 90,
    phrases: [
      { name: 'Entrada', notes: N('D4 D#4 E4 C5 E4 C5 E4 C5'), durations: [0.5, 0.5, 0.5, 1, 0.5, 1, 0.5, 2.5] },
      { name: 'Frase 1', notes: N('C5 D5 D#5 E5 C5 D5 E5 B4 D5 C5'), durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 1, 2.5] },
      { name: 'Frase 2', notes: N('D4 D#4 E4 C5 E4 C5 E4 C5 A4 G4 F#4 A4 C5 E5 D5 C5 A4 D5'), durations: [0.5, 0.5, 0.5, 1, 0.5, 1, 0.5, 1.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 2] },
    ],
  },
  {
    id: 'montana-grieg',
    title: 'En la Gruta del Rey de la Montaña',
    origin: 'Grieg — Peer Gynt',
    emoji: '🏔️',
    category: 'clásica',
    level: 'media',
    bpm: 100,
    phrases: [
      { name: 'Tema (lento)', notes: N('A3 B3 C4 D4 E4 C4 E4'), durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1] },
      { name: 'Tensión', notes: N('D#4 B3 D#4 D4 A#3 D4'), durations: [0.5, 0.5, 1, 0.5, 0.5, 1] },
      { name: 'Tema completo', notes: N('A3 B3 C4 D4 E4 C4 E4 D#4 B3 D#4 D4 A#3 D4 A3 B3 C4 D4 E4 C4 E4 A4'), durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.5] },
    ],
  },
  {
    id: 'lago-cisnes',
    title: 'El Lago de los Cisnes',
    origin: 'Chaikovski (tema)',
    emoji: '🦢',
    category: 'clásica',
    level: 'media',
    bpm: 72,
    phrases: [
      { name: 'Tema', notes: N('E5 A4 B4 C5 D5 E5 E5 E5'), durations: [3, 0.5, 0.5, 0.5, 0.5, 2, 1, 3] },
      { name: 'Respuesta', notes: N('E5 C5 A4 C5 E5 A5 G5 E5 C5 A4 B4'), durations: [1, 0.5, 0.5, 0.5, 0.5, 2, 1, 0.5, 0.5, 1, 3] },
    ],
  },
  {
    id: 'habanera',
    title: 'Habanera (Carmen)',
    origin: 'Bizet — ópera Carmen',
    emoji: '🌹',
    category: 'clásica',
    level: 'media',
    bpm: 72,
    phrases: [
      { name: 'Descenso cromático', notes: N('D5 C#5 C5 B4 A#4 A4 G4 F4'), durations: [1.5, 0.5, 1, 1, 1.5, 0.5, 1, 1] },
      { name: 'Respuesta', notes: N('F4 G4 A4 A#4 B4 C5 D5 C5 B4 A4'), durations: [1, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 1, 2] },
    ],
  },

  // ============================ TRADICIONAL ============================
  {
    id: 'estrellita',
    title: 'Estrellita',
    origin: 'Tradicional',
    emoji: '⭐',
    category: 'tradicional',
    level: 'fácil',
    bpm: 100,
    phrases: [
      { name: 'Frase 1', notes: N('C4 C4 G4 G4 A4 A4 G4'), durations: [1, 1, 1, 1, 1, 1, 2] },
      { name: 'Frase 2', notes: N('F4 F4 E4 E4 D4 D4 C4'), durations: [1, 1, 1, 1, 1, 1, 2] },
      { name: 'Frase 3', notes: N('G4 G4 F4 F4 E4 E4 D4'), durations: [1, 1, 1, 1, 1, 1, 2] },
      { name: 'Frase 4', notes: N('C4 C4 G4 G4 A4 A4 G4 F4 F4 E4 E4 D4 D4 C4'), durations: [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2] },
    ],
  },
  {
    id: 'cumpleanos',
    title: 'Cumpleaños feliz',
    origin: 'Tradicional',
    emoji: '🎂',
    category: 'tradicional',
    level: 'fácil',
    bpm: 125,
    phrases: [
      { name: 'Frase 1', notes: N('G4 G4 A4 G4 C5 B4'), durations: [0.75, 0.25, 1, 1, 1, 2] },
      { name: 'Frase 2', notes: N('G4 G4 A4 G4 D5 C5'), durations: [0.75, 0.25, 1, 1, 1, 2] },
      { name: 'Frase 3', notes: N('G4 G4 G5 E5 C5 B4 A4'), durations: [0.75, 0.25, 1, 1, 1, 1, 2] },
      { name: 'Frase 4', notes: N('F5 F5 E5 C5 D5 C5'), durations: [0.75, 0.25, 1, 1, 1, 2] },
    ],
  },
  {
    id: 'jingle-bells',
    title: 'Jingle Bells',
    origin: 'J. Pierpont — Tradicional',
    emoji: '🔔',
    category: 'tradicional',
    level: 'fácil',
    bpm: 130,
    phrases: [
      { name: 'Estrofa 1', notes: N('C4 A4 G4 F4 C4 C4 A4 G4 F4 D4'), durations: [1, 1, 1, 1, 2.5, 0.5, 1, 1, 1, 3] },
      { name: 'Estrofa 2', notes: N('D4 A#4 A4 G4 E4 C5 C5 A#4 G4 A4'), durations: [1, 1, 1, 1, 3, 1, 1, 1, 1, 3] },
      { name: 'Estribillo 1', notes: N('E4 E4 E4 E4 E4 E4 E4 G4 C4 D4 E4'), durations: [1, 1, 2, 1, 1, 2, 1, 1, 1.5, 0.5, 4] },
      { name: 'Estribillo 2', notes: N('F4 F4 F4 F4 F4 E4 E4 E4 E4 D4 D4 E4 D4 G4'), durations: [1, 1, 1.5, 0.5, 1, 1, 1, 0.5, 0.5, 1, 1, 1, 2, 2] },
    ],
  },
  {
    id: 'amazing-grace',
    title: 'Amazing Grace',
    origin: 'Himno tradicional',
    emoji: '🕊️',
    category: 'tradicional',
    level: 'fácil',
    bpm: 90,
    phrases: [
      { name: 'Frase 1', notes: N('G4 C5 E5 C5 E5 D5 C5 A4 G4'), durations: [1, 2, 0.5, 0.5, 2, 1, 2, 1, 3] },
      { name: 'Frase 2', notes: N('G4 C5 E5 C5 E5 D5 G5'), durations: [1, 2, 0.5, 0.5, 2, 1, 3] },
      { name: 'Frase 3', notes: N('E5 G5 E5 C5 G4 A4 C5 C5 A4 G4'), durations: [1, 1.5, 0.5, 1, 2, 1, 1, 0.5, 0.5, 3] },
      { name: 'Frase 4', notes: N('G4 C5 E5 C5 E5 D5 C5'), durations: [1, 2, 0.5, 0.5, 2, 1, 3] },
    ],
  },
  {
    id: 'greensleeves',
    title: 'Greensleeves',
    origin: 'Tradicional inglesa',
    emoji: '🍃',
    category: 'tradicional',
    level: 'media',
    bpm: 100,
    phrases: [
      { name: 'Frase 1', notes: N('A4 C5 D5 E5 F5 E5 D5 B4 G4 A4 B4 C5'), durations: [1, 2, 1, 1.5, 0.5, 1, 2, 1, 1.5, 0.5, 1, 2] },
      { name: 'Frase 2', notes: N('A4 A4 G#4 A4 B4 G#4 E4'), durations: [1, 1.5, 0.5, 1, 2, 1, 3] },
      { name: 'Sección B', notes: N('G5 G5 F#5 E5 D5 B4 G4 A4 B4 C5'), durations: [2, 1, 1.5, 0.5, 1, 2, 1, 1.5, 0.5, 3] },
      { name: 'Cierre B', notes: N('G5 G5 F#5 E5 D5 B4 G4 A4 B4 A4 G#4 F#4 G#4 A4'), durations: [2, 1, 1.5, 0.5, 1, 2, 1, 1, 1, 1, 1.5, 0.5, 1, 3] },
      { name: 'Frase completa', notes: N('A4 C5 D5 E5 F5 E5 D5 B4 G4 A4 B4 C5 B4 A4 G#4 A4'), durations: [1, 2, 1, 1.5, 0.5, 1, 2, 1, 1.5, 0.5, 1, 2, 1, 1, 1.5, 3] },
    ],
  },
  {
    id: 'cielito-lindo',
    title: 'Cielito Lindo',
    origin: 'Tradicional mexicana',
    emoji: '🇲🇽',
    category: 'tradicional',
    level: 'fácil',
    bpm: 130,
    phrases: [
      { name: '"De la Sierra Morena…"', notes: N('G4 C5 E5 E5 D5 E5 F5 F5 E5 D5 C5'), durations: [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 3] },
      { name: '"…vienen bajando"', notes: N('G4 B4 D5 D5 C5 D5 E5 D5 C5 B4 C5'), durations: [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 3] },
      { name: '"Ay, ay, ay, ay…"', notes: N('C5 C5 C5 A4 A4 F5 F5 E5 D5 C5'), durations: [2, 1, 2, 1, 2, 2, 1, 1, 1, 3] },
      { name: '"…canta y no llores"', notes: N('G4 B4 D5 D5 C5 D5 E5 D5 C5 B4 C5'), durations: [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 3] },
    ],
  },
  {
    id: 'mananitas',
    title: 'Las Mañanitas',
    origin: 'Tradicional mexicana',
    emoji: '🌅',
    category: 'tradicional',
    level: 'fácil',
    bpm: 95,
    phrases: [
      { name: '"Estas son las mañanitas…"', notes: N('C4 C4 D4 E4 E4 D4 E4 F4 E4 D4 C4'), durations: [0.5, 0.5, 1, 1, 1, 0.5, 0.5, 1, 1, 1, 2] },
      { name: '"…que cantaba el rey David"', notes: N('C4 C4 D4 E4 E4 D4 E4 G4 D4 D4 E4 F4'), durations: [0.5, 0.5, 1, 1, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 2] },
      { name: '"Hoy por ser día de tu santo…"', notes: N('F4 F4 F4 E4 D4 E4 F4 G4 E4 C4'), durations: [0.5, 0.5, 1, 1, 1, 0.5, 0.5, 1, 1, 2] },
      { name: '"…te las cantamos a ti"', notes: N('C5 C5 B4 A4 G4 F4 E4 D4 C4'), durations: [1, 0.5, 0.5, 1, 1, 1, 1, 1, 2] },
    ],
  },
  {
    id: 'cucaracha',
    title: 'La Cucaracha',
    origin: 'Tradicional',
    emoji: '🪳',
    category: 'tradicional',
    level: 'fácil',
    bpm: 120,
    phrases: [
      { name: 'Frase 1', notes: N('C4 C4 C4 F4 A4 C4 C4 C4 F4 A4'), durations: [0.5, 0.5, 0.5, 1, 1.5, 0.5, 0.5, 0.5, 1, 1.5] },
      { name: 'Frase 2', notes: N('F4 F4 E4 E4 D4 D4 C4'), durations: [1, 0.5, 0.5, 1, 0.5, 0.5, 2] },
      { name: 'Frase 3', notes: N('C4 C4 C4 E4 G4 C4 C4 C4 E4 G4 C5 D5 C5 A#4 A4 G4 F4'), durations: [0.5, 0.5, 0.5, 1, 1.5, 0.5, 0.5, 0.5, 1, 1.5, 1, 0.5, 0.5, 0.5, 0.5, 1, 2] },
    ],
  },
  {
    id: 'auld-lang-syne',
    title: 'Auld Lang Syne',
    origin: 'Tradicional escocesa',
    emoji: '🥂',
    category: 'tradicional',
    level: 'fácil',
    bpm: 90,
    phrases: [
      { name: 'Frase 1', notes: N('C4 F4 F4 F4 A4 G4 F4 G4 A4 G4'), durations: [1, 1.5, 0.5, 1, 1, 1.5, 0.5, 0.5, 0.5, 1] },
      { name: 'Frase 2', notes: N('F4 F4 A4 C5 D5'), durations: [1.5, 0.5, 1, 1, 3] },
      { name: 'Frase 3', notes: N('D5 C5 A4 A4 F4 G4 F4 G4 A4 G4'), durations: [1, 1.5, 0.5, 1, 1, 1.5, 0.5, 0.5, 0.5, 1] },
      { name: 'Frase 4', notes: N('F4 D4 D4 C4 F4'), durations: [1.5, 0.5, 1, 1, 3] },
    ],
  },

  // ============================ CINE Y SERIES ============================
  {
    id: 'interstellar',
    title: 'Interstellar (tema principal)',
    origin: 'Hans Zimmer — arreglo simplificado',
    emoji: '🚀',
    category: 'cine y series',
    level: 'media',
    bpm: 60,
    isExcerpt: true,
    phrases: [
      { name: 'Motivo 1', notes: N('A4 E5 A4 E5 B4 E5 B4 E5'), durations: Array(8).fill(0.5) },
      { name: 'Motivo 2', notes: N('C5 E5 C5 E5 B4 E5 B4 E5'), durations: Array(8).fill(0.5) },
      { name: 'Tema largo', notes: N('A4 B4 C5 B4 A4 B4 E5'), durations: [2, 2, 2, 2, 2, 2, 4] },
      { name: 'Clímax', notes: N('C5 E5 D5 E5 C5 E5 B4 E5 A4 E5 A4 E5'), durations: Array(12).fill(0.5) },
      { name: 'Final', notes: N('A4 E5 B4 E5 C5 E5 B4 E5 A4 E5 A5'), durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 3] },
    ],
  },
  {
    id: 'city-of-stars',
    title: 'City of Stars (La La Land)',
    origin: 'J. Hurwitz — arreglo simplificado',
    emoji: '🌆',
    category: 'cine y series',
    level: 'media',
    bpm: 90,
    isExcerpt: true,
    phrases: [
      { name: '"City of stars…"', notes: N('E4 C5 B4 A4'), durations: [1, 1, 1, 3] },
      { name: '"…are you shining just for me?"', notes: N('A4 B4 C5 D5 B4 G#4 A4'), durations: [0.5, 0.5, 1, 1, 1, 1, 3] },
      { name: '"City of stars, there\'s so much…"', notes: N('E4 C5 B4 A4 A4 A4 B4 C5 D5 E5'), durations: [1, 1, 1, 2, 0.5, 0.5, 1, 1, 1, 3] },
      { name: '"…that I can\'t see, who knows"', notes: N('E5 D5 C5 D5 B4 A4 G#4 A4 B4'), durations: [1, 1, 1, 1, 1, 1, 1, 1, 3] },
      { name: 'Frase completa', notes: N('E4 C5 B4 A4 A4 B4 C5 D5 B4 G#4 A4'), durations: [1, 1, 1, 2, 0.5, 0.5, 1, 1, 1, 1, 3] },
    ],
  },
  {
    id: 'mia-sebastian',
    title: "Mia & Sebastian's Theme (La La Land)",
    origin: 'J. Hurwitz — arreglo simplificado',
    emoji: '🎹',
    category: 'cine y series',
    level: 'difícil',
    bpm: 66,
    isExcerpt: true,
    phrases: [
      { name: 'Apertura', notes: N('C4 G4 C5 E5 D5 C5 G4'), durations: [1, 1, 1, 2, 1, 1, 3] },
      { name: 'Respuesta', notes: N('C4 A4 C5 F5 E5 D5 A4 G4'), durations: [1, 1, 1, 2, 1, 1, 1, 3] },
      { name: 'Sección B', notes: N('E5 F5 G5 F5 E5 D5 C5 D5 E5 D5'), durations: [1, 0.5, 0.5, 1, 1, 1, 1, 0.5, 0.5, 3] },
      { name: 'Cierre', notes: N('C5 D5 E5 G4 A4 B4 C5'), durations: [1, 1, 2, 1, 1, 1, 4] },
    ],
  },
  {
    id: 'titanic',
    title: 'My Heart Will Go On (Titanic)',
    origin: 'J. Horner — arreglo simplificado (en Do)',
    emoji: '🚢',
    category: 'cine y series',
    level: 'media',
    bpm: 96,
    isExcerpt: true,
    phrases: [
      { name: 'Intro (flauta)', notes: N('G4 A4 A4 B4 C5 B4 A4 G4 A4'), durations: [1, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 3] },
      { name: '"Every night in my dreams…"', notes: N('C5 C5 C5 C5 B4 C5 C5 B4 C5 D5 E5 D5'), durations: [1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 2] },
      { name: '"Near, far, wherever you are"', notes: N('C5 D5 E5 G5 F5 E5 D5 E5 D5 C5'), durations: [1, 1, 2, 2, 1, 1, 2, 1, 1, 3] },
      { name: '"…my heart will go on"', notes: N('C5 D5 E5 G5 F5 E5 D5 C5 D5 B4 C5'), durations: [1, 1, 2, 2, 1, 1, 2, 1, 1, 1, 4] },
    ],
  },
  {
    id: 'hedwig',
    title: "Hedwig's Theme (Harry Potter)",
    origin: 'John Williams — arreglo simplificado',
    emoji: '🦉',
    category: 'cine y series',
    level: 'media',
    bpm: 70,
    isExcerpt: true,
    phrases: [
      { name: 'Frase 1', notes: N('B4 E5 G5 F#5 E5 B5 A5 F#5'), durations: [1, 1.5, 0.5, 1, 2, 1, 3, 3] },
      { name: 'Frase 2', notes: N('B4 E5 G5 F#5 E5 D#5 F#5 B4'), durations: [1, 1.5, 0.5, 1, 2, 1, 2, 3] },
      { name: 'Tema completo', notes: N('B4 E5 G5 F#5 E5 B5 A5 F#5 E5 G5 F#5 D#5 F#5 B4'), durations: [1, 1.5, 0.5, 1, 2, 1, 3, 2, 1.5, 0.5, 2, 1, 2, 3] },
    ],
  },
  {
    id: 'pirata',
    title: "He's a Pirate (Piratas del Caribe)",
    origin: 'K. Badelt / H. Zimmer — arreglo simplificado',
    emoji: '🏴‍☠️',
    category: 'cine y series',
    level: 'difícil',
    bpm: 125,
    isExcerpt: true,
    phrases: [
      { name: 'Frase 1', notes: N('A4 C5 D5 D5 D5 E5 F5 F5'), durations: [0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1] },
      { name: 'Frase 2', notes: N('F5 G5 E5 E5 D5 C5 C5 D5'), durations: [0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1] },
      { name: 'Frase 3', notes: N('A4 C5 D5 D5 D5 F5 E5 E5'), durations: [0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1] },
      { name: 'Frase 4', notes: N('E5 F5 D5 D5 E5 D5 C#5 D5'), durations: [0.5, 0.5, 1, 1, 0.5, 0.5, 1, 2] },
      { name: 'Puente', notes: N('D5 E5 F5 F5 G5 A5 A5 A#5 A5 G5 A5 F5 G5'), durations: [0.5, 0.5, 1, 1, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 1, 2] },
    ],
  },
  {
    id: 'amelie',
    title: "Comptine d'un autre été (Amélie)",
    origin: 'Yann Tiersen — arreglo simplificado',
    emoji: '🍬',
    category: 'cine y series',
    level: 'media',
    bpm: 100,
    isExcerpt: true,
    phrases: [
      { name: 'Ostinato', notes: N('E4 B4 E5 B4 E4 B4 E5 B4 G4 B4 E5 B4 G4 B4 E5 B4'), durations: Array(16).fill(0.5) },
      { name: 'Melodía A', notes: N('B4 E5 E5 D5 E5 B4'), durations: [1, 1, 1, 0.5, 0.5, 2] },
      { name: 'Melodía B', notes: N('B4 E5 E5 F#5 G5 F#5 E5'), durations: [1, 1, 1, 0.5, 0.5, 1, 2] },
      { name: 'Cierre', notes: N('G5 F#5 E5 D5 E5 B4 A4 B4 E4'), durations: [1, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 3] },
    ],
  },

  // ============================ MODERNA ============================
  {
    id: 'runaway',
    title: 'Runaway (Kanye West)',
    origin: 'Kanye West — la intro de piano, arreglo simplificado',
    emoji: '🕊️',
    category: 'moderna',
    level: 'fácil',
    bpm: 72,
    isExcerpt: true,
    phrases: [
      { name: 'La nota (plink)', notes: N('E5 E5 E5 E5 E5 E5 E5 E5'), durations: [1, 1, 1, 1, 1, 1, 1, 1] },
      { name: 'Descenso', notes: N('E5 D#5 C#5 B4 C#5 B4 A4 G#4'), durations: [1, 1, 1, 1, 1, 1, 1, 1] },
      { name: 'Ciclo de acordes 1', notes: N('E4 G#4 B4 E5 D#4 F#4 B4 D#5'), durations: [0.5, 0.5, 0.5, 1.5, 0.5, 0.5, 0.5, 1.5] },
      { name: 'Ciclo de acordes 2', notes: N('C#4 E4 G#4 C#5 A3 C#4 E4 A4'), durations: [0.5, 0.5, 0.5, 1.5, 0.5, 0.5, 0.5, 1.5] },
      { name: 'Intro completa', notes: N('E5 E5 E5 E5 E5 D#5 C#5 B4 E4 G#4 B4 E5 A3 C#4 E4 A4'), durations: [1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0.5, 0.5, 1.5, 0.5, 0.5, 0.5, 1.5] },
    ],
  },
  {
    id: 'river-flows',
    title: 'River Flows in You',
    origin: 'Yiruma — arreglo simplificado',
    emoji: '🌊',
    category: 'moderna',
    level: 'media',
    bpm: 80,
    isExcerpt: true,
    phrases: [
      { name: 'Gancho', notes: N('A4 G#4 A4 G#4 A4 E4 A4 D4 A4 C#4'), durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.5] },
      { name: 'Giro', notes: N('D4 C#4 D4 E4 C#4 B3 A3 G#3 A3'), durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.5] },
      { name: 'Melodía', notes: N('A4 B4 C#5 C#5 D5 E5 D5 C#5 B4 A4 G#4 A4'), durations: [0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 1.5] },
      { name: 'Vuelta al gancho', notes: N('A4 G#4 A4 G#4 A4 E4 A4 D4 A4 C#4 B3 A3'), durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 2] },
    ],
  },
  {
    id: 'nuvole-bianche',
    title: 'Nuvole Bianche',
    origin: 'Ludovico Einaudi — arreglo simplificado (en La menor)',
    emoji: '☁️',
    category: 'moderna',
    level: 'media',
    bpm: 80,
    isExcerpt: true,
    phrases: [
      { name: 'Gancho', notes: N('B4 A4 A4 A4 B4 A4 A4 A4 B4 A4 A4 A4'), durations: [1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1] },
      { name: 'Subida', notes: N('D5 C5 C5 C5 D5 C5 C5 E5 C5 B4 B4'), durations: [1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1, 0.5, 1.5] },
      { name: 'Descenso', notes: N('E5 D5 C5 B4 E4 B4 A4 A4'), durations: [1, 1, 1, 1, 1, 1, 1, 2] },
      { name: 'Cierre', notes: N('A4 G4 F4 F4 E4'), durations: [1, 1, 1, 1, 4] },
    ],
  },
  {
    id: 'sweden',
    title: 'Sweden (Minecraft)',
    origin: 'C418 — arreglo simplificado',
    emoji: '⛏️',
    category: 'moderna',
    level: 'fácil',
    bpm: 65,
    isExcerpt: true,
    phrases: [
      { name: 'Amanecer', notes: N('A3 C4 E4 A4 G3 C4 E4 G4'), durations: [1, 1, 1, 1, 1, 1, 1, 1] },
      { name: 'Acordes 2', notes: N('D4 F4 A4 D5 G3 B3 D4 G4'), durations: [1, 1, 1, 1, 1, 1, 1, 1] },
      { name: 'Melodía', notes: N('E5 C5 D5 B4 C5 A4 B4 G4 A4'), durations: [1, 1, 1, 1, 1, 1, 1, 1, 3] },
      { name: 'Cierre', notes: N('A4 E4 C4 A3'), durations: [1, 1, 1, 4] },
    ],
  },
];

export function songByIdLib(id: string): LibrarySong | undefined {
  return LIBRARY.find((s) => s.id === id);
}

/** Clave de progreso para una frase de canción. */
export function phraseKey(songId: string, phraseIdx: number): string {
  return `cancion/${songId}/${phraseIdx}`;
}

/** Duraciones de una frase en SEGUNDOS según el tempo de la canción (1 tiempo por defecto). */
export function phraseDurationsSec(phrase: SongPhrase, bpm: number): number[] {
  const beat = 60 / bpm;
  return phrase.notes.map((_, i) => (phrase.durations?.[i] ?? 1) * beat);
}

/** Duraciones de una frase en TIEMPOS (1 por defecto). */
export function phraseDurationsBeats(phrase: SongPhrase): number[] {
  return phrase.notes.map((_, i) => phrase.durations?.[i] ?? 1);
}

/** Tiempos de inicio en TIEMPOS: los explícitos, o acumulados si la frase es legato. */
export function phraseOffsetsBeats(phrase: SongPhrase): number[] {
  if (phrase.offsets) return phrase.offsets;
  const durs = phraseDurationsBeats(phrase);
  const out: number[] = [];
  let t = 0;
  for (const d of durs) {
    out.push(t);
    t += d;
  }
  return out;
}

export const CATEGORIES: { id: SongCategory; title: string; emoji: string }[] = [
  { id: 'clásica', title: 'Clásica', emoji: '🎼' },
  { id: 'tradicional', title: 'Tradicional y popular', emoji: '🌍' },
  { id: 'cine y series', title: 'Cine y series', emoji: '🎬' },
  { id: 'moderna', title: 'Moderna', emoji: '🎧' },
  { id: 'importada', title: 'Mis partituras importadas', emoji: '📄' },
];
