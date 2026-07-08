// Utilidades de conversión entre frecuencia (Hz), nota MIDI y nombre de nota.
// Referencia estándar: A4 (La4) = MIDI 69 = 440 Hz (configurable).

export const DEFAULT_A4 = 440;

// Nombres anglosajones e "hispanos/latinos" (solfeo) por clase de altura (0 = Do/C).
export const NOTE_NAMES_EN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTE_NAMES_ES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
export const NOTE_NAMES_ES_FLAT = ['Do', 'Reb', 'Re', 'Mib', 'Mi', 'Fa', 'Solb', 'Sol', 'Lab', 'La', 'Sib', 'Si'];

export type NoteNaming = 'es' | 'en';

/** Frecuencia (Hz) -> número de nota MIDI (decimal). */
export function freqToMidi(freq: number, a4 = DEFAULT_A4): number {
  return 69 + 12 * Math.log2(freq / a4);
}

/** Número de nota MIDI -> frecuencia (Hz). */
export function midiToFreq(midi: number, a4 = DEFAULT_A4): number {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

/** Frecuencia (Hz) -> nota MIDI redondeada a la más cercana. */
export function freqToNearestMidi(freq: number, a4 = DEFAULT_A4): number {
  return Math.round(freqToMidi(freq, a4));
}

/** Clase de altura (0-11) de una nota MIDI. 0 = Do/C. */
export function pitchClass(midi: number): number {
  return ((Math.round(midi) % 12) + 12) % 12;
}

/** Octava científica de una nota MIDI (C4 = MIDI 60 -> octava 4). */
export function octaveOf(midi: number): number {
  return Math.floor(Math.round(midi) / 12) - 1;
}

/** Nombre de la nota, p. ej. "Do4" o "C4". */
export function midiToName(midi: number, naming: NoteNaming = 'es'): string {
  const m = Math.round(midi);
  const names = naming === 'es' ? NOTE_NAMES_ES : NOTE_NAMES_EN;
  return `${names[pitchClass(m)]}${octaveOf(m)}`;
}

/** Solo el nombre de la clase de altura, sin octava (p. ej. "Do", "Do#"). */
export function pitchClassName(midi: number, naming: NoteNaming = 'es'): string {
  const names = naming === 'es' ? NOTE_NAMES_ES : NOTE_NAMES_EN;
  return names[pitchClass(midi)];
}

/**
 * Desviación en cents de una frecuencia respecto a la nota MIDI más cercana.
 * Rango típico [-50, +50]. 0 = perfectamente afinado.
 */
export function centsOff(freq: number, a4 = DEFAULT_A4): number {
  const midi = freqToMidi(freq, a4);
  const nearest = Math.round(midi);
  return (midi - nearest) * 100;
}

/** Convierte un nombre tipo "C4" / "Do4" / "Do#3" / "Reb4" a nota MIDI. */
export function nameToMidi(name: string): number | null {
  const match = name.trim().match(/^([A-Ga-g]#?b?|[A-Za-z]+#?b?)(-?\d+)$/);
  if (!match) return null;
  const [, rawNote, octaveStr] = match;
  const note = rawNote.charAt(0).toUpperCase() + rawNote.slice(1);
  let pc = NOTE_NAMES_EN.indexOf(note);
  if (pc < 0) pc = NOTE_NAMES_ES.indexOf(note);
  if (pc < 0) pc = NOTE_NAMES_ES_FLAT.indexOf(note);
  if (pc < 0) return null;
  const octave = parseInt(octaveStr, 10);
  return (octave + 1) * 12 + pc;
}

/** ¿Es una tecla negra (sostenido/bemol)? */
export function isBlackKey(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(pitchClass(midi));
}
