import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { Minus, Pause, Play, Plus } from 'lucide-react';
import { ensureAudio } from '../../audio/synth';

export default function Metronome() {
  const [bpm, setBpm] = useState(80);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState(0);

  const synthRef = useRef<Tone.MembraneSynth | null>(null);
  const idRef = useRef<number | null>(null);
  const beatRef = useRef(0);
  const barRef = useRef(beatsPerBar);
  barRef.current = beatsPerBar;

  useEffect(() => {
    Tone.getTransport().bpm.value = bpm;
  }, [bpm]);

  useEffect(() => {
    return () => {
      if (idRef.current != null) Tone.getTransport().clear(idRef.current);
      Tone.getTransport().stop();
    };
  }, []);

  async function toggle() {
    await ensureAudio();
    if (!synthRef.current) {
      synthRef.current = new Tone.MembraneSynth({ volume: -6 }).toDestination();
    }
    const transport = Tone.getTransport();
    if (playing) {
      transport.stop();
      if (idRef.current != null) transport.clear(idRef.current);
      idRef.current = null;
      setPlaying(false);
      setBeat(0);
      beatRef.current = 0;
      return;
    }
    transport.bpm.value = bpm;
    beatRef.current = 0;
    idRef.current = transport.scheduleRepeat((time) => {
      const b = beatRef.current % barRef.current;
      const accent = b === 0;
      synthRef.current!.triggerAttackRelease(accent ? 'C3' : 'C2', '16n', time);
      Tone.getDraw().schedule(() => setBeat(b), time);
      beatRef.current += 1;
    }, '4n');
    transport.start();
    setPlaying(true);
  }

  return (
    <div className="card p-6 flex flex-col items-center gap-5">
      <h3 className="text-lg font-semibold self-start">Metrónomo</h3>

      <div className="text-5xl font-bold tabular-nums">{bpm}<span className="text-lg text-piano-muted ml-1">BPM</span></div>

      <div className="flex items-center gap-3">
        <button className="btn-ghost" onClick={() => setBpm((v) => Math.max(30, v - 5))} aria-label="Bajar BPM">
          <Minus size={18} />
        </button>
        <input
          type="range"
          min={30}
          max={220}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-48 accent-piano-primary"
        />
        <button className="btn-ghost" onClick={() => setBpm((v) => Math.min(220, v + 5))} aria-label="Subir BPM">
          <Plus size={18} />
        </button>
      </div>

      {/* Indicador de tiempos */}
      <div className="flex gap-2">
        {Array.from({ length: beatsPerBar }).map((_, i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full transition ${
              playing && beat === i ? (i === 0 ? 'bg-piano-accent scale-125' : 'bg-piano-primary scale-125') : 'bg-white/15'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-piano-muted">Compás:</span>
        {[2, 3, 4, 6].map((n) => (
          <button
            key={n}
            className={`px-3 py-1 rounded-lg text-sm ${beatsPerBar === n ? 'bg-piano-primary text-white' : 'bg-white/5 text-piano-muted'}`}
            onClick={() => setBeatsPerBar(n)}
          >
            {n}/4
          </button>
        ))}
      </div>

      <button className="btn-primary" onClick={toggle}>
        {playing ? <Pause size={18} /> : <Play size={18} />}
        {playing ? 'Parar' : 'Iniciar'}
      </button>
    </div>
  );
}
