// Hook de React que gestiona el micrófono y ejecuta la detección de notas en vivo.
// Modos: 'mono' (una nota: afinador/melodías) y 'poly' (acordes).
// Motores para 'poly': 'standard' (FFT + saliencia armónica, instantáneo) o
// 'ml' (Basic Pitch/TensorFlow.js, más robusto con pianos reales, mayor latencia).

import { useCallback, useEffect, useRef, useState } from 'react';
import { detectPitch } from './pitchDetector';
import { detectPolyphony, type ActiveNote } from './polyphonicDetector';
import { centsOff, freqToNearestMidi } from './noteUtils';
import { detectNotesML, getMLStatus, loadML, onMLStatus, resampleTo22050, type MLStatus } from './mlDetector';
import { getSharedAudioContext } from './synth';
import { useSettingsStore } from '../store/useSettingsStore';

export type MicStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'unsupported' | 'error';
export type DetectMode = 'mono' | 'poly';
export type DetectEngine = 'standard' | 'ml';

export interface MicState {
  status: MicStatus;
  error: string | null;
  frequency: number; // Hz (modo mono)
  clarity: number; // 0..1 (modo mono)
  midi: number | null; // nota detectada (modo mono)
  cents: number; // desviación respecto a la nota más cercana
  volume: number; // 0..1 aprox
  activeNotes: ActiveNote[]; // notas detectadas (modo poly)
  mlStatus: MLStatus; // estado del motor ML (si se usa)
  /** Contador que avanza en cada análisis; permite a los consumidores reaccionar
   *  a CADA lectura aunque la nota detectada no cambie (nota sostenida). */
  tick: number;
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
  mlStatus: 'idle',
  tick: 0,
};

interface UseMicrophoneOptions {
  mode?: DetectMode;
  engine?: DetectEngine; // solo aplica al modo 'poly'
  a4?: number;
  /** ms entre análisis polifónicos. */
  polyIntervalMs?: number;
}

export function useMicrophone(options: UseMicrophoneOptions = {}) {
  const { mode = 'mono', engine = 'standard', a4 = 440, polyIntervalMs } = options;
  const [state, setState] = useState<MicState>(() => ({ ...INITIAL, mlStatus: getMLStatus() }));
  const micSensitivity = useSettingsStore((s) => s.micSensitivity);

  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastPolyRef = useRef(0);
  const modeRef = useRef<DetectMode>(mode);
  const engineRef = useRef<DetectEngine>(engine);
  const sensRef = useRef(micSensitivity);
  modeRef.current = mode;
  engineRef.current = engine;
  sensRef.current = micSensitivity;

  // Refleja el estado del motor ML en el estado del hook.
  useEffect(() => onMLStatus((s) => setState((prev) => ({ ...prev, mlStatus: s }))), []);

  // Precarga el modelo ML en cuanto se selecciona ese motor (aunque el micro esté apagado).
  useEffect(() => {
    if (engine === 'ml' && mode === 'poly') {
      loadML().catch(() => {});
    }
  }, [engine, mode]);

  const stop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    // El AudioContext es COMPARTIDO con la reproducción (Tone): se desconectan los
    // nodos del micrófono pero NO se cierra el contexto (cerrarlo dejaría muda la app).
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    analyserRef.current = null;
    ctxRef.current = null;
    setState((s) => ({ ...INITIAL, mlStatus: s.mlStatus, status: s.status === 'denied' ? 'denied' : 'idle' }));
  }, []);

  const loop = useCallback(() => {
    const analyser = analyserRef.current;
    const ctx = ctxRef.current;
    const buf = bufRef.current;
    if (!analyser || !ctx || !buf) return;

    analyser.getFloatTimeDomainData(buf);
    const sens = sensRef.current; // 0 = estricto, 1 = permisivo

    if (modeRef.current === 'poly') {
      const interval = polyIntervalMs ?? (engineRef.current === 'ml' ? 700 : 90);
      const now = performance.now();
      if (now - lastPolyRef.current >= interval) {
        lastPolyRef.current = now;
        let vol = 0;
        for (let i = 0; i < buf.length; i++) vol += buf[i] * buf[i];
        vol = Math.min(1, Math.sqrt(vol / buf.length) * 6);

        if (engineRef.current === 'ml') {
          const mono22k = resampleTo22050(buf, ctx.sampleRate);
          detectNotesML(mono22k)
            .then((notes) => {
              if (notes) setState((s) => ({ ...s, activeNotes: notes, volume: vol, tick: s.tick + 1 }));
            })
            .catch(() => {
              // Si el motor ML falla en caliente, cae al estándar en el siguiente tick.
              engineRef.current = 'standard';
            });
        } else {
          const relThreshold = 0.3 - 0.16 * sens;
          const notes = detectPolyphony(buf, ctx.sampleRate, { a4, fftSize: 16384, relThreshold });
          setState((s) => ({ ...s, activeNotes: notes, volume: vol, tick: s.tick + 1 }));
        }
      }
    } else {
      // Modo mono: analiza las muestras MÁS RECIENTES del buffer (el AnalyserNode
      // entrega las últimas fftSize muestras: lo nuevo está al final). Usar el inicio
      // significaría analizar audio ~300 ms viejo, cuando la nota ya decayó.
      const window = buf.subarray(buf.length - 4096);
      const clarityThreshold = 0.93 - 0.2 * sens;
      const minRms = 0.008 - 0.005 * sens;
      const res = detectPitch(window, ctx.sampleRate, { clarityThreshold, minRms });
      const midi = res.frequency > 0 ? freqToNearestMidi(res.frequency, a4) : null;
      const cents = res.frequency > 0 ? centsOff(res.frequency, a4) : 0;
      setState((s) => ({
        ...s,
        frequency: res.frequency,
        clarity: res.clarity,
        midi,
        cents,
        volume: Math.min(1, res.rms * 6),
        tick: s.tick + 1,
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
      // Contexto COMPARTIDO con la reproducción: entrada y salida en la misma sesión
      // de audio del sistema (evita que el SO silencie la salida al abrir el micro).
      const ctx = getSharedAudioContext();
      if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const analyser = ctx.createAnalyser();
      // Con ML usamos la ventana más larga disponible (~0.7 s a 44.1 kHz) para dar
      // más contexto al modelo; con el motor estándar basta 16384.
      analyser.fftSize = engineRef.current === 'ml' && modeRef.current === 'poly' ? 32768 : 16384;
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
