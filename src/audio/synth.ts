// Wrapper de Tone.js para reproducir notas de referencia, acordes, secuencias y el
// clic del metrónomo. Tone requiere iniciarse tras un gesto del usuario (ensureAudio).

import * as Tone from 'tone';
import { midiToFreq } from './noteUtils';

let piano: Tone.PolySynth | null = null;
let metroSynth: Tone.MembraneSynth | null = null;

/**
 * Debe llamarse dentro de un gesto del usuario (click/tap) antes de sonar.
 * IMPORTANTE: comprueba el estado en CADA llamada — en móvil el AudioContext se
 * suspende con frecuencia (pestaña en segundo plano, el SO re-enruta el audio al
 * abrir el micrófono...) y hay que reanudarlo, no solo "iniciarlo una vez".
 */
export async function ensureAudio(): Promise<void> {
  if (Tone.getContext().state !== 'running') {
    try {
      await Tone.start();
    } catch {
      // Sin gesto válido el navegador lo rechaza; el siguiente clic lo reintentará.
    }
  }
  if (!piano) {
    piano = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0.25, release: 1.2 },
      volume: -8,
    }).toDestination();
  }
  if (!metroSynth) {
    metroSynth = new Tone.MembraneSynth({ volume: -6 }).toDestination();
  }
}

/** Toca una nota (MIDI) durante `duration` segundos. */
export async function playMidi(midi: number, duration = 0.6, a4 = 440): Promise<void> {
  await ensureAudio();
  piano!.triggerAttackRelease(midiToFreq(midi, a4), duration);
}

/** Toca un acorde (varias notas MIDI a la vez). */
export async function playChord(midis: number[], duration = 1.2, a4 = 440): Promise<void> {
  await ensureAudio();
  const freqs = midis.map((m) => midiToFreq(m, a4));
  piano!.triggerAttackRelease(freqs, duration);
}

/** Toca una secuencia de notas MIDI espaciadas por `gap` segundos. */
export async function playSequence(midis: number[], gap = 0.5, duration = 0.45, a4 = 440): Promise<void> {
  await ensureAudio();
  const now = Tone.now();
  midis.forEach((m, i) => {
    piano!.triggerAttackRelease(midiToFreq(m, a4), duration, now + i * gap);
  });
}

/** Un clic de metrónomo. `accent` = primer tiempo del compás. */
export async function metronomeClick(accent = false): Promise<void> {
  await ensureAudio();
  metroSynth!.triggerAttackRelease(accent ? 'C3' : 'C2', '16n');
}

/** Detiene cualquier sonido en curso. */
export function stopAll(): void {
  piano?.releaseAll();
}
