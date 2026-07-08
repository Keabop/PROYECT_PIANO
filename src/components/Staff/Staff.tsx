import { useEffect, useRef } from 'react';
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow';
import { octaveOf, pitchClass } from '../../audio/noteUtils';

interface StaffProps {
  notes: number[]; // MIDI
  clef?: 'treble' | 'bass';
  highlightIndex?: number; // resalta una nota (posición actual)
}

const LETTERS = ['c', 'c', 'd', 'd', 'e', 'f', 'f', 'g', 'g', 'a', 'a', 'b'];
const ACC = ['', '#', '', '#', '', '', '#', '', '#', '', '#', ''];

function midiToVexKey(midi: number): { key: string; acc: string } {
  const pc = pitchClass(midi);
  const letter = LETTERS[pc];
  const acc = ACC[pc];
  const octave = octaveOf(midi);
  return { key: `${letter}${acc}/${octave}`, acc };
}

export default function Staff({ notes, clef = 'treble', highlightIndex }: StaffProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = '';
    if (notes.length === 0) return;

    try {
      const perNote = 46;
      const width = Math.max(240, 70 + notes.length * perNote);
      const height = 130;

      const renderer = new Renderer(host, Renderer.Backends.SVG);
      renderer.resize(width, height);
      const context = renderer.getContext();
      context.setFillStyle('#e7e7f4');
      context.setStrokeStyle('#e7e7f4');

      const stave = new Stave(6, 20, width - 16);
      stave.addClef(clef);
      stave.setStyle({ strokeStyle: '#8a8fb5' });
      stave.setContext(context).draw();

      const staveNotes = notes.map((midi, i) => {
        const { key, acc } = midiToVexKey(midi);
        const note = new StaveNote({ clef, keys: [key], duration: 'q' });
        if (acc) note.addModifier(new Accidental('#'), 0);
        const color = i === highlightIndex ? '#7c5cff' : '#e7e7f4';
        note.setStyle({ fillStyle: color, strokeStyle: color });
        return note;
      });

      const voice = new Voice({ num_beats: notes.length, beat_value: 4 });
      voice.setStrict(false);
      voice.addTickables(staveNotes);
      new Formatter().joinVoices([voice]).format([voice], width - 70);
      voice.draw(context, stave);
    } catch {
      host.innerHTML = '<p style="color:#9aa0c3;font-size:13px">No se pudo dibujar la partitura.</p>';
    }
  }, [notes, clef, highlightIndex]);

  return <div ref={hostRef} className="overflow-x-auto rounded-xl bg-white/5 p-2" />;
}
