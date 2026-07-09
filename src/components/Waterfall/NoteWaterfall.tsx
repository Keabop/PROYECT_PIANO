// Vista "cascada" estilo Synthesia: los bloques de nota (con su nombre Do/Re/Mi) caen
// hacia el teclado, alineados con su tecla.
// - Modo paso a paso (NoteWaterfall): la columna avanza al ACERTAR cada nota.
// - Modo fluido (FlowWaterfall): la posición depende del TIEMPO (playhead en beats).
// Estética: fondo casi negro, barras cian con brillo, rejilla sutil y chispas al acertar.

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { pitchClassName } from '../../audio/noteUtils';
import { keyboardLayout, MAX_KEY_PX } from '../Piano/PianoKeyboard';
import { useSettingsStore } from '../../store/useSettingsStore';

export const PX_PER_BEAT = 46;
export const BLOCK_GAP = 5;
export const MIN_BLOCK_H = 30;

// Paleta de la cascada (referencia Synthesia: cian sobre negro)
const C_PENDING_WHITE = '#2f9fe8';
const C_PENDING_BLACK = '#1878ba';
const C_TARGET = '#5ce7f7';
const C_HIT = '#34d399';
const C_MISS = '#f87171';
const BG = '#07080d';
const IMPACT = 'rgba(92,231,247,0.55)';

export interface WaterfallBlock {
  midi: number;
  seqIndex: number;
  x: number;
  y: number;
  w: number;
  h: number;
  black: boolean;
  isTarget: boolean;
}

export type FlowNoteState = 'pending' | 'hit' | 'missed';

/** Layout del modo paso a paso (pura y testeable): objetivo en la base, resto apilado. */
export function waterfallLayout(
  targets: number[],
  durations: number[] | undefined,
  index: number,
  from: number,
  to: number,
  height: number
): WaterfallBlock[] {
  const layout = keyboardLayout(from, to);
  const blocks: WaterfallBlock[] = [];
  let bottom = height;
  for (let i = index; i < targets.length; i++) {
    const rect = layout.keyRect(targets[i]);
    if (!rect) continue;
    const beats = durations?.[i] ?? 1;
    const h = Math.max(MIN_BLOCK_H, beats * PX_PER_BEAT - BLOCK_GAP);
    const y = bottom - h;
    blocks.push({ midi: targets[i], seqIndex: i, x: rect.x, y, w: rect.w, h, black: rect.black, isTarget: i === index });
    bottom = y - BLOCK_GAP;
    if (bottom < -PX_PER_BEAT * 2) break;
  }
  return blocks;
}

/** Layout del modo fluido (pura y testeable): la base toca la línea cuando playhead == offset. */
export function flowLayout(
  notes: number[],
  offsetsBeats: number[],
  durationsBeats: number[],
  playheadBeats: number,
  from: number,
  to: number,
  height: number,
  states: FlowNoteState[]
): WaterfallBlock[] {
  const layout = keyboardLayout(from, to);
  const blocks: WaterfallBlock[] = [];
  for (let i = 0; i < notes.length; i++) {
    const rect = layout.keyRect(notes[i]);
    if (!rect) continue;
    const h = Math.max(14, durationsBeats[i] * PX_PER_BEAT - 3);
    const bottom = height - (offsetsBeats[i] - playheadBeats) * PX_PER_BEAT;
    const y = bottom - h;
    if (bottom < -20 || y > height + 20) continue;
    const visibleH = Math.min(bottom, height) - y;
    if (visibleH <= 2) continue;
    blocks.push({
      midi: notes[i],
      seqIndex: i,
      x: rect.x,
      y,
      w: rect.w,
      h: visibleH,
      black: rect.black,
      isTarget: states[i] === 'pending' && Math.abs(offsetsBeats[i] - playheadBeats) < 1,
    });
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// Chispas de impacto (partículas al acertar una nota, como en los videos)
// ---------------------------------------------------------------------------

interface Spark {
  id: number;
  x: number;
}

function rand(seed: number): number {
  const v = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

function HitSparks({ sparks, baseY }: { sparks: Spark[]; baseY: number }) {
  return (
    <>
      {sparks.map((s) =>
        Array.from({ length: 7 }, (_, i) => {
          const a = rand(s.id * 13 + i) * Math.PI; // ángulo hacia arriba
          const dist = 14 + rand(s.id * 7 + i) * 26;
          const r = 1.2 + rand(s.id + i * 3) * 1.8;
          return (
            <motion.circle
              key={`${s.id}-${i}`}
              cx={s.x}
              cy={baseY}
              r={r}
              fill={i % 3 === 0 ? '#ffffff' : C_TARGET}
              initial={{ opacity: 0.95, cx: s.x, cy: baseY }}
              animate={{ opacity: 0, cx: s.x + Math.cos(a) * dist * (rand(s.id + i) > 0.5 ? 1 : -1), cy: baseY - Math.sin(a) * dist }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            />
          );
        })
      )}
    </>
  );
}

/** Gestión de la lista de chispas con auto-limpieza. */
function useSparks(): [Spark[], (x: number) => void] {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const idRef = useRef(1);
  const add = (x: number) => {
    const id = idRef.current++;
    setSparks((prev) => [...prev.slice(-6), { id, x }]);
    setTimeout(() => setSparks((prev) => prev.filter((s) => s.id !== id)), 650);
  };
  return [sparks, add];
}

// ---------------------------------------------------------------------------
// Piezas visuales compartidas
// ---------------------------------------------------------------------------

function Grid({ layout, height }: { layout: ReturnType<typeof keyboardLayout>; height: number }) {
  return (
    <>
      {layout.whites
        .filter((w) => w.midi % 12 === 0)
        .map((w) => (
          <line key={w.midi} x1={w.x} y1={0} x2={w.x} y2={height} stroke="rgba(255,255,255,0.05)" />
        ))}
    </>
  );
}

function ImpactStrip({ width, height }: { width: number; height: number }) {
  return (
    <>
      <rect x={0} y={height - 26} width={width} height={26} fill="rgba(0,0,0,0.4)" />
      <line x1={0} y1={height - 1} x2={width} y2={height - 1} stroke={IMPACT} strokeWidth={2} />
    </>
  );
}

function blockVisual(b: WaterfallBlock, state: FlowNoteState | 'pending') {
  const fill =
    state === 'hit' ? C_HIT : state === 'missed' ? C_MISS : b.isTarget ? C_TARGET : b.black ? C_PENDING_BLACK : C_PENDING_WHITE;
  const glow = b.isTarget || state === 'hit' || state === 'missed';
  // Barras más esbeltas que la tecla (estética de los videos), negras casi al ancho.
  const inset = b.black ? 0.06 : 0.14;
  const x = b.x + b.w * inset;
  const w = b.w * (1 - inset * 2);
  return { fill, glow, x, w };
}

// ---------------------------------------------------------------------------
// Cascada PASO A PASO
// ---------------------------------------------------------------------------

interface NoteWaterfallProps {
  targets: number[];
  durations?: number[];
  index: number;
  from: number;
  to: number;
  height?: number;
  done?: boolean;
}

export default function NoteWaterfall({ targets, durations, index, from, to, height = 250, done }: NoteWaterfallProps) {
  const naming = useSettingsStore((s) => s.naming);
  const layout = useMemo(() => keyboardLayout(from, to), [from, to]);
  const blocks = useMemo(
    () => (done ? [] : waterfallLayout(targets, durations, index, from, to, height)),
    [targets, durations, index, from, to, height, done]
  );
  const [sparks, addSpark] = useSparks();

  // Chispa al avanzar (nota anterior acertada).
  const prevIndexRef = useRef(index);
  useEffect(() => {
    if (index > prevIndexRef.current) {
      const justHit = targets[index - 1];
      const rect = layout.keyRect(justHit);
      if (rect) addSpark(rect.x + rect.w / 2);
    }
    prevIndexRef.current = index;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <div className="w-full overflow-hidden rounded-t-xl" style={{ background: BG }} data-testid="waterfall">
      <svg
        viewBox={`0 0 ${layout.width} ${height}`}
        width="100%"
        style={{ display: 'block', maxWidth: layout.whites.length * MAX_KEY_PX, marginInline: 'auto' }}
        aria-label="Notas en cascada"
      >
        <Grid layout={layout} height={height} />
        <ImpactStrip width={layout.width} height={height} />
        {blocks.map((b) => {
          const v = blockVisual(b, 'pending');
          return (
            <g
              key={b.seqIndex}
              style={{ transform: `translate(${v.x}px, ${b.y}px)`, transition: 'transform 0.22s ease-out' }}
            >
              <rect
                width={v.w}
                height={b.h}
                rx={4.5}
                fill={v.fill}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={b.isTarget ? 1.5 : 0.75}
                style={v.glow ? { filter: `drop-shadow(0 0 7px ${v.fill})` } : undefined}
              />
              {b.h >= 22 && v.w >= 14 && (
                <text
                  x={v.w / 2}
                  y={b.h - 8}
                  textAnchor="middle"
                  fontSize={b.black ? 9 : 11.5}
                  fontWeight={700}
                  fill={b.isTarget ? '#062126' : '#eaf7ff'}
                >
                  {pitchClassName(b.midi, naming)}
                </text>
              )}
            </g>
          );
        })}
        <HitSparks sparks={sparks} baseY={height - 6} />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cascada FLUIDA (Espérame / Corrido)
// ---------------------------------------------------------------------------

export function FlowWaterfall({
  notes,
  offsetsBeats,
  durationsBeats,
  playheadBeats,
  from,
  to,
  height = 300,
  states,
}: {
  notes: number[];
  offsetsBeats: number[];
  durationsBeats: number[];
  playheadBeats: number;
  from: number;
  to: number;
  height?: number;
  states: FlowNoteState[];
}) {
  const naming = useSettingsStore((s) => s.naming);
  const layout = useMemo(() => keyboardLayout(from, to), [from, to]);
  const blocks = flowLayout(notes, offsetsBeats, durationsBeats, playheadBeats, from, to, height, states);
  const [sparks, addSpark] = useSparks();

  // Chispas cuando una nota pasa a "hit".
  const prevStatesRef = useRef<FlowNoteState[]>(states);
  useEffect(() => {
    states.forEach((st, i) => {
      if (st === 'hit' && prevStatesRef.current[i] !== 'hit') {
        const rect = layout.keyRect(notes[i]);
        if (rect) addSpark(rect.x + rect.w / 2);
      }
    });
    prevStatesRef.current = states;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [states]);

  // Líneas de compás (cada 4 tiempos) que se mueven con la música.
  const measures: { y: number; n: number }[] = [];
  const firstBeat = Math.floor(playheadBeats / 4) * 4;
  for (let beat = firstBeat; ; beat += 4) {
    const y = height - (beat - playheadBeats) * PX_PER_BEAT;
    if (y < 0) break;
    if (y <= height && beat >= 0) measures.push({ y, n: beat / 4 + 1 });
  }

  return (
    <div className="w-full overflow-hidden rounded-t-xl" style={{ background: BG }} data-testid="flow-waterfall">
      <svg
        viewBox={`0 0 ${layout.width} ${height}`}
        width="100%"
        style={{ display: 'block', maxWidth: layout.whites.length * MAX_KEY_PX, marginInline: 'auto' }}
        aria-label="Notas en cascada continua"
      >
        <Grid layout={layout} height={height} />
        {measures.map((m) => (
          <g key={m.n}>
            <line x1={0} y1={m.y} x2={layout.width} y2={m.y} stroke="rgba(255,255,255,0.07)" />
            <text x={4} y={m.y - 4} fontSize={9} fill="rgba(255,255,255,0.3)">
              {m.n}
            </text>
          </g>
        ))}
        <ImpactStrip width={layout.width} height={height} />
        {blocks.map((b) => {
          const st = states[b.seqIndex];
          const v = blockVisual(b, st);
          return (
            <g key={b.seqIndex} transform={`translate(${v.x}, ${b.y})`}>
              <rect
                width={v.w}
                height={b.h}
                rx={4}
                fill={v.fill}
                stroke="rgba(255,255,255,0.22)"
                strokeWidth={b.isTarget ? 1.5 : 0.75}
                style={v.glow ? { filter: `drop-shadow(0 0 7px ${v.fill})` } : undefined}
              />
              {b.h >= 20 && v.w >= 14 && (
                <text
                  x={v.w / 2}
                  y={b.h - 6}
                  textAnchor="middle"
                  fontSize={b.black ? 9 : 11.5}
                  fontWeight={700}
                  fill={b.isTarget || st !== 'pending' ? '#062126' : '#eaf7ff'}
                >
                  {pitchClassName(b.midi, naming)}
                </text>
              )}
            </g>
          );
        })}
        <HitSparks sparks={sparks} baseY={height - 6} />
      </svg>
    </div>
  );
}
