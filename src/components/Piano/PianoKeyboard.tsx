import { useMemo } from 'react';
import { isBlackKey, pitchClassName } from '../../audio/noteUtils';
import { useSettingsStore } from '../../store/useSettingsStore';

interface PianoKeyboardProps {
  from?: number; // MIDI (por defecto C3)
  to?: number; // MIDI (por defecto C6)
  highlight?: number[]; // notas objetivo (azul)
  detected?: number[]; // notas sonando ahora (mic)
  detectedOk?: boolean; // color de "detected": true=verde, false=ámbar
  labels?: boolean; // mostrar nombres en las teclas
  onPlay?: (midi: number) => void; // al pulsar una tecla
  height?: number;
}

export const WHITE_W = 34;
const WHITE_H = 150;
export const BLACK_W = 21;
const BLACK_H = 96;

export interface KeyboardLayout {
  whites: { midi: number; x: number }[];
  blacks: { midi: number; x: number }[];
  width: number;
  /** Rectángulo horizontal (x, ancho) de una tecla — para alinear otras vistas (cascada). */
  keyRect: (midi: number) => { x: number; w: number; black: boolean } | null;
}

/** Geometría del teclado, compartida entre PianoKeyboard y la vista de cascada. */
export function keyboardLayout(from: number, to: number): KeyboardLayout {
  const whites: { midi: number; x: number }[] = [];
  const blacks: { midi: number; x: number }[] = [];
  let whiteIndex = 0;
  for (let midi = from; midi <= to; midi++) {
    if (isBlackKey(midi)) {
      blacks.push({ midi, x: whiteIndex * WHITE_W - BLACK_W / 2 });
    } else {
      whites.push({ midi, x: whiteIndex * WHITE_W });
      whiteIndex++;
    }
  }
  const width = whiteIndex * WHITE_W;
  const map = new Map<number, { x: number; w: number; black: boolean }>();
  for (const k of whites) map.set(k.midi, { x: k.x + 1, w: WHITE_W - 2, black: false });
  for (const k of blacks) map.set(k.midi, { x: k.x, w: BLACK_W, black: true });
  return { whites, blacks, width, keyRect: (midi) => map.get(midi) ?? null };
}

export default function PianoKeyboard({
  from = 48,
  to = 84,
  highlight = [],
  detected = [],
  detectedOk = true,
  labels = false,
  onPlay,
  height,
}: PianoKeyboardProps) {
  const naming = useSettingsStore((s) => s.naming);
  const highlightSet = useMemo(() => new Set(highlight), [highlight]);
  const detectedSet = useMemo(() => new Set(detected), [detected]);

  const { whites, blacks, width } = useMemo(() => keyboardLayout(from, to), [from, to]);

  const scale = height ? height / WHITE_H : 1;
  const viewH = WHITE_H;

  function keyFill(midi: number, black: boolean): string {
    if (detectedSet.has(midi)) return detectedOk ? '#34d399' : '#fbbf24';
    if (highlightSet.has(midi)) return '#7c5cff';
    return black ? '#1b1c2b' : '#f6f6fb';
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${viewH}`}
        width={height ? width * scale : '100%'}
        height={height ?? undefined}
        style={{ maxWidth: '100%', display: 'block', touchAction: 'manipulation' }}
        role="img"
        aria-label="Teclado de piano"
      >
        {/* Teclas blancas */}
        {whites.map(({ midi, x }) => {
          const isHi = highlightSet.has(midi);
          const isDet = detectedSet.has(midi);
          return (
            <g key={midi} onPointerDown={() => onPlay?.(midi)} style={{ cursor: onPlay ? 'pointer' : 'default' }}>
              <rect
                x={x + 1}
                y={0}
                width={WHITE_W - 2}
                height={WHITE_H}
                rx={4}
                fill={keyFill(midi, false)}
                stroke="#c7c7d6"
                strokeWidth={1}
              />
              {(labels || isHi || isDet) && (
                <text
                  x={x + WHITE_W / 2}
                  y={WHITE_H - 12}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill={isHi || isDet ? '#0f1020' : '#6b6e88'}
                >
                  {pitchClassName(midi, naming)}
                </text>
              )}
            </g>
          );
        })}
        {/* Teclas negras (encima) */}
        {blacks.map(({ midi, x }) => (
          <g key={midi} onPointerDown={() => onPlay?.(midi)} style={{ cursor: onPlay ? 'pointer' : 'default' }}>
            <rect
              x={x}
              y={0}
              width={BLACK_W}
              height={BLACK_H}
              rx={3}
              fill={keyFill(midi, true)}
              stroke="#000"
              strokeWidth={0.5}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
