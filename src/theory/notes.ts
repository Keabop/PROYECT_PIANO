// Constantes de notas y helpers de rango.
import { midiToName, pitchClassName, type NoteNaming } from '../audio/noteUtils';

export const MIDI_C4 = 60; // Do central
export const MIDI_A4 = 69; // La 440

/** Genera un rango inclusivo de notas MIDI. */
export function midiRange(from: number, to: number): number[] {
  const out: number[] = [];
  for (let m = from; m <= to; m++) out.push(m);
  return out;
}

export function noteLabel(midi: number, naming: NoteNaming = 'es', withOctave = true): string {
  return withOctave ? midiToName(midi, naming) : pitchClassName(midi, naming);
}
