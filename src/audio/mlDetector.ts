// Motor de detección ML: Basic Pitch (Spotify) sobre TensorFlow.js, corriendo
// íntegramente en el navegador. Se carga de forma perezosa (dynamic import) para no
// meter TF.js (~1.3 MB gz) en el bundle principal. El modelo se sirve desde
// /models/basic-pitch/ (copiado del paquete npm, licencia Apache-2.0).
//
// Basic Pitch espera audio MONO a 22050 Hz; expone evaluateModel(Float32Array, ...)
// y outputToNotesPoly(frames, onsets, ...) -> NoteEvent[]{ pitchMidi, ... }.

import type { ActiveNote } from './polyphonicDetector';

export const ML_SAMPLE_RATE = 22050;

export type MLStatus = 'idle' | 'loading' | 'ready' | 'error';

type BasicPitchModule = typeof import('@spotify/basic-pitch');

interface MLEngine {
  bp: InstanceType<BasicPitchModule['BasicPitch']>;
  mod: BasicPitchModule;
}

let engine: MLEngine | null = null;
let loadPromise: Promise<MLEngine> | null = null;
let status: MLStatus = 'idle';
const statusListeners = new Set<(s: MLStatus) => void>();

function setStatus(s: MLStatus) {
  status = s;
  statusListeners.forEach((fn) => fn(s));
}

export function getMLStatus(): MLStatus {
  return status;
}

export function onMLStatus(fn: (s: MLStatus) => void): () => void {
  statusListeners.add(fn);
  return () => statusListeners.delete(fn);
}

/** Carga (una sola vez) TF.js + Basic Pitch + el modelo local. */
export function loadML(): Promise<MLEngine> {
  if (engine) return Promise.resolve(engine);
  if (loadPromise) return loadPromise;
  setStatus('loading');
  loadPromise = (async () => {
    const mod = await import('@spotify/basic-pitch');
    const base = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
    const modelUrl = `${base}models/basic-pitch/model.json`;
    const bp = new mod.BasicPitch(modelUrl);
    await bp.model; // fuerza la descarga/compilación del modelo ya
    engine = { bp, mod };
    setStatus('ready');
    return engine;
  })().catch((err) => {
    loadPromise = null;
    setStatus('error');
    throw err;
  });
  return loadPromise;
}

/**
 * Remuestreo lineal a 22050 Hz (mono). Puro y testeable.
 */
export function resampleTo22050(buf: Float32Array, fromRate: number): Float32Array {
  if (fromRate === ML_SAMPLE_RATE) return Float32Array.from(buf);
  const ratio = fromRate / ML_SAMPLE_RATE;
  const outLen = Math.max(1, Math.floor(buf.length / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, buf.length - 1);
    const frac = pos - i0;
    out[i] = buf[i0] * (1 - frac) + buf[i1] * frac;
  }
  return out;
}

let busy = false;

/**
 * Detecta las notas presentes en una ventana de audio a 22050 Hz usando Basic Pitch.
 * Devuelve el mismo tipo ActiveNote que el detector estándar (drop-in).
 * Si hay una inferencia en curso, devuelve null (el llamador conserva el estado anterior).
 */
export async function detectNotesML(window22k: Float32Array): Promise<ActiveNote[] | null> {
  if (busy) return null;
  busy = true;
  try {
    const { bp, mod } = await loadML();

    // Puerta de silencio, coherente con los otros detectores.
    let rms = 0;
    for (let i = 0; i < window22k.length; i++) rms += window22k[i] * window22k[i];
    rms = Math.sqrt(rms / window22k.length);
    if (rms < 0.004) return [];

    const frames: number[][] = [];
    const onsets: number[][] = [];
    await bp.evaluateModel(
      window22k,
      (f, o) => {
        frames.push(...f);
        onsets.push(...o);
      },
      () => {}
    );

    // Umbrales suaves: la ventana es corta y nos interesa "qué suena", no una
    // transcripción perfecta. minNoteLen bajo para captar notas recién pulsadas.
    const events = mod.noteFramesToTime(
      mod.outputToNotesPoly(frames, onsets, 0.4, 0.25, 5)
    );

    // Nos quedamos con las notas que siguen sonando hacia el final de la ventana
    // (activas "ahora"), no las que ya terminaron hace rato.
    const windowSec = window22k.length / ML_SAMPLE_RATE;
    const cutoff = Math.max(0, windowSec - 0.9);
    const byMidi = new Map<number, number>();
    for (const ev of events) {
      const end = ev.startTimeSeconds + ev.durationSeconds;
      if (end >= cutoff) {
        byMidi.set(ev.pitchMidi, Math.max(byMidi.get(ev.pitchMidi) ?? 0, ev.amplitude));
      }
    }
    return [...byMidi.entries()]
      .map(([midi, salience]) => ({ midi, salience }))
      .sort((a, b) => a.midi - b.midi);
  } finally {
    busy = false;
  }
}
