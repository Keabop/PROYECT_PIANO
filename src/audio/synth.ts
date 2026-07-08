// Motor de sonido de la app.
//
// Instrumento principal: Tone.Sampler con muestras REALES del Salamander Grand Piano
// (Yamaha C5, CC BY 3.0, ver public/samples/piano/README.md) — una muestra cada
// tercera menor entre C2 y C7; el resto se interpola por pitch-shifting. Mientras las
// muestras cargan (~1.4 MB, perezoso) suena un sintetizador de respaldo, y se cambia
// automáticamente al piano real en cuanto está listo. Una reverberación corta de sala
// da el aire acústico.
//
// Decisiones importantes para móvil:
// - ensureAudio() reanuda el AudioContext SIEMPRE que no esté en 'running'.
// - Las secuencias se programan con setTimeout de JS: un nuevo clic cancela la
//   anterior (sin apilar voces) y un contexto reanudado tarde no dispara ráfagas.
// - El AudioContext de Tone se comparte con el micrófono (ver useMicrophone).

import * as Tone from 'tone';
import { midiToFreq } from './noteUtils';

let sampler: Tone.Sampler | null = null;
let samplerReady = false;
let fallback: Tone.PolySynth | null = null;
let metroSynth: Tone.MembraneSynth | null = null;
let reverb: Tone.Reverb | null = null;

// Temporizadores de la secuencia en curso (para poder cancelarla).
let pendingTimers: ReturnType<typeof setTimeout>[] = [];

/** El AudioContext crudo de Tone — compartido con el micrófono. */
export function getSharedAudioContext(): AudioContext {
  return Tone.getContext().rawContext as AudioContext;
}

// Muestras disponibles (cada tercera menor, C2..C7). "Ds" = D#, "Fs" = F#.
const SAMPLE_URLS: Record<string, string> = {
  C2: 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3', A2: 'A2.mp3',
  C3: 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3', A3: 'A3.mp3',
  C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3', A4: 'A4.mp3',
  C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3', A5: 'A5.mp3',
  C6: 'C6.mp3', 'D#6': 'Ds6.mp3', 'F#6': 'Fs6.mp3', A6: 'A6.mp3',
  C7: 'C7.mp3',
};

function setupInstruments(): void {
  if (!reverb) {
    // Sala pequeña y discreta: da cuerpo sin emborronar.
    reverb = new Tone.Reverb({ decay: 1.9, preDelay: 0.02, wet: 0.16 }).toDestination();
  }
  if (!fallback) {
    fallback = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0.25, release: 1.2 },
      volume: -10,
    }).connect(reverb);
    fallback.maxPolyphony = 64;
  }
  if (!sampler) {
    const base = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
    sampler = new Tone.Sampler({
      urls: SAMPLE_URLS,
      baseUrl: `${base}samples/piano/`,
      release: 1.4,
      volume: -1,
      onload: () => {
        samplerReady = true;
      },
      onerror: () => {
        // Sin red o muestras corruptas: seguimos con el sintetizador de respaldo.
        samplerReady = false;
      },
    }).connect(reverb);
  }
  if (!metroSynth) {
    metroSynth = new Tone.MembraneSynth({ volume: -6 }).toDestination();
  }
}

/** Instrumento activo: piano muestreado si ya cargó, si no el de respaldo. */
function instrument(): Tone.Sampler | Tone.PolySynth {
  return samplerReady && sampler ? sampler : fallback!;
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
  setupInstruments();
}

/** Cancela cualquier secuencia pendiente y suelta las voces activas. */
export function stopAll(): void {
  for (const t of pendingTimers) clearTimeout(t);
  pendingTimers = [];
  sampler?.releaseAll();
  fallback?.releaseAll();
}

/** Velocidad "humana": pequeña variación para que no suene mecánico. */
function humanVelocity(): number {
  return 0.72 + Math.random() * 0.18;
}

/** Toca una nota (MIDI) durante `duration` segundos. */
export async function playMidi(midi: number, duration = 0.6, a4 = 440): Promise<void> {
  await ensureAudio();
  instrument().triggerAttackRelease(midiToFreq(midi, a4), duration, Tone.now(), humanVelocity());
}

/**
 * Toca un acorde (varias notas MIDI a la vez), con un micro-arpegiado de unos pocos
 * milisegundos como el de un pianista real (dos manos nunca son exactas al 100%).
 */
export async function playChord(midis: number[], duration = 1.2, a4 = 440): Promise<void> {
  await ensureAudio();
  const now = Tone.now();
  const inst = instrument();
  midis.forEach((m, i) => {
    inst.triggerAttackRelease(midiToFreq(m, a4), duration, now + i * 0.008, humanVelocity());
  });
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
        instrument().triggerAttackRelease(midiToFreq(m, a4), duration, Tone.now(), humanVelocity());
      }
    }, i * gap * 1000);
    pendingTimers.push(timer);
  });
}

/**
 * Toca una secuencia con RITMO: cada nota tiene su propia duración en segundos.
 * La siguiente nota empieza cuando termina la anterior (legato natural del sampler).
 * Un nuevo playTimedSequence cancela la secuencia anterior.
 */
export async function playTimedSequence(midis: number[], durationsSec: number[], a4 = 440): Promise<void> {
  await ensureAudio();
  stopAll();
  let t = 0;
  midis.forEach((m, i) => {
    const dur = durationsSec[i] ?? 0.5;
    const timer = setTimeout(() => {
      if (Tone.getContext().state === 'running') {
        instrument().triggerAttackRelease(midiToFreq(m, a4), dur * 0.95, Tone.now(), humanVelocity());
      }
    }, t * 1000);
    pendingTimers.push(timer);
    t += dur;
  });
}

/** Un clic de metrónomo. `accent` = primer tiempo del compás. */
export async function metronomeClick(accent = false): Promise<void> {
  await ensureAudio();
  metroSynth!.triggerAttackRelease(accent ? 'C3' : 'C2', '16n');
}
