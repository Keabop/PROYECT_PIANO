// Núcleo del importador de partituras: convierte una lista cruda de notas
// { midi, timeBeats, durBeats } en una canción de la biblioteca (frases con
// notes/durations/offsets). Lógica pura y testeable, común a MIDI y MusicXML.

import type { LibrarySong, SongPhrase } from '../data/library';

export interface RawNote {
  midi: number;
  /** inicio en tiempos (negras) desde el comienzo de la pieza */
  time: number;
  /** duración en tiempos */
  duration: number;
}

/**
 * Reducción a melodía (la app es de una sola voz): si varias notas suenan a la vez
 * (acorde o varias voces), se queda con la MÁS AGUDA — la línea superior, que es la
 * melodía en la gran mayoría de partituras.
 */
export function reduceToMelody(notes: RawNote[]): RawNote[] {
  const sorted = [...notes].sort((a, b) => a.time - b.time || b.midi - a.midi);
  const EPS = 0.08; // notas que empiezan "a la vez" (tolerancia de cuantización)

  // 1) Agrupa por pulsación (notas que empiezan casi juntas = acorde/varias voces).
  const clusters: RawNote[][] = [];
  for (const n of sorted) {
    const current = clusters[clusters.length - 1];
    if (current && n.time - current[0].time < EPS) current.push(n);
    else clusters.push([n]);
  }

  // 2) De cada pulsación, la nota MÁS AGUDA (la línea superior = melodía).
  const out: RawNote[] = [];
  for (const cluster of clusters) {
    const top = cluster.reduce((a, b) => (b.midi > a.midi ? b : a));
    const last = out[out.length - 1];
    if (last && top.time < last.time + last.duration) {
      // La anterior solapa (nota larga de otra voz): se recorta hasta aquí.
      last.duration = Math.max(0.125, top.time - last.time);
    }
    out.push({ ...top });
  }
  return out;
}

/**
 * Lleva la melodía a un registro cómodo (C3..C6 aprox) desplazando OCTAVAS enteras
 * (nunca notas sueltas: se preserva el contorno). Después recorta casos extremos.
 */
export function normalizeOctave(notes: RawNote[]): RawNote[] {
  if (notes.length === 0) return notes;
  const midis = notes.map((n) => n.midi).sort((a, b) => a - b);
  const median = midis[Math.floor(midis.length / 2)];
  let shift = 0;
  while (median + shift > 79) shift -= 12; // por encima de Sol5: baja
  while (median + shift < 55) shift += 12; // por debajo de Sol3: sube
  return notes.map((n) => {
    let m = n.midi + shift;
    while (m > 96) m -= 12;
    while (m < 36) m += 12;
    return { ...n, midi: m };
  });
}

/** Cuantiza a dieciseisavos para ritmos legibles. */
function quant(v: number): number {
  return Math.round(v * 4) / 4;
}

/**
 * Divide la melodía en frases: corta en silencios largos (≥ 2 tiempos) o cuando la
 * frase alcanza ~16 tiempos, sin frases menores de 4 notas (se fusionan con la anterior).
 */
export function segmentPhrases(notes: RawNote[], maxBeats = 16, restCut = 2, minNotes = 4): SongPhrase[] {
  if (notes.length === 0) return [];
  const groups: RawNote[][] = [[]];
  let phraseStart = notes[0].time;
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i];
    const prev = notes[i - 1];
    const gap = prev ? n.time - (prev.time + prev.duration) : 0;
    const current = groups[groups.length - 1];
    if (current.length > 0 && (gap >= restCut || n.time - phraseStart >= maxBeats)) {
      groups.push([]);
      phraseStart = n.time;
    }
    groups[groups.length - 1].push(n);
  }
  // Fusiona frases demasiado cortas con la anterior.
  const merged: RawNote[][] = [];
  for (const g of groups) {
    if (merged.length > 0 && g.length < minNotes) merged[merged.length - 1].push(...g);
    else merged.push(g);
  }

  return merged.map((g, idx) => {
    const start = g[0].time;
    return {
      name: `Frase ${idx + 1}`,
      notes: g.map((n) => n.midi),
      durations: g.map((n) => Math.max(0.25, Math.min(4, quant(n.duration) || 0.5))),
      offsets: g.map((n) => Math.max(0, quant(n.time - start))),
    };
  });
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'partitura'
  );
}

/** Ensambla la canción final a partir de la melodía ya extraída. */
export function buildImportedSong(title: string, bpm: number, rawNotes: RawNote[], existingIds: string[]): LibrarySong {
  const melody = normalizeOctave(reduceToMelody(rawNotes));
  const phrases = segmentPhrases(melody);
  const totalNotes = melody.length;
  const level = totalNotes <= 40 && bpm <= 105 ? 'fácil' : totalNotes > 120 || bpm >= 140 ? 'difícil' : 'media';

  let id = `imp-${slugify(title)}`;
  let n = 2;
  while (existingIds.includes(id)) id = `imp-${slugify(title)}-${n++}`;

  return {
    id,
    title: title || 'Partitura importada',
    origin: 'Importada por ti',
    emoji: '📄',
    category: 'importada',
    level,
    bpm: Math.round(Math.min(200, Math.max(40, bpm))),
    isExcerpt: true,
    phrases,
  };
}
