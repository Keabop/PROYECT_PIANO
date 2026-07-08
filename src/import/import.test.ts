// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { Midi } from '@tonejs/midi';
import { normalizeOctave, reduceToMelody, segmentPhrases } from './importCore';
import { parseMidiFile } from './midiImport';
import { parseMusicXmlFile } from './musicXmlImport';

describe('reduceToMelody', () => {
  it('con un acorde se queda con la nota más aguda', () => {
    const raw = [
      { midi: 60, time: 0, duration: 1 },
      { midi: 64, time: 0, duration: 1 },
      { midi: 67, time: 0.01, duration: 1 }, // casi simultánea
      { midi: 62, time: 1, duration: 1 },
    ];
    const melody = reduceToMelody(raw);
    expect(melody.map((n) => n.midi)).toEqual([67, 62]);
  });
});

describe('normalizeOctave', () => {
  it('sube una melodía demasiado grave por octavas enteras', () => {
    const low = [36, 40, 43].map((m, i) => ({ midi: m, time: i, duration: 1 }));
    const out = normalizeOctave(low).map((n) => n.midi);
    expect(out[1] - out[0]).toBe(4); // el contorno (intervalos) se preserva
    expect(out[0]).toBeGreaterThanOrEqual(48);
  });
});

describe('segmentPhrases', () => {
  it('corta en silencios largos y conserva offsets relativos', () => {
    const notes = [
      { midi: 60, time: 0, duration: 1 },
      { midi: 62, time: 1, duration: 1 },
      { midi: 64, time: 2, duration: 1 },
      { midi: 65, time: 3, duration: 1 },
      // silencio de 3 tiempos
      { midi: 67, time: 7, duration: 1 },
      { midi: 69, time: 8, duration: 1 },
      { midi: 71, time: 9, duration: 1 },
      { midi: 72, time: 10, duration: 1 },
    ];
    const phrases = segmentPhrases(notes);
    expect(phrases).toHaveLength(2);
    expect(phrases[1].notes).toEqual([67, 69, 71, 72]);
    expect(phrases[1].offsets![0]).toBe(0); // los offsets se re-anclan al inicio de la frase
  });
});

describe('parseMidiFile', () => {
  it('convierte un MIDI real a canción con frases y ritmo', () => {
    // Construye un MIDI de verdad con la propia librería (round-trip).
    const midi = new Midi();
    midi.header.setTempo(120);
    const track = midi.addTrack();
    const beat = 0.5; // a 120 BPM, una negra = 0.5 s
    [60, 62, 64, 65, 67].forEach((m, i) => {
      track.addNote({ midi: m, time: i * beat, duration: beat * 0.9 });
    });
    const song = parseMidiFile(midi.toArray().buffer as ArrayBuffer, 'prueba.mid', []);
    expect(song.category).toBe('importada');
    expect(song.bpm).toBe(120);
    expect(song.phrases[0].notes).toEqual([60, 62, 64, 65, 67]);
    expect(song.phrases[0].durations!.every((d) => d > 0.5 && d <= 1)).toBe(true);
    expect(song.id.startsWith('imp-')).toBe(true);
  });
});

describe('parseMusicXmlFile', () => {
  const XML = `<?xml version="1.0"?>
<score-partwise>
  <work><work-title>Escala de prueba</work-title></work>
  <part-list><score-part id="P1"/></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>2</divisions></attributes>
      <sound tempo="100"/>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice></note>
      <note><rest/><duration>2</duration><voice>1</voice></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice></note>
      <note><pitch><step>F</step><alter>1</alter><octave>4</octave></pitch><duration>1</duration><voice>1</voice></note>
    </measure>
    <measure number="2">
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><tie type="start"/></note>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><tie type="stop"/></note>
    </measure>
  </part>
</score-partwise>`;

  it('lee notas, alteraciones, silencios y ligaduras', async () => {
    const buf = new TextEncoder().encode(XML).buffer as ArrayBuffer;
    const song = await parseMusicXmlFile(buf, 'escala.musicxml', []);
    expect(song.title).toBe('Escala de prueba');
    expect(song.bpm).toBe(100);
    const p = song.phrases[0];
    expect(p.notes).toEqual([60, 62, 64, 66, 67]); // Do Re (silencio) Mi Fa# Sol
    // La ligadura fusiona las dos blancas de Sol en una nota de 2 tiempos.
    expect(p.durations![4]).toBe(2);
    // El silencio de 1 tiempo se refleja en los offsets (Mi no empieza donde acaba Re).
    expect(p.offsets![2]).toBeGreaterThan(p.offsets![1] + 1);
  });
});
