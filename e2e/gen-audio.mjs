// Generador de WAVs de prueba con tonos tipo piano (fundamental + armónicos +
// envolvente de decaimiento). Estos archivos se inyectan como "micrófono" en Chromium
// (--use-file-for-fake-audio-capture) para verificar el pipeline completo de detección
// con audio real, sin necesidad de un piano físico.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 44100;
const DIR = join(dirname(fileURLToPath(import.meta.url)), 'audio');

/** MIDI -> Hz (A4 = 440). */
const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

/** Tono tipo piano: 4 armónicos con decaimiento exponencial y ataque corto. */
function pianoTone(freq, seconds, amp = 0.5) {
  const n = Math.floor(seconds * SR);
  const out = new Float32Array(n);
  const partials = [
    [1, 1.0],
    [2, 0.45],
    [3, 0.2],
    [4, 0.1],
  ];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const attack = Math.min(1, t / 0.012);
    const decay = Math.exp(-t * 1.6);
    let s = 0;
    for (const [h, a] of partials) s += a * Math.sin(2 * Math.PI * freq * h * t);
    out[i] = amp * attack * decay * s * 0.55;
  }
  return out;
}

function silence(seconds) {
  return new Float32Array(Math.floor(seconds * SR));
}

function concat(chunks) {
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Float32Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

/** Mezcla varias señales (mismo largo o menor) sumándolas. */
function mix(signals) {
  const len = Math.max(...signals.map((s) => s.length));
  const out = new Float32Array(len);
  for (const s of signals) for (let i = 0; i < s.length; i++) out[i] += s[i];
  return out;
}

/** Secuencia de notas MIDI con silencios entre ellas (necesarios para el "release"). */
function melody(midis, noteSec = 0.75, gapSec = 0.4) {
  const chunks = [silence(0.6)];
  for (const m of midis) {
    chunks.push(pianoTone(midiToFreq(m), noteSec));
    chunks.push(silence(gapSec));
  }
  chunks.push(silence(0.5));
  return concat(chunks);
}

/** WAV PCM 16-bit mono. */
function toWav(samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  return buf;
}

export function generateAll() {
  mkdirSync(DIR, { recursive: true });

  // 1. Un Do central (C4) repetido — para el ejercicio "toca un Do".
  writeFileSync(join(DIR, 'nota-do.wav'), toWav(melody([60, 60, 60], 0.8, 0.45)));

  // 2. Primera frase de la Oda a la Alegría — para la canción por frases.
  const oda = [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62];
  writeFileSync(join(DIR, 'oda.wav'), toWav(melody(oda, 0.62, 0.38)));

  // 3. Acorde de Do mayor (C4+E4+G4 SIMULTÁNEAS), sostenido — para acordes.
  const chord = concat([
    silence(0.6),
    mix([60, 64, 67].map((m) => pianoTone(midiToFreq(m), 2.6, 0.34))),
    silence(0.5),
  ]);
  writeFileSync(join(DIR, 'acorde-do.wav'), toWav(chord));

  return DIR;
}

// Ejecutable directamente: node e2e/gen-audio.mjs
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('WAVs generados en', generateAll());
}
