import { useEffect, useState } from 'react';
import { Ear, RefreshCw, Volume2 } from 'lucide-react';
import { INTERVALS } from '../theory/intervals';
import { CHORD_TYPES, buildChord } from '../theory/chords';
import { playChord, playSequence } from '../audio/synth';
import { useSettingsStore } from '../store/useSettingsStore';

type Mode = 'intervalos' | 'acordes';

const INTERVAL_POOL = INTERVALS.filter((i) => [3, 4, 5, 7, 9, 12].includes(i.semitones));
const CHORD_POOL = ['major', 'minor', 'dominant7', 'diminished'] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sample<T>(arr: readonly T[], n: number, must: T): T[] {
  const set = new Set<T>([must]);
  while (set.size < n && set.size < arr.length) set.add(pick(arr));
  return [...set].sort(() => Math.random() - 0.5);
}

interface Challenge {
  root: number;
  answer: string;
  options: string[];
  play: () => void;
}

export default function EarTraining() {
  const a4 = useSettingsStore((s) => s.a4);
  const [mode, setMode] = useState<Mode>('intervalos');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState({ ok: 0, total: 0 });

  function newChallenge(m: Mode = mode) {
    const root = 60 + Math.floor(Math.random() * 5); // Do..Mi
    if (m === 'intervalos') {
      const interval = pick(INTERVAL_POOL);
      const options = sample(INTERVAL_POOL.map((i) => i.name), 4, interval.name);
      setChallenge({
        root,
        answer: interval.name,
        options,
        play: () => playSequence([root, root + interval.semitones], 0.6, 0.5, a4),
      });
    } else {
      const type = pick(CHORD_POOL);
      const options = sample(CHORD_POOL.map((c) => CHORD_TYPES[c].name), 4, CHORD_TYPES[type].name);
      setChallenge({
        root,
        answer: CHORD_TYPES[type].name,
        options,
        play: () => playChord(buildChord(root, type), 1.4, a4),
      });
    }
    setSelected(null);
  }

  useEffect(() => {
    newChallenge(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function choose(opt: string) {
    if (selected || !challenge) return;
    setSelected(opt);
    setScore((s) => ({ ok: s.ok + (opt === challenge.answer ? 1 : 0), total: s.total + 1 }));
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ear /> Entrenamiento auditivo
          </h1>
          <p className="text-piano-muted">Escucha y reconoce. Entrena tu oído musical.</p>
        </div>
        <div className="text-right text-sm">
          <div className="font-bold text-lg">{score.ok}/{score.total}</div>
          <div className="text-piano-muted">aciertos</div>
        </div>
      </header>

      <div className="flex gap-2">
        {(['intervalos', 'acordes'] as Mode[]).map((m) => (
          <button
            key={m}
            className={`px-4 py-2 rounded-xl text-sm capitalize ${mode === m ? 'bg-piano-primary text-white' : 'bg-white/5 text-piano-muted'}`}
            onClick={() => setMode(m)}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="card p-6 flex flex-col items-center gap-5">
        <button className="btn-primary" onClick={() => challenge?.play()}>
          <Volume2 size={18} /> Reproducir
        </button>

        <div className="grid grid-cols-2 gap-2 w-full max-w-md">
          {challenge?.options.map((opt) => {
            const isAnswer = opt === challenge.answer;
            const isChosen = opt === selected;
            let cls = 'bg-white/5 hover:bg-white/10';
            if (selected) {
              if (isAnswer) cls = 'bg-piano-good/20 ring-1 ring-piano-good';
              else if (isChosen) cls = 'bg-piano-bad/20 ring-1 ring-piano-bad';
            }
            return (
              <button key={opt} className={`rounded-xl px-3 py-3 text-sm transition ${cls}`} onClick={() => choose(opt)}>
                {opt}
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="flex flex-col items-center gap-3">
            <p className={selected === challenge?.answer ? 'text-piano-good font-medium' : 'text-piano-warn'}>
              {selected === challenge?.answer ? '¡Correcto! 🎉' : `Era: ${challenge?.answer}`}
            </p>
            <button className="btn-ghost" onClick={() => newChallenge()}>
              <RefreshCw size={18} /> Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
