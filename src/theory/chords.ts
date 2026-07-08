// Definiciones de acordes: intervalos en semitonos desde la fundamental.

export interface ChordType {
  id: string;
  name: string; // español
  symbol: string; // sufijo (p. ej. "m", "7")
  intervals: number[];
}

export const CHORD_TYPES: Record<string, ChordType> = {
  major: { id: 'major', name: 'Mayor', symbol: '', intervals: [0, 4, 7] },
  minor: { id: 'minor', name: 'Menor', symbol: 'm', intervals: [0, 3, 7] },
  diminished: { id: 'diminished', name: 'Disminuido', symbol: 'dim', intervals: [0, 3, 6] },
  augmented: { id: 'augmented', name: 'Aumentado', symbol: 'aug', intervals: [0, 4, 8] },
  dominant7: { id: 'dominant7', name: 'Séptima dominante', symbol: '7', intervals: [0, 4, 7, 10] },
  major7: { id: 'major7', name: 'Séptima mayor', symbol: 'maj7', intervals: [0, 4, 7, 11] },
  minor7: { id: 'minor7', name: 'Séptima menor', symbol: 'm7', intervals: [0, 3, 7, 10] },
};

/** Construye las notas MIDI de un acorde. */
export function buildChord(
  rootMidi: number,
  type: keyof typeof CHORD_TYPES | ChordType,
  inversion = 0
): number[] {
  const t = typeof type === 'string' ? CHORD_TYPES[type] : type;
  let notes = t.intervals.map((i) => rootMidi + i);
  // Inversiones: sube la nota más grave una octava, tantas veces como la inversión.
  for (let inv = 0; inv < inversion; inv++) {
    const low = notes.shift()!;
    notes.push(low + 12);
  }
  return notes;
}

/** Tríadas mayores/menores de referencia por grado en una tonalidad mayor (I..vii). */
export const MAJOR_KEY_TRIADS: { degree: string; type: keyof typeof CHORD_TYPES }[] = [
  { degree: 'I', type: 'major' },
  { degree: 'ii', type: 'minor' },
  { degree: 'iii', type: 'minor' },
  { degree: 'IV', type: 'major' },
  { degree: 'V', type: 'major' },
  { degree: 'vi', type: 'minor' },
  { degree: 'vii°', type: 'diminished' },
];
