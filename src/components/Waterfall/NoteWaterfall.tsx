// Vista "cascada" estilo Synthesia: los bloques de nota (con su nombre Do/Re/Mi) caen
// hacia el teclado, alineados con su tecla. Como la práctica es "a tu ritmo", la
// cascada avanza cuando ACIERTAS la nota (no con reloj): el objetivo actual descansa
// tocando el teclado y, al tocarlo bien, toda la columna se desliza hacia abajo.

import { useMemo } from 'react';
import { pitchClassName } from '../../audio/noteUtils';
import { keyboardLayout } from '../Piano/PianoKeyboard';
import { useSettingsStore } from '../../store/useSettingsStore';

export const PX_PER_BEAT = 46;
export const BLOCK_GAP = 5;
export const MIN_BLOCK_H = 30;

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

/**
 * Posiciones de los bloques pendientes (índice >= index), pura y testeable.
 * El bloque objetivo queda con su base en `height` (el borde del teclado);
 * los siguientes se apilan hacia arriba según su duración en tiempos.
 */
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
  let bottom = height; // borde inferior del siguiente bloque a colocar
  for (let i = index; i < targets.length; i++) {
    const rect = layout.keyRect(targets[i]);
    if (!rect) continue;
    const beats = durations?.[i] ?? 1;
    const h = Math.max(MIN_BLOCK_H, beats * PX_PER_BEAT - BLOCK_GAP);
    const y = bottom - h;
    blocks.push({ midi: targets[i], seqIndex: i, x: rect.x, y, w: rect.w, h, black: rect.black, isTarget: i === index });
    bottom = y - BLOCK_GAP;
    if (bottom < -PX_PER_BEAT * 2) break; // lo que queda muy por encima no se dibuja
  }
  return blocks;
}

interface NoteWaterfallProps {
  targets: number[];
  durations?: number[];
  index: number; // posición actual en la secuencia
  from: number;
  to: number;
  height?: number;
  done?: boolean;
}

export default function NoteWaterfall({ targets, durations, index, from, to, height = 250, done }: NoteWaterfallProps) {
  const naming = useSettingsStore((s) => s.naming);
  const width = useMemo(() => keyboardLayout(from, to).width, [from, to]);
  const blocks = useMemo(
    () => (done ? [] : waterfallLayout(targets, durations, index, from, to, height)),
    [targets, durations, index, from, to, height, done]
  );

  return (
    <div className="w-full overflow-hidden rounded-t-xl bg-black/30" data-testid="waterfall">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block' }} aria-label="Notas en cascada">
        {/* Guías de octava (líneas en cada Do) */}
        {keyboardLayout(from, to)
          .whites.filter((w) => w.midi % 12 === 0)
          .map((w) => (
            <line key={w.midi} x1={w.x} y1={0} x2={w.x} y2={height} stroke="rgba(255,255,255,0.06)" />
          ))}
        {/* Línea de impacto */}
        <line x1={0} y1={height - 1} x2={width} y2={height - 1} stroke="rgba(34,211,238,0.5)" strokeWidth={2} />

        {blocks.map((b) => (
          <g
            key={b.seqIndex}
            style={{ transform: `translate(${b.x}px, ${b.y}px)`, transition: 'transform 0.22s ease-out' }}
          >
            <rect
              width={b.w}
              height={b.h}
              rx={6}
              fill={b.isTarget ? '#22d3ee' : b.black ? '#5b3fd6' : '#7c5cff'}
              stroke={b.isTarget ? '#67e8f9' : 'rgba(255,255,255,0.25)'}
              strokeWidth={b.isTarget ? 2 : 1}
            />
            {b.h >= 22 && (
              <text
                x={b.w / 2}
                y={b.h - 8}
                textAnchor="middle"
                fontSize={b.black ? 10 : 12}
                fontWeight={700}
                fill={b.isTarget ? '#0f1020' : '#ffffff'}
              >
                {pitchClassName(b.midi, naming)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
