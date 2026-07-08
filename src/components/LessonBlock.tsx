import { Lightbulb, Volume2 } from 'lucide-react';
import type { Block } from '../data/curriculum';
import { playChord, playSequence } from '../audio/synth';
import { useSettingsStore } from '../store/useSettingsStore';
import PianoKeyboard from './Piano/PianoKeyboard';
import Staff from './Staff/Staff';

export default function LessonBlock({ block }: { block: Block }) {
  const a4 = useSettingsStore((s) => s.a4);

  switch (block.kind) {
    case 'text':
      return (
        <div>
          {block.title && <h3 className="font-semibold text-lg mb-1">{block.title}</h3>}
          <p className="text-piano-muted leading-relaxed">{block.body}</p>
        </div>
      );

    case 'tip':
      return (
        <div className="flex items-start gap-3 rounded-xl bg-piano-accent/10 border border-piano-accent/20 p-4">
          <Lightbulb size={20} className="text-piano-accent shrink-0 mt-0.5" />
          <p className="text-sm text-piano-text leading-relaxed">{block.body}</p>
        </div>
      );

    case 'keyboard':
      return (
        <div className="flex flex-col gap-2">
          <PianoKeyboard
            from={block.from ?? 48}
            to={block.to ?? 84}
            highlight={block.highlight}
            labels={block.labels}
            onPlay={(m) => playSequence([m], 0.4, 0.4, a4)}
          />
          {block.caption && <p className="text-xs text-piano-muted text-center">{block.caption}</p>}
        </div>
      );

    case 'listen':
      return (
        <button
          className="btn-ghost self-start"
          onClick={() => (block.chord ? playChord(block.notes, 1.4, a4) : playSequence(block.notes, 0.42, 0.4, a4))}
        >
          <Volume2 size={18} /> {block.label}
        </button>
      );

    case 'staff':
      return (
        <div className="flex flex-col gap-2">
          <Staff notes={block.notes} clef={block.clef ?? 'treble'} />
          {block.caption && <p className="text-xs text-piano-muted text-center">{block.caption}</p>}
        </div>
      );

    default:
      return null;
  }
}
