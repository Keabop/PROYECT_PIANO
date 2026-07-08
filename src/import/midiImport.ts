// Importador de archivos MIDI (.mid/.midi) usando @tonejs/midi.
// Extrae la pista más melódica, convierte a tiempos (negras) y arma la canción.

import { Midi } from '@tonejs/midi';
import type { LibrarySong } from '../data/library';
import { buildImportedSong, type RawNote } from './importCore';

export function parseMidiFile(buffer: ArrayBuffer, fileName: string, existingIds: string[]): LibrarySong {
  const midi = new Midi(buffer);
  const bpm = midi.header.tempos[0]?.bpm ?? 100;
  const beatSec = 60 / bpm;

  // Elige la pista con más notas en registro melódico (ignora percusión).
  const tracks = midi.tracks.filter((t) => t.notes.length > 0 && !t.instrument.percussion);
  if (tracks.length === 0) throw new Error('El MIDI no contiene notas.');
  const best = tracks.reduce((a, b) => {
    const score = (t: typeof a) => t.notes.filter((n) => n.midi >= 48 && n.midi <= 96).length;
    return score(b) > score(a) ? b : a;
  });

  // @tonejs/midi da tiempos en segundos según el mapa de tempo: convertir a tiempos.
  const raw: RawNote[] = best.notes.map((n) => ({
    midi: n.midi,
    time: n.time / beatSec,
    duration: Math.max(0.1, n.duration / beatSec),
  }));

  const title = midi.header.name || best.name || fileName.replace(/\.(midi?|mid)$/i, '');
  return buildImportedSong(title, bpm, raw, existingIds);
}
