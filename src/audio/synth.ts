// Wrapper de Tone.js para reproducir notas de referencia, acordes, secuencias y el
// clic del metrónomo.
//
// Decisiones importantes para móvil:
// - ensureAudio() reanuda el AudioContext SIEMPRE que no esté en 'running' (en móvil
//   se suspende al perder foco, al abrir el micrófono, etc.).
// - Las secuencias se programan con setTimeout de JS, NO en la línea de tiempo del
//   AudioContext: así un nuevo clic CANCELA la secuencia anterior (sin apilar notas
//   → sin "Max polyphony exceeded") y un contexto que se reanuda tarde no dispara
//   decenas de notas de golpe.
// - El AudioContext de Tone se comparte con el micrófono (ver useMicrophone), para
//   que entrada y salida vivan en la misma sesión de audio del sistema.

import * as Tone from 'tone';
import { midiToFreq } from './noteUtils';

let piano: Tone.PolySynth | null = null;
let metroSynth: Tone.MembraneSynth | null = null;

// Temporizadores de la secuencia en curso (para poder cancelarla).
let pendingTimers: ReturnType<typeof setTimeout>[] = [];

/** El AudioContext crudo de Tone — compartido con el micrófono. */
export function getSharedAudioContext(): AudioContext {
  return Tone.getContext().rawContext as AudioContext;
}

/**
 * Debe llamarse dentro de un gesto del usuario (click/tap) antes de sonar.
 * Comprueba el estado en CADA llamada y reanuda si hace falta.
 */
export async function ensureAudio(): Promise<void> {
  if (Tone.getContext().state !== 'running') {
    try {
      await Tone.start();
    } catch {
      // Sin gesto válido el navegador lo rechaza; el siguiente clic lo reintentará.
    }
  }
  // Cinturón y tirantes: algunos navegadores necesitan resume() sobre el contexto crudo.
  const raw = getSharedAudioContext();
  if (raw.state === 'suspended') {
    await raw.resume().catch(() => {});
  }
  if (!piano) {
    piano = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0.25, release: 1.2 },
      volume: -8,
    }).toDestination();
    piano.maxPolyphony = 64;
  }
  if (!metroSynth) {
    metroSynth = new Tone.MembraneSynth({ volume: -6 }).toDestination();
  }
}

/** Cancela cualquier secuencia pendiente y suelta las voces activas. */
export function stopAll(): void {
  for (const t of pendingTimers) clearTimeout(t);
  pendingTimers = [];
  piano?.releaseAll();
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

/**
 * Toca una secuencia de notas MIDI espaciadas por `gap` segundos.
 * Un nuevo playSequence cancela automáticamente la secuencia anterior.
 */
export async function playSequence(midis: number[], gap = 0.5, duration = 0.45, a4 = 440): Promise<void> {
  await ensureAudio();
  stopAll();
  midis.forEach((m, i) => {
    const timer = setTimeout(() => {
      // Si el contexto se suspendió a mitad de secuencia, no disparar en vano.
      if (Tone.getContext().state === 'running') {
        piano!.triggerAttackRelease(midiToFreq(m, a4), duration);
      }
    }, i * gap * 1000);
    pendingTimers.push(timer);
  });
}

/** Un clic de metrónomo. `accent` = primer tiempo del compás. */
export async function metronomeClick(accent = false): Promise<void> {
  await ensureAudio();
  metroSynth!.triggerAttackRelease(accent ? 'C3' : 'C2', '16n');
}
