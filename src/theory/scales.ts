// Definiciones de escalas: patrones de intervalos en semitonos desde la tónica.

export interface ScaleType {
  id: string;
  name: string; // en español
  intervals: number[]; // semitonos acumulados desde la tónica (incluye la octava final)
}

export const SCALE_TYPES: Record<string, ScaleType> = {
  major: { id: 'major', name: 'Mayor', intervals: [0, 2, 4, 5, 7, 9, 11, 12] },
  naturalMinor: { id: 'naturalMinor', name: 'Menor natural', intervals: [0, 2, 3, 5, 7, 8, 10, 12] },
  harmonicMinor: { id: 'harmonicMinor', name: 'Menor armónica', intervals: [0, 2, 3, 5, 7, 8, 11, 12] },
  melodicMinor: { id: 'melodicMinor', name: 'Menor melódica', intervals: [0, 2, 3, 5, 7, 9, 11, 12] },
  pentatonicMajor: { id: 'pentatonicMajor', name: 'Pentatónica mayor', intervals: [0, 2, 4, 7, 9, 12] },
  chromatic: {
    id: 'chromatic',
    name: 'Cromática',
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },
};

/** Devuelve las notas MIDI de una escala a partir de una tónica. */
export function buildScale(rootMidi: number, type: keyof typeof SCALE_TYPES | ScaleType): number[] {
  const t = typeof type === 'string' ? SCALE_TYPES[type] : type;
  return t.intervals.map((i) => rootMidi + i);
}

// Digitaciones de referencia (mano derecha) para escalas mayores comunes (una octava).
// Números de dedo: 1 = pulgar ... 5 = meñique.
export const MAJOR_SCALE_FINGERING_RH: Record<string, number[]> = {
  C: [1, 2, 3, 1, 2, 3, 4, 5],
  G: [1, 2, 3, 1, 2, 3, 4, 5],
  F: [1, 2, 3, 4, 1, 2, 3, 4], // el pulgar pasa distinto por el Si bemol
  D: [1, 2, 3, 1, 2, 3, 4, 5],
};
