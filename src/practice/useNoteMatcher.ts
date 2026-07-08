// Motor de emparejamiento: compara lo que llega del micrófono con las notas esperadas.
// - Modo secuencia/nota (mono): avanza nota a nota con detección de "release".
// - Modo acorde (poly): valida el conjunto de notas simultáneas por template matching.

import { useCallback, useEffect, useRef, useState } from 'react';
import { pitchClass } from '../audio/noteUtils';
import { matchChord, type ActiveNote } from '../audio/polyphonicDetector';

interface MatcherArgs {
  targets: number[];
  chord: boolean;
  enabled: boolean;
  midi: number | null; // mono
  activeNotes: ActiveNote[]; // poly
  /** Contador de análisis del micrófono: garantiza que el matcher evalúe CADA lectura,
   *  incluso si la nota detectada no cambia entre frames (nota sostenida). */
  tick?: number;
}

export interface MatcherState {
  index: number; // nota actual de la secuencia
  total: number;
  done: boolean;
  wrong: boolean; // se está tocando algo incorrecto ahora
  matchedPcs: number[]; // (acorde) clases presentes
  missingPcs: number[]; // (acorde) clases que faltan
  lastHitAt: number; // timestamp del último acierto (para animación)
}

const STABLE_FRAMES = 2; // frames que una nota debe mantenerse para contar
const CHORD_STABLE = 2; // lecturas poly estables para dar el acorde por bueno

export function useNoteMatcher({ targets, chord, enabled, midi, activeNotes, tick = 0 }: MatcherArgs) {
  const [state, setState] = useState<MatcherState>({
    index: 0,
    total: targets.length,
    done: false,
    wrong: false,
    matchedPcs: [],
    missingPcs: [],
    lastHitAt: 0,
  });

  const indexRef = useRef(0);
  const stableRef = useRef(0);
  const releasedRef = useRef(true);
  const lastAcceptedPcRef = useRef(-1);
  const chordStableRef = useRef(0);

  const reset = useCallback(() => {
    indexRef.current = 0;
    stableRef.current = 0;
    releasedRef.current = true;
    lastAcceptedPcRef.current = -1;
    chordStableRef.current = 0;
    setState({ index: 0, total: targets.length, done: false, wrong: false, matchedPcs: [], missingPcs: [], lastHitAt: 0 });
  }, [targets.length]);

  // ---- Modo MONO (nota / secuencia) ----
  useEffect(() => {
    if (!enabled || chord) return;
    if (indexRef.current >= targets.length) return;

    if (midi == null) {
      releasedRef.current = true;
      stableRef.current = 0;
      setState((s) => (s.wrong ? { ...s, wrong: false } : s));
      return;
    }

    const targetPc = pitchClass(targets[indexRef.current]);
    const detectedPc = pitchClass(midi);
    const gate = releasedRef.current || detectedPc !== lastAcceptedPcRef.current;

    if (detectedPc === targetPc && gate) {
      stableRef.current += 1;
      if (stableRef.current >= STABLE_FRAMES) {
        // Acierto
        lastAcceptedPcRef.current = targetPc;
        indexRef.current += 1;
        releasedRef.current = false;
        stableRef.current = 0;
        const done = indexRef.current >= targets.length;
        setState((s) => ({ ...s, index: indexRef.current, done, wrong: false, lastHitAt: performance.now() }));
      }
    } else if (detectedPc !== targetPc) {
      stableRef.current = 0;
      setState((s) => (s.wrong ? s : { ...s, wrong: true }));
    }
    // `tick` en las dependencias: re-evalúa en cada análisis del micrófono, no solo
    // cuando cambia la nota (una nota sostenida produce el mismo `midi` muchos frames).
  }, [midi, tick, enabled, chord, targets]);

  // ---- Modo POLY (acorde) ----
  useEffect(() => {
    if (!enabled || !chord) return;
    if (indexRef.current >= 1) return; // el acorde es un único paso

    const res = matchChord(activeNotes, targets);
    if (res.complete && activeNotes.length > 0) {
      chordStableRef.current += 1;
      if (chordStableRef.current >= CHORD_STABLE) {
        indexRef.current = 1;
        setState((s) => ({
          ...s,
          index: 1,
          done: true,
          wrong: false,
          matchedPcs: res.matched,
          missingPcs: [],
          lastHitAt: performance.now(),
        }));
      } else {
        setState((s) => ({ ...s, matchedPcs: res.matched, missingPcs: res.missing }));
      }
    } else {
      chordStableRef.current = 0;
      setState((s) => ({ ...s, matchedPcs: res.matched, missingPcs: res.missing, wrong: res.extra.length > 0 }));
    }
  }, [activeNotes, tick, enabled, chord, targets]);

  return { ...state, reset };
}
