// Hook de React que gestiona el micrófono y ejecuta la detección de tono en vivo.
// Soporta dos modos: 'mono' (una nota, para afinador/melodías) y 'poly' (acordes).

import { useCallback, useEffect, useRef, useState } from 'react';
import { detectPitch } from './pitchDetector';
import { detectPolyphony, type ActiveNote } from './polyphonicDetector';
import { centsOff, freqToNearestMidi } from './noteUtils';

export type MicStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'unsupported' | 'error';
export type DetectMode = 'mono' | 'poly';

export interface MicState {
  status: MicStatus;
  error: string | null;
  frequency: number; // Hz (modo mono)
  clarity: number; // 0..1 (modo mono)
  midi: number | null; // nota detectada (modo mono)
  cents: number; // desviación respecto a la nota más cercana
  volume: number; // 0..1 aprox
  activeNotes: ActiveNote[]; // notas detectadas (modo poly)
}

const INITIAL: MicState = {
  status: 'idle',
  error: null,
  frequency: 0,
  clarity: 0,
  midi: null,
  cents: 0,
  volume: 0,
  activeNotes: [],
};

interface UseMicrophoneOptions {
  mode?: DetectMode;
  a4?: number;
  /** ms entre análisis polifónicos (más pesado). El modo mono corre cada frame. */
  polyIntervalMs?: number;
}

export function useMicrophone(options: UseMicrophoneOptions = {}) {
  const { mode = 'mono', a4 = 440, polyIntervalMs = 90 } = options;
  const [state, setState] = useState<MicState>(INITIAL);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastPolyRef = useRef(0);
  const modeRef = useRef<DetectMode>(mode);
  modeRef.current = mode;

  const stop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== 'closed') {
      ctxRef.current.close().catch(() => {});
    }
    ctxRef.current = null;
    analyserRef.current = null;
    setState((s) => ({ ...INITIAL, status: s.status === 'denied' ? 'denied' : 'idle' }));
  }, []);

  const loop = useCallback(() => {
    const analyser = analyserRef.current;
    const ctx = ctxRef.current;
    const buf = bufRef.current;
    if (!analyser || !ctx || !buf) return;

    analyser.getFloatTimeDomainData(buf);

    if (modeRef.current === 'poly') {
      const now = performance.now();
      if (now - lastPolyRef.current >= polyIntervalMs) {
        lastPolyRef.current = now;
        const notes = detectPolyphony(buf, ctx.sampleRate, { a4, fftSize: 16384 });
        let vol = 0;
        for (let i = 0; i < buf.length; i++) vol += buf[i] * buf[i];
        vol = Math.min(1, Math.sqrt(vol / buf.length) * 6);
        setState((s) => ({ ...s, activeNotes: notes, volume: vol }));
      }
    } else {
      // Modo mono: usa una ventana corta para baja latencia.
      const window = buf.subarray(0, 2048);
      const res = detectPitch(window, ctx.sampleRate, { clarityThreshold: 0.9 });
      const midi = res.frequency > 0 ? freqToNearestMidi(res.frequency, a4) : null;
      const cents = res.frequency > 0 ? centsOff(res.frequency, a4) : 0;
      setState((s) => ({
        ...s,
        frequency: res.frequency,
        clarity: res.clarity,
        midi,
        cents,
        volume: Math.min(1, res.rms * 6),
      }));
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [a4, polyIntervalMs]);

  const start = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setState((s) => ({ ...s, status: 'unsupported', error: 'Este navegador no soporta micrófono.' }));
      return;
    }
    setState((s) => ({ ...s, status: 'requesting', error: null }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 16384;
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser);
      analyserRef.current = analyser;
      bufRef.current = new Float32Array(analyser.fftSize);
      setState((s) => ({ ...s, status: 'active', error: null }));
      rafRef.current = requestAnimationFrame(loop);
    } catch (err: unknown) {
      const name = (err as { name?: string })?.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setState((s) => ({ ...s, status: 'denied', error: 'Permiso de micrófono denegado.' }));
      } else {
        setState((s) => ({ ...s, status: 'error', error: 'No se pudo acceder al micrófono.' }));
      }
    }
  }, [loop]);

  // Limpieza al desmontar
  useEffect(() => () => stop(), [stop]);

  return { ...state, start, stop };
}
