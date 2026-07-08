// Importador de MusicXML (.musicxml/.xml y .mxl comprimido).
// Lee la primera parte, voz superior: pitch (step/alter/octave), duraciones por
// <divisions>, silencios, ligaduras (tie) y acordes (<chord/> se ignora: nos
// quedamos con la primera nota de cada pulsación, que MusicXML lista primero).

import type { LibrarySong } from '../data/library';
import { buildImportedSong, type RawNote } from './importCore';

const STEP_TO_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export async function parseMusicXmlFile(
  buffer: ArrayBuffer,
  fileName: string,
  existingIds: string[]
): Promise<LibrarySong> {
  let xmlText: string;
  if (fileName.toLowerCase().endsWith('.mxl')) {
    // .mxl = zip: el archivo raíz está declarado en META-INF/container.xml
    const { default: JSZip } = await import('jszip');
    const zip = await JSZip.loadAsync(buffer);
    const container = await zip.file('META-INF/container.xml')?.async('string');
    let rootPath = container?.match(/full-path="([^"]+)"/)?.[1];
    if (!rootPath || !zip.file(rootPath)) {
      rootPath = Object.keys(zip.files).find((f) => f.endsWith('.xml') && !f.startsWith('META-INF'));
    }
    if (!rootPath) throw new Error('El .mxl no contiene una partitura.');
    xmlText = await zip.file(rootPath)!.async('string');
  } else {
    xmlText = new TextDecoder().decode(buffer);
  }

  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('El archivo no es un MusicXML válido.');

  const title =
    doc.querySelector('work > work-title')?.textContent?.trim() ||
    doc.querySelector('movement-title')?.textContent?.trim() ||
    fileName.replace(/\.(musicxml|xml|mxl)$/i, '');

  const bpm = Number(doc.querySelector('sound[tempo]')?.getAttribute('tempo')) || 90;

  const part = doc.querySelector('part');
  if (!part) throw new Error('El MusicXML no tiene partes.');

  let divisions = 1; // corcheas por negra según <divisions>
  let time = 0; // en tiempos (negras)
  const raw: RawNote[] = [];
  let pendingTieStart: RawNote | null = null;

  for (const measure of Array.from(part.querySelectorAll('measure'))) {
    const div = measure.querySelector('attributes > divisions');
    if (div) divisions = Number(div.textContent) || divisions;

    for (const el of Array.from(measure.children)) {
      if (el.tagName === 'backup') {
        time -= Number(el.querySelector('duration')?.textContent ?? 0) / divisions;
      } else if (el.tagName === 'forward') {
        time += Number(el.querySelector('duration')?.textContent ?? 0) / divisions;
      } else if (el.tagName === 'note') {
        const durBeats = Number(el.querySelector('duration')?.textContent ?? 0) / divisions;
        const isChordExtra = !!el.querySelector('chord'); // notas extra del acorde: no avanzan tiempo
        const voice = el.querySelector('voice')?.textContent ?? '1';
        if (isChordExtra) continue;
        if (voice !== '1') {
          // Otras voces (mano izquierda en la misma parte): se ignoran; el tiempo de la
          // voz 1 lo gobiernan sus propias notas + backup/forward.
          time += durBeats;
          continue;
        }
        if (el.querySelector('rest')) {
          time += durBeats;
          pendingTieStart = null;
          continue;
        }
        const step = el.querySelector('pitch > step')?.textContent;
        const octave = Number(el.querySelector('pitch > octave')?.textContent);
        const alter = Number(el.querySelector('pitch > alter')?.textContent ?? 0);
        if (step && Number.isFinite(octave)) {
          const midi = (octave + 1) * 12 + STEP_TO_PC[step] + alter;
          const tieStop = Array.from(el.querySelectorAll('tie')).some((t) => t.getAttribute('type') === 'stop');
          const tieStart = Array.from(el.querySelectorAll('tie')).some((t) => t.getAttribute('type') === 'start');
          if (tieStop && pendingTieStart && pendingTieStart.midi === midi) {
            pendingTieStart.duration += durBeats; // extiende la nota ligada
            if (!tieStart) pendingTieStart = null;
          } else {
            const note: RawNote = { midi, time, duration: Math.max(0.1, durBeats) };
            raw.push(note);
            pendingTieStart = tieStart ? note : null;
          }
        }
        time += durBeats;
      }
    }
  }

  if (raw.length === 0) throw new Error('No se encontraron notas en la voz principal.');
  return buildImportedSong(title, bpm, raw, existingIds);
}
