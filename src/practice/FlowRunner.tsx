// Motor de práctica FLUIDA (estilo Synthesia): las notas caen con el tempo real.
// - modo 'wait' (Espérame): al llegar una nota a la línea, la canción SE PAUSA hasta
//   que la toques. Imposible "perder" notas; los errores son notas equivocadas.
// - modo 'go' (Corrido): la canción no se detiene; nota no tocada a tiempo = fallo.
// El resultado alimenta el sistema de maestría (0 fallos y 0 errores = repetición limpia).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Mic, Pause, Play, RotateCcw, X } from 'lucide-react';
import { pitchClass } from '../audio/noteUtils';
import { useMicrophone } from '../audio/useMicrophone';
import { playMidi } from '../audio/synth';
import PianoKeyboard from '../components/Piano/PianoKeyboard';
import { FlowWaterfall, type FlowNoteState } from '../components/Waterfall/NoteWaterfall';
import { useSettingsStore } from '../store/useSettingsStore';
import type { ExerciseResult } from './ExerciseRunner';

const LEAD_IN_BEATS = 3; // las notas empiezan cayendo desde arriba
const HIT_EARLY = 0.7; // tiempos de anticipación permitidos
const HIT_LATE = 0.5; // tiempos de retraso antes de marcar fallo (modo Corrido)

export type FlowMode = 'wait' | 'go';

interface FlowRunnerProps {
  notes: number[];
  offsetsBeats: number[];
  durationsBeats: number[];
  bpm: number;
  mode: FlowMode;
  onComplete: (result: ExerciseResult & { hits: number; misses: number }) => void;
}

export default function FlowRunner({ notes, offsetsBeats, durationsBeats, bpm, mode, onComplete }: FlowRunnerProps) {
  const a4 = useSettingsStore((s) => s.a4);
  const mic = useMicrophone({ mode: 'mono', a4 });
  const micActive = mic.status === 'active';

  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [playhead, setPlayhead] = useState(-LEAD_IN_BEATS);
  const [states, setStates] = useState<FlowNoteState[]>(() => notes.map(() => 'pending'));
  const [finished, setFinished] = useState(false);

  const playheadRef = useRef(-LEAD_IN_BEATS);
  const statesRef = useRef<FlowNoteState[]>(notes.map(() => 'pending'));
  const pendingRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef(0);
  const wrongRef = useRef(0);
  const releasedRef = useRef(true);
  const lastPcRef = useRef(-1);
  const finishedRef = useRef(false);
  const speedRef = useRef(1);
  const runningRef = useRef(false);
  speedRef.current = speed;
  runningRef.current = running;

  const endBeat = useMemo(
    () => (notes.length ? offsetsBeats[notes.length - 1] + durationsBeats[notes.length - 1] : 0),
    [notes, offsetsBeats, durationsBeats]
  );

  const [from, to] = useMemo(() => {
    let lo = Math.min(...notes) - 1;
    let hi = Math.max(...notes) + 1;
    lo -= pitchClass(lo);
    hi += (12 - pitchClass(hi)) % 12;
    return [Math.max(36, lo), Math.min(96, hi)];
  }, [notes]);

  const advancePending = useCallback(() => {
    while (pendingRef.current < notes.length && statesRef.current[pendingRef.current] !== 'pending') {
      pendingRef.current++;
    }
  }, [notes.length]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setRunning(false);
    setFinished(true);
    const hits = statesRef.current.filter((s) => s === 'hit').length;
    const misses = statesRef.current.filter((s) => s === 'missed').length;
    onComplete({ errors: misses + wrongRef.current, hits, misses });
  }, [onComplete]);

  // Bucle de tiempo
  const loop = useCallback(
    (ts: number) => {
      if (!runningRef.current) return;
      const dt = lastTsRef.current ? (ts - lastTsRef.current) / 1000 : 0;
      lastTsRef.current = ts;
      let ph = playheadRef.current + dt * (bpm / 60) * speedRef.current;

      advancePending();
      const p = pendingRef.current;

      if (mode === 'wait') {
        // Espérame: el avance se detiene justo cuando la nota pendiente llega a la línea.
        if (p < notes.length) ph = Math.min(ph, offsetsBeats[p]);
      } else {
        // Corrido: lo no tocado a tiempo se marca como fallo y la canción sigue.
        let changed = false;
        while (pendingRef.current < notes.length && ph > offsetsBeats[pendingRef.current] + HIT_LATE) {
          if (statesRef.current[pendingRef.current] === 'pending') {
            statesRef.current[pendingRef.current] = 'missed';
            changed = true;
          }
          pendingRef.current++;
          advancePending();
        }
        if (changed) setStates([...statesRef.current]);
      }

      playheadRef.current = ph;
      setPlayhead(ph);

      if (ph >= endBeat + 1.5) {
        finish();
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    },
    [bpm, mode, notes.length, offsetsBeats, endBeat, advancePending, finish]
  );

  useEffect(() => {
    if (running) {
      lastTsRef.current = 0;
      rafRef.current = requestAnimationFrame(loop);
    }
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [running, loop]);

  // Registrar un intento de nota (del micrófono o del teclado en pantalla).
  const tryNote = useCallback(
    (pc: number) => {
      advancePending();
      const p = pendingRef.current;
      if (p >= notes.length || finishedRef.current || !runningRef.current) return;
      const targetPc = pitchClass(notes[p]);
      const ph = playheadRef.current;
      if (pc === targetPc && ph >= offsetsBeats[p] - HIT_EARLY) {
        statesRef.current[p] = 'hit';
        pendingRef.current++;
        setStates([...statesRef.current]);
      } else if (pc !== targetPc) {
        wrongRef.current += 1;
      }
    },
    [notes, offsetsBeats, advancePending]
  );

  // Micrófono: detección con compuerta de "release" (una pulsación = un intento).
  useEffect(() => {
    if (!micActive) return;
    if (mic.midi == null) {
      releasedRef.current = true;
      return;
    }
    const pc = pitchClass(mic.midi);
    if (releasedRef.current || pc !== lastPcRef.current) {
      releasedRef.current = false;
      lastPcRef.current = pc;
      tryNote(pc);
    }
  }, [mic.midi, mic.tick, micActive, tryNote]);

  function reset() {
    playheadRef.current = -LEAD_IN_BEATS;
    statesRef.current = notes.map(() => 'pending');
    pendingRef.current = 0;
    wrongRef.current = 0;
    finishedRef.current = false;
    setStates([...statesRef.current]);
    setPlayhead(-LEAD_IN_BEATS);
    setFinished(false);
    setRunning(false);
  }

  const hits = states.filter((s) => s === 'hit').length;
  const misses = states.filter((s) => s === 'missed').length;
  const pendingNote = pendingRef.current < notes.length ? notes[pendingRef.current] : null;
  const detected = mic.midi != null ? [mic.midi] : [];
  const detectedOk = mic.midi != null && pendingNote != null && pitchClass(mic.midi) === pitchClass(pendingNote);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="chip text-piano-good"><Check size={14} /> {hits}</span>
        {mode === 'go' && <span className="chip text-piano-bad"><X size={14} /> {misses}</span>}
        <span className="text-piano-muted text-xs">
          {mode === 'wait' ? 'La canción te espera en cada nota.' : 'La canción no se detiene: ¡síguela!'}
        </span>
        <div className="ml-auto flex gap-1">
          {[0.5, 0.75, 1].map((f) => (
            <button
              key={f}
              onClick={() => setSpeed(f)}
              className={`px-2 py-0.5 rounded-lg text-xs ${speed === f ? 'bg-piano-primary text-white' : 'bg-white/5 text-piano-muted'}`}
            >
              {f === 1 ? '1×' : `${f}×`}
            </button>
          ))}
        </div>
      </div>

      <div className={`rounded-2xl ${finished ? 'ring-2 ring-piano-good' : ''}`}>
        <FlowWaterfall
          notes={notes}
          offsetsBeats={offsetsBeats}
          durationsBeats={durationsBeats}
          playheadBeats={playhead}
          from={from}
          to={to}
          states={states}
        />
        <PianoKeyboard
          from={from}
          to={to}
          highlight={pendingNote != null && !finished ? [pendingNote] : []}
          detected={detected}
          detectedOk={detectedOk}
          onPlay={(m) => {
            playMidi(m, 0.4, a4);
            if (!micActive) tryNote(pitchClass(m));
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!finished && (
          <button className="btn-primary" onClick={() => setRunning((r) => !r)} data-testid="flow-play">
            {running ? <Pause size={18} /> : <Play size={18} />} {running ? 'Pausa' : playhead > -LEAD_IN_BEATS ? 'Continuar' : 'Empezar'}
          </button>
        )}
        <button className="btn-ghost" onClick={reset}>
          <RotateCcw size={18} /> Reiniciar
        </button>
        {!micActive ? (
          <button className="btn-ghost" onClick={mic.start}>
            <Mic size={18} /> Activar micrófono
          </button>
        ) : (
          <span className="chip text-piano-good">
            <span className="h-2 w-2 rounded-full bg-piano-good animate-pulse" /> Escuchando tu piano
          </span>
        )}
      </div>

      {finished && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-white/5 p-4 text-sm">
          <p className="font-semibold mb-1">
            {misses === 0 && wrongRef.current === 0 ? '¡Ejecución limpia! 🥇' : 'Resultado'}
          </p>
          <p className="text-piano-muted">
            {hits}/{notes.length} notas acertadas
            {mode === 'go' && ` · ${misses} perdida${misses === 1 ? '' : 's'}`}
            {wrongRef.current > 0 && ` · ${wrongRef.current} nota${wrongRef.current === 1 ? '' : 's'} equivocada${wrongRef.current === 1 ? '' : 's'}`}
            {' · '}Precisión: {notes.length ? Math.round((hits / notes.length) * 100) : 0}%
          </p>
        </motion.div>
      )}

      {!micActive && (
        <p className="text-xs text-piano-muted">
          Sin micrófono puedes seguir la cascada pulsando las teclas en pantalla.
        </p>
      )}
      {mic.error && <p className="text-sm text-piano-bad">{mic.error}</p>}
    </div>
  );
}
