// Melodías sencillas para las primeras lecciones (mano derecha, en Do central).
// Cada nota es un número MIDI. C4 = 60.

export interface Song {
  id: string;
  title: string;
  hint: string;
  notes: number[];
}

const C4 = 60;
const D4 = 62;
const E4 = 64;
const F4 = 65;
const G4 = 67;
const A4 = 69;
const B4 = 71;
const C5 = 72;

export const SONGS: Song[] = [
  {
    id: 'oda-alegria',
    title: 'Oda a la Alegría (Beethoven)',
    hint: 'Empieza en Mi, todo con la mano derecha.',
    notes: [E4, E4, F4, G4, G4, F4, E4, D4, C4, C4, D4, E4, E4, D4, D4],
  },
  {
    id: 'estrellita',
    title: 'Estrellita / Twinkle Twinkle',
    hint: 'Do Do Sol Sol La La Sol...',
    notes: [C4, C4, G4, G4, A4, A4, G4, F4, F4, E4, E4, D4, D4, C4],
  },
  {
    id: 'mary',
    title: 'Mary tenía un corderito',
    hint: 'Mi Re Do Re Mi Mi Mi...',
    notes: [E4, D4, C4, D4, E4, E4, E4, D4, D4, D4, E4, G4, G4],
  },
  {
    id: 'escala-do',
    title: 'Escala de Do mayor',
    hint: 'Sube y baja: Do Re Mi Fa Sol La Si Do.',
    notes: [C4, D4, E4, F4, G4, A4, B4, C5, B4, A4, G4, F4, E4, D4, C4],
  },
];

export function songById(id: string): Song | undefined {
  return SONGS.find((s) => s.id === id);
}
