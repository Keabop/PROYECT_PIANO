import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Mic, RotateCcw, Volume2 } from 'lucide-react';
import type { Exercise } from '../data/curriculum';
import { useMicrophone } from '../audio/useMicrophone';
import { useNoteMatcher } from './useNoteMatcher';
import { pitchClass } from '../audio/noteUtils';
import { playChord, playMidi, playSequence, playTimedSequence } from '../audio/synth';
import { useSettingsStore } from '../store/useSettingsStore';
import PianoKeyboard from '../components/Piano/PianoKeyboard';
import Staff from '../components/Staff/Staff';
import QuizExercise from './QuizExercise';

interface ExerciseRunnerProps {
  exercise: Exercise;
  onComplete: () => void;
}

export default function ExerciseRunner({ exercise, onComplete }: ExerciseRunnerProps) {
  if (exercise.kind === 'quiz') {
    return <QuizExercise exercise={exercise} onComplete={onComplete} />;
  }
  return <PlayExercise exercise={exercise} onComplete={onComplete} />;
}

function PlayExercise({ exercise, onComplete }: { exercise: Exclude<Exercise, { kind: 'quiz' }>; onComplete: () => void }) {
  const a4 = useSettingsStore((s) => s.a4);
  const detectionEngine = useSettingsStore((s) => s.detectionEngine);
  const chord = exercise.kind === 'playChord';
  const targets = useMemo<number[]>(
    () => (exercise.kind === 'playNote' ? [exercise.target] : exercise.targets),
    [exercise]
  );
  const showStaff = exercise.kind === 'playSequence' && exercise.showStaff;
  const clef = exercise.kind === 'playSequence' ? exercise.clef ?? 'treble' : 'treble';

  const mic = useMicrophone({ mode: chord ? 'poly' : 'mono', engine: detectionEngine, a4 });
  const micActive = mic.status === 'active';
  const matcher = useNoteMatcher({ targets, chord, enabled: micActive, midi: mic.midi, activeNotes: mic.activeNotes, tick: mic.tick });

  // Progreso manual (fallback sin micrófono, tocando el teclado en pantalla).
  const [manualIndex, setManualIndex] = useState(0);
  const [manualChord, setManualChord] = useState<Set<number>>(new Set());
  const [wrongFlash, setWrongFlash] = useState(false);

  const index = micActive ? matcher.index : manualIndex;
  const manualChordDone = chord && targets.every((t) => manualChord.has(pitchClass(t)));
  const done = micActive ? matcher.done : chord ? manualChordDone : manualIndex >= targets.length;

  const completedRef = useRef(false);
  useEffect(() => {
    if (done && !completedRef.current) {
      completedRef.current = true;
      const t = setTimeout(onComplete, 700);
      return () => clearTimeout(t);
    }
  }, [done, onComplete]);

  const reset = useCallback(() => {
    completedRef.current = false;
    setManualIndex(0);
    setManualChord(new Set());
    matcher.reset();
  }, [matcher]);

  // Notas objetivo a resaltar
  const highlight = chord ? targets : index < targets.length ? [targets[index]] : [];

  // Notas detectadas (para pintar en el teclado)
  const detected = chord ? mic.activeNotes.map((n) => n.midi) : mic.midi != null ? [mic.midi] : [];
  const detectedOk = chord
    ? true
    : mic.midi != null && index < targets.length && pitchClass(mic.midi) === pitchClass(targets[index]);

  // Rango del teclado según las notas
  const [from, to] = useMemo(() => {
    const lo = Math.min(...targets) - 2;
    const hi = Math.max(...targets) + 2;
    return [Math.max(36, lo), Math.min(96, hi)];
  }, [targets]);

  function handlePlay(midi: number) {
    playMidi(midi, 0.5, a4);
    if (micActive || done) return;
    if (chord) {
      setManualChord((prev) => new Set(prev).add(pitchClass(midi)));
    } else if (index < targets.length && pitchClass(midi) === pitchClass(targets[index])) {
      setManualIndex((i) => i + 1);
    } else {
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 250);
    }
  }

  function listen() {
    if (chord) {
      playChord(targets, 1.4, a4);
    } else if (targets.length === 1) {
      playMidi(targets[0], 0.7, a4);
    } else if (exercise.kind === 'playSequence' && exercise.durations && exercise.bpm) {
      // Ritmo real de la pieza (canciones): cada nota con su duración y tempo.
      const beat = 60 / exercise.bpm;
      playTimedSequence(targets, exercise.durations.map((d) => d * beat), a4);
    } else {
      playSequence(targets, 0.45, 0.4, a4);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-piano-text font-medium">{exercise.prompt}</p>

      {showStaff && <Staff notes={targets} clef={clef} highlightIndex={done ? undefined : index} />}

      <motion.div
        animate={wrongFlash ? { x: [0, -6, 6, -4, 0] } : {}}
        transition={{ duration: 0.25 }}
        className={`rounded-2xl p-2 ${done ? 'ring-2 ring-piano-good' : ''}`}
      >
        <PianoKeyboard from={from} to={to} highlight={done ? targets : highlight} detected={detected} detectedOk={detectedOk} onPlay={handlePlay} />
      </motion.div>

      {/* Progreso de secuencia */}
      {!chord && targets.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {targets.map((_, i) => (
            <div key={i} className={`h-2 w-6 rounded-full ${i < index ? 'bg-piano-good' : 'bg-white/10'}`} />
          ))}
        </div>
      )}

      {/* Estado del acorde */}
      {chord && micActive && !done && (
        <p className="text-sm text-piano-muted">
          Notas detectadas a la vez: {mic.activeNotes.length}. Mantén las {targets.length} notas del acorde juntas.
          {detectionEngine === 'ml' && mic.mlStatus === 'loading' && ' (cargando motor ML…)'}
          {detectionEngine === 'ml' && mic.mlStatus === 'ready' && ' · Motor ML activo'}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-ghost" onClick={listen}>
          <Volume2 size={18} /> Escuchar
        </button>
        {!micActive ? (
          <button className="btn-primary" onClick={mic.start}>
            <Mic size={18} /> Activar micrófono
          </button>
        ) : (
          <span className="chip text-piano-good">
            <span className="h-2 w-2 rounded-full bg-piano-good animate-pulse" /> Escuchando tu piano
            {/* Barrita de volumen: muestra si el micro está captando sonido */}
            <span className="ml-1 flex h-3 w-14 items-end gap-[2px]" aria-label="Nivel del micrófono">
              {[0.12, 0.3, 0.5, 0.7, 0.85].map((th, i) => (
                <span
                  key={i}
                  className={`w-2 rounded-sm transition-colors ${mic.volume >= th ? 'bg-piano-good' : 'bg-white/15'}`}
                  style={{ height: `${(i + 1) * 20}%` }}
                />
              ))}
            </span>
          </span>
        )}
        <button className="btn-ghost" onClick={reset}>
          <RotateCcw size={18} /> Reiniciar
        </button>
      </div>

      {done && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-piano-good font-semibold">
          <CheckCircle2 size={20} /> ¡Correcto!
        </motion.div>
      )}

      {!micActive && (
        <p className="text-xs text-piano-muted">
          Sin micrófono puedes completar el ejercicio pulsando las teclas en pantalla. Para que la app escuche tu
          piano real, activa el micrófono.
        </p>
      )}
      {mic.error && <p className="text-sm text-piano-bad">{mic.error}</p>}
    </div>
  );
}
