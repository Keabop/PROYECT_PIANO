// Biblioteca de canciones: piezas divididas en FRASES cortas (así se estudian, como con
// un profesor). Melodías simplificadas para mano derecha, como números MIDI.
//
// RITMO: cada frase puede llevar `durations` — la duración de cada nota EN TIEMPOS
// (1 = negra, 0.5 = corchea, 2 = blanca, 1.5 = negra con puntillo...). El tempo lo da
// `bpm` (negras por minuto). Sin `durations`, todas las notas duran 1 tiempo.
//
// Repertorio: piezas de dominio público completas + dos temas de película como
// FRAGMENTOS BREVES SIMPLIFICADOS (transcripción libre propia, etiquetados como tales).

export interface SongPhrase {
  name: string;
  notes: number[];
  /** Duración de cada nota en tiempos; debe tener la misma longitud que notes. */
  durations?: number[];
}

export interface LibrarySong {
  id: string;
  title: string;
  origin: string;
  emoji: string;
  level: 'fácil' | 'media' | 'difícil';
  bpm: number;
  isExcerpt?: boolean; // fragmento simplificado, no la pieza completa
  phrases: SongPhrase[];
}

// Notas de referencia
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71;
const C5 = 72, D5 = 74, E5 = 76, F5 = 77, G5 = 79, A5 = 81;
const Cs5 = 73, Ds5 = 75, Fs5 = 78, Gs4 = 68, Gs3 = 56, Cs4 = 61, Fs4 = 66;
const A3 = 57, G3 = 55;

export const LIBRARY: LibrarySong[] = [
  {
    id: 'oda-alegria',
    title: 'Oda a la Alegría',
    origin: 'Beethoven — 9.ª sinfonía',
    emoji: '🎼',
    level: 'fácil',
    bpm: 110,
    phrases: [
      {
        name: 'Frase 1',
        notes: [E4, E4, F4, G4, G4, F4, E4, D4, C4, C4, D4, E4, E4, D4, D4],
        durations: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 0.5, 2],
      },
      {
        name: 'Frase 2',
        notes: [E4, E4, F4, G4, G4, F4, E4, D4, C4, C4, D4, E4, D4, C4, C4],
        durations: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 0.5, 2],
      },
      {
        name: 'Puente',
        notes: [D4, D4, E4, C4, D4, E4, F4, E4, C4, D4, E4, F4, E4, D4, C4, D4, G3],
        durations: [1, 1, 1, 1, 1, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 1, 1, 1, 1, 2],
      },
      {
        name: 'Frase final',
        notes: [E4, E4, F4, G4, G4, F4, E4, D4, C4, C4, D4, E4, D4, C4, C4],
        durations: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 0.5, 2],
      },
    ],
  },
  {
    id: 'estrellita',
    title: 'Estrellita',
    origin: 'Tradicional',
    emoji: '⭐',
    level: 'fácil',
    bpm: 100,
    phrases: [
      { name: 'Frase 1', notes: [C4, C4, G4, G4, A4, A4, G4], durations: [1, 1, 1, 1, 1, 1, 2] },
      { name: 'Frase 2', notes: [F4, F4, E4, E4, D4, D4, C4], durations: [1, 1, 1, 1, 1, 1, 2] },
      { name: 'Frase 3', notes: [G4, G4, F4, F4, E4, E4, D4], durations: [1, 1, 1, 1, 1, 1, 2] },
      {
        name: 'Frase 4',
        notes: [C4, C4, G4, G4, A4, A4, G4, F4, F4, E4, E4, D4, D4, C4],
        durations: [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2],
      },
    ],
  },
  {
    id: 'cumpleanos',
    title: 'Cumpleaños feliz',
    origin: 'Tradicional',
    emoji: '🎂',
    level: 'fácil',
    bpm: 125,
    phrases: [
      { name: 'Frase 1', notes: [G4, G4, A4, G4, C5, B4], durations: [0.75, 0.25, 1, 1, 1, 2] },
      { name: 'Frase 2', notes: [G4, G4, A4, G4, D5, C5], durations: [0.75, 0.25, 1, 1, 1, 2] },
      { name: 'Frase 3', notes: [G4, G4, G5, E5, C5, B4, A4], durations: [0.75, 0.25, 1, 1, 1, 1, 2] },
      { name: 'Frase 4', notes: [F5, F5, E5, C5, D5, C5], durations: [0.75, 0.25, 1, 1, 1, 2] },
    ],
  },
  {
    id: 'jingle-bells',
    title: 'Jingle Bells',
    origin: 'J. Pierpont — Tradicional',
    emoji: '🔔',
    level: 'fácil',
    bpm: 130,
    phrases: [
      {
        name: 'Estribillo 1',
        notes: [E4, E4, E4, E4, E4, E4, E4, G4, C4, D4, E4],
        durations: [1, 1, 2, 1, 1, 2, 1, 1, 1.5, 0.5, 4],
      },
      {
        name: 'Estribillo 2',
        notes: [F4, F4, F4, F4, F4, E4, E4, E4, E4, D4, D4, E4, D4, G4],
        durations: [1, 1, 1.5, 0.5, 1, 1, 1, 0.5, 0.5, 1, 1, 1, 2, 2],
      },
    ],
  },
  {
    id: 'amazing-grace',
    title: 'Amazing Grace',
    origin: 'Himno tradicional',
    emoji: '🕊️',
    level: 'fácil',
    bpm: 90,
    phrases: [
      {
        name: 'Frase 1',
        notes: [G4, C5, E5, C5, E5, D5, C5, A4, G4],
        durations: [1, 2, 0.5, 0.5, 2, 1, 2, 1, 3],
      },
      { name: 'Frase 2', notes: [G4, C5, E5, C5, E5, D5, G5], durations: [1, 2, 0.5, 0.5, 2, 1, 3] },
      {
        name: 'Frase 3',
        notes: [E5, G5, E5, C5, G4, A4, C5, C5, A4, G4],
        durations: [1, 1.5, 0.5, 1, 2, 1, 1, 0.5, 0.5, 3],
      },
      { name: 'Frase 4', notes: [G4, C5, E5, C5, E5, D5, C5], durations: [1, 2, 0.5, 0.5, 2, 1, 3] },
    ],
  },
  {
    id: 'greensleeves',
    title: 'Greensleeves',
    origin: 'Tradicional inglesa',
    emoji: '🍃',
    level: 'media',
    bpm: 100,
    phrases: [
      {
        name: 'Frase 1',
        notes: [A4, C5, D5, E5, F5, E5, D5, B4, G4, A4, B4, C5],
        durations: [1, 2, 1, 1.5, 0.5, 1, 2, 1, 1.5, 0.5, 1, 2],
      },
      { name: 'Frase 2', notes: [A4, A4, Gs4, A4, B4, Gs4, E4], durations: [1, 1.5, 0.5, 1, 2, 1, 3] },
      {
        name: 'Frase 3',
        notes: [A4, C5, D5, E5, F5, E5, D5, B4, G4, A4, B4, C5, B4, A4, Gs4, A4],
        durations: [1, 2, 1, 1.5, 0.5, 1, 2, 1, 1.5, 0.5, 1, 2, 1, 1, 1.5, 3],
      },
    ],
  },
  {
    id: 'fur-elise',
    title: 'Para Elisa (Für Elise)',
    origin: 'Beethoven',
    emoji: '🌸',
    level: 'media',
    bpm: 80,
    phrases: [
      {
        name: 'Motivo',
        notes: [E5, Ds5, E5, Ds5, E5, B4, D5, C5, A4],
        durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 2],
      },
      { name: 'Respuesta 1', notes: [C4, E4, A4, B4], durations: [0.5, 0.5, 0.5, 2] },
      { name: 'Respuesta 2', notes: [E4, Gs4, B4, C5], durations: [0.5, 0.5, 0.5, 2] },
      {
        name: 'Motivo completo',
        notes: [E4, E5, Ds5, E5, Ds5, E5, B4, D5, C5, A4],
        durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 2],
      },
    ],
  },
  {
    id: 'canon-pachelbel',
    title: 'Canon en Re',
    origin: 'Pachelbel',
    emoji: '🎻',
    level: 'media',
    bpm: 50,
    phrases: [
      { name: 'Tema 1', notes: [Fs5, E5, D5, Cs5, B4, A4, B4, Cs5], durations: [1, 1, 1, 1, 1, 1, 1, 1] },
      { name: 'Tema 2', notes: [D5, Cs5, B4, A4, G4, Fs4, G4, E4], durations: [1, 1, 1, 1, 1, 1, 1, 1] },
    ],
  },
  {
    id: 'claro-de-luna',
    title: 'Claro de Luna (inicio)',
    origin: 'Beethoven — Sonata n.º 14',
    emoji: '🌙',
    level: 'media',
    bpm: 60,
    phrases: [
      {
        name: 'Arpegio 1 (Do#m)',
        notes: [Gs3, Cs4, E4, Gs3, Cs4, E4, Gs3, Cs4, E4],
        durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
      },
      {
        name: 'Arpegio 2 (La)',
        notes: [A3, Cs4, E4, A3, Cs4, E4, A3, D4, Fs4],
        durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
      },
    ],
  },
  {
    id: 'gymnopedie',
    title: 'Gymnopédie n.º 1',
    origin: 'Erik Satie',
    emoji: '🌫️',
    level: 'difícil',
    bpm: 70,
    phrases: [
      {
        name: 'Melodía A',
        notes: [Fs5, A5, G5, Fs5, Cs5, B4, Cs5, D5, A4],
        durations: [2, 1, 1, 1, 1, 1, 1, 1, 4],
      },
      {
        name: 'Melodía B',
        notes: [Fs5, A5, G5, Fs5, Cs5, B4, Cs5, D5, A4, Cs5, D5, Cs5, B4],
        durations: [2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 4],
      },
    ],
  },
  {
    id: 'interstellar',
    title: 'Interstellar (tema principal)',
    origin: 'Hans Zimmer — fragmento simplificado',
    emoji: '🚀',
    level: 'media',
    bpm: 60,
    isExcerpt: true,
    phrases: [
      {
        name: 'Motivo 1',
        notes: [A4, E5, A4, E5, B4, E5, B4, E5],
        durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
      },
      {
        name: 'Motivo 2',
        notes: [C5, E5, C5, E5, B4, E5, B4, E5],
        durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
      },
      {
        name: 'Motivo completo',
        notes: [A4, E5, B4, E5, C5, E5, B4, E5, A4, E5],
        durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.5],
      },
    ],
  },
  {
    id: 'city-of-stars',
    title: 'City of Stars (La La Land)',
    origin: 'J. Hurwitz — fragmento simplificado',
    emoji: '🌆',
    level: 'media',
    bpm: 90,
    isExcerpt: true,
    phrases: [
      { name: '"City of stars…"', notes: [E4, C5, B4, A4], durations: [1, 1, 1, 3] },
      {
        name: '"…are you shining just for me?"',
        notes: [A4, B4, C5, D5, B4, Gs4, A4],
        durations: [0.5, 0.5, 1, 1, 1, 1, 3],
      },
      {
        name: 'Frase completa',
        notes: [E4, C5, B4, A4, A4, B4, C5, D5, B4, Gs4, A4],
        durations: [1, 1, 1, 2, 0.5, 0.5, 1, 1, 1, 1, 3],
      },
    ],
  },
  {
    id: 'mia-sebastian',
    title: "Mia & Sebastian's Theme (La La Land)",
    origin: 'J. Hurwitz — fragmento simplificado',
    emoji: '🎹',
    level: 'difícil',
    bpm: 66,
    isExcerpt: true,
    phrases: [
      { name: 'Apertura', notes: [C4, G4, C5, E5, D5, C5, G4], durations: [1, 1, 1, 2, 1, 1, 3] },
      {
        name: 'Respuesta',
        notes: [C4, A4, C5, F5, E5, D5, A4, G4],
        durations: [1, 1, 1, 2, 1, 1, 1, 3],
      },
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
