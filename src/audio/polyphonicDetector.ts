// Detección de tono POLIFÓNICA (varias notas simultáneas, p. ej. acordes).
// Método: espectro por FFT + saliencia armónica por nota candidata + resta iterativa.
// Devuelve el conjunto de notas activas. No pretende ser una transcripción perfecta;
// para validar ejercicios se combina con "template matching" contra el acorde objetivo
// (ver matchChord más abajo), lo que la hace fiable cuando el objetivo se conoce.

import { magnitudeSpectrum } from './fft';
import { midiToFreq } from './noteUtils';

export interface ActiveNote {
  midi: number;
  salience: number; // energía armónica relativa
}

export interface PolyOptions {
  fftSize?: number;
  minMidi?: number; // C2 = 36
  maxMidi?: number; // C7 = 96
  numHarmonics?: number;
  maxNotes?: number;
  /** Umbral de saliencia relativo al máximo (0..1) para aceptar una nota. */
  relThreshold?: number;
  a4?: number;
}

const DEFAULTS: Required<Omit<PolyOptions, 'a4'>> = {
  fftSize: 16384,
  minMidi: 36,
  maxMidi: 96,
  numHarmonics: 8,
  maxNotes: 6,
  relThreshold: 0.22,
};

/** Magnitud interpolada del espectro en una frecuencia arbitraria (Hz). */
function magAt(mag: Float32Array, freq: number, binRes: number): { value: number; bin: number } {
  const pos = freq / binRes;
  const bin = Math.round(pos);
  if (bin < 1 || bin >= mag.length - 1) return { value: 0, bin };
  // Toma el máximo de una pequeña ventana para tolerar inarmonicidad del piano.
  let best = mag[bin];
  let bestBin = bin;
  for (let d = -1; d <= 1; d++) {
    if (mag[bin + d] > best) {
      best = mag[bin + d];
      bestBin = bin + d;
    }
  }
  return { value: best, bin: bestBin };
}

/** Saliencia armónica de una nota: suma ponderada de sus armónicos. */
function harmonicSalience(
  mag: Float32Array,
  f0: number,
  binRes: number,
  numHarmonics: number
): number {
  let sum = 0;
  for (let h = 1; h <= numHarmonics; h++) {
    const { value } = magAt(mag, f0 * h, binRes);
    sum += value / h; // pondera menos los armónicos altos
  }
  return sum;
}

/**
 * Detecta las notas activas en un buffer de dominio del tiempo.
 */
export function detectPolyphony(
  buffer: Float32Array,
  sampleRate: number,
  opts: PolyOptions = {}
): ActiveNote[] {
  const cfg = { ...DEFAULTS, ...opts };
  const a4 = opts.a4 ?? 440;

  // Puerta de volumen (silencio -> nada)
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.006) return [];

  const mag = magnitudeSpectrum(buffer, cfg.fftSize).slice(); // copia mutable
  const binRes = sampleRate / cfg.fftSize;

  // Saliencia inicial de cada nota candidata.
  const candidates: { midi: number; f0: number }[] = [];
  for (let m = cfg.minMidi; m <= cfg.maxMidi; m++) {
    candidates.push({ midi: m, f0: midiToFreq(m, a4) });
  }

  const detected: ActiveNote[] = [];
  let firstSalience = 0;

  for (let iter = 0; iter < cfg.maxNotes; iter++) {
    // Encuentra la nota con mayor saliencia actual.
    let bestMidi = -1;
    let bestSal = 0;
    let bestF0 = 0;
    for (const c of candidates) {
      if (detected.some((d) => d.midi === c.midi)) continue;
      const sal = harmonicSalience(mag, c.f0, binRes, cfg.numHarmonics);
      if (sal > bestSal) {
        bestSal = sal;
        bestMidi = c.midi;
        bestF0 = c.f0;
      }
    }
    if (bestMidi < 0) break;
    if (iter === 0) firstSalience = bestSal;

    // Umbral relativo respecto a la nota más fuerte.
    if (bestSal < cfg.relThreshold * firstSalience || bestSal <= 0) break;

    detected.push({ midi: bestMidi, salience: bestSal });

    // Resta la energía armónica de la nota elegida para evitar dobles/octavas fantasma.
    for (let h = 1; h <= cfg.numHarmonics; h++) {
      const { bin } = magAt(mag, bestF0 * h, binRes);
      for (let d = -1; d <= 1; d++) {
        const b = bin + d;
        if (b >= 0 && b < mag.length) mag[b] *= 0.15;
      }
    }
  }

  return detected.sort((a, b) => a.midi - b.midi);
}

/**
 * Compara las notas detectadas con un acorde objetivo (template matching).
 * La comparación se hace por clase de altura (ignora octava) para tolerar el registro.
 * @returns qué notas del objetivo están presentes y cuáles faltan/sobran.
 */
export function matchChord(
  detected: ActiveNote[],
  targetMidis: number[]
): { matched: number[]; missing: number[]; extra: number[]; complete: boolean } {
  const pc = (m: number) => ((m % 12) + 12) % 12;
  const targetPcs = new Set(targetMidis.map(pc));
  const detectedPcs = new Set(detected.map((d) => pc(d.midi)));

  const matched = [...targetPcs].filter((p) => detectedPcs.has(p));
  const missing = [...targetPcs].filter((p) => !detectedPcs.has(p));
  const extra = [...detectedPcs].filter((p) => !targetPcs.has(p));

  return {
    matched,
    missing,
    extra,
    // "completo" = todas las notas del objetivo presentes y como mucho 1 extra tolerada.
    complete: missing.length === 0 && extra.length <= 1,
  };
}
