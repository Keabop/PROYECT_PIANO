import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, FileMusic, Mic, RotateCcw, Volume2, Waves } from 'lucide-react';
import type { Exercise } from '../data/curriculum';
import { useMicrophone } from '../audio/useMicrophone';
import { useNoteMatcher } from './useNoteMatcher';
import { pitchClass } from '../audio/noteUtils';
import { playChord, playMidi, playSequence, playTimedSequence } from '../audio/synth';
import { useSettingsStore } from '../store/useSettingsStore';
import PianoKeyboard from '../components/Piano/PianoKeyboard';
import Staff from '../components/Staff/Staff';
import NoteWaterfall from '../components/Waterfall/NoteWaterfall';
import QuizExercise from './QuizExercise';

export interface ExerciseResult {
  /** Errores cometidos durante la ejecución (notas incorrectas / intentos fallidos). */
  errors: number;
}

interface ExerciseRunnerProps {
  exercise: Exercise;
  onComplete: (result: ExerciseResult) => void;
}

export default function ExerciseRunner({ exercise, onComplete }: ExerciseRunnerProps) {
  if (exercise.kind === 'quiz') {
    return <QuizExercise exercise={exercise} onComplete={onComplete} />;
  }
  return <PlayExercise exercise={exercise} onComplete={onComplete} />;
}

function PlayExercise({
  exercise,
  onComplete,
}: {
  exercise: Exclude<Exercise, { kind: 'quiz' }>;
  onComplete: (result: ExerciseResult) => void;
}) {
  const a4 = useSettingsStore((s) => s.a4);
  const detectionEngine = useSettingsStore((s) => s.detectionEngine);
  const practiceView = useSettingsStore((s) => s.practiceView);
  const setPracticeView = useSettingsStore((s) => s.setPracticeView);
  const chord = exercise.kind === 'playChord';
  const targets = useMemo<number[]>(
    () => (exercise.kind === 'playNote' ? [exercise.target] : exercise.targets),
    [exercise]
  );
  const isSequence = !chord && targets.length > 1;
  const clef = exercise.kind === 'playSequence' ? exercise.clef ?? 'treble' : 'treble';
  const seqDurations = exercise.kind === 'playSequence' ? exercise.durations : undefined;
  // Cascada para toda secuencia; la partitura queda como vista alternativa.
  const useWaterfall = isSequence && practiceView === 'waterfall';

  const mic = useMicrophone({ mode: chord ? 'poly' : 'mono', engine: detectionEngine, a4 });
  const micActive = mic.status === 'active';
  const matcher = useNoteMatcher({ targets, chord, enabled: micActive, midi: mic.midi, activeNotes: mic.activeNotes, tick: mic.tick });

  // Progreso manual (fallback sin micrófono, tocando el teclado en pantalla).
  const [manualIndex, setManualIndex] = useState(0);
  const [manualChord, setManualChord] = useState<Set<number>>(new Set());
  const [wrongFlash, setWrongFlash] = useState(false);

  // Errores de ESTA ejecución (persisten aunque se pulse Reiniciar: reintentar
  // no borra los fallos del intento — así las repeticiones "limpias" son reales).
  const errorsRef = useRef(0);
  const prevWrongRef = useRef(false);
  useEffect(() => {
    // Flanco de subida de matcher.wrong = una nota incorrecta detectada por el micro.
    if (matcher.wrong && !prevWrongRef.current) errorsRef.current += 1;
    prevWrongRef.current = matcher.wrong;
  }, [matcher.wrong]);

  const index = micActive ? matcher.index : manualIndex;
  const manualChordDone = chord && targets.every((t) => manualChord.has(pitchClass(t)));
  const done = micActive ? matcher.done : chord ? manualChordDone : manualIndex >= targets.length;

  const completedRef = useRef(false);
  useEffect(() => {
    if (done && !completedRef.current) {
      completedRef.current = true;
      const t = setTimeout(() => onComplete({ errors: errorsRef.current }), 700);
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

  // Rango del teclado según las notas, redondeado a octavas completas (Do a Do):
  // da contexto visual y evita que 3-4 teclas se estiren a pantalla completa.
  const [from, to] = useMemo(() => {
    let lo = Math.min(...targets) - 1;
    let hi = Math.max(...targets) + 1;
    lo -= pitchClass(lo); // baja al Do anterior
    hi += (12 - pitchClass(hi)) % 12; // sube al Do siguiente
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
      errorsRef.current += 1;
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
      <div className="flex items-center justify-between gap-2">
        <p className="text-piano-text font-medium">{exercise.prompt}</p>
        {isSequence && (
          <div className="flex gap-1 shrink-0">
            <button
              className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 ${useWaterfall ? 'bg-piano-primary text-white' : 'bg-white/5 text-piano-muted'}`}
              onClick={() => setPracticeView('waterfall')}
              title="Vista cascada (las notas caen hacia el teclado)"
            >
              <Waves size={14} /> Cascada
            </button>
            <button
              className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 ${!useWaterfall ? 'bg-piano-primary text-white' : 'bg-white/5 text-piano-muted'}`}
              onClick={() => setPracticeView('staff')}
              title="Vista partitura"
            >
              <FileMusic size={14} /> Partitura
            </button>
          </div>
        )}
      </div>

      {isSequence && !useWaterfall && <Staff notes={targets} clef={clef} highlightIndex={done ? undefined : index} />}

      <motion.div
        animate={wrongFlash ? { x: [0, -6, 6, -4, 0] } : {}}
        transition={{ duration: 0.25 }}
        className={`rounded-2xl ${done ? 'ring-2 ring-piano-good' : ''}`}
      >
        {useWaterfall && (
          <NoteWaterfall targets={targets} durations={seqDurations} index={index} from={from} to={to} done={done} />
        )}
        <div className={useWaterfall ? '' : 'p-2'}>
          <PianoKeyboard from={from} to={to} highlight={done ? targets : highlight} detected={detected} detectedOk={detectedOk} onPlay={handlePlay} />
        </div>
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
