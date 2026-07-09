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
const WHITE_H = 172; // proporción realista (más esbelta que ancha)
export const BLACK_W = 21;
const BLACK_H = 108;
/** Ancho máximo EN PANTALLA de una tecla blanca: evita teclas gigantes en escritorio
 *  cuando el rango es corto (el SVG escala al ancho del contenedor). */
export const MAX_KEY_PX = 52;

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

  // Color de resaltado (si lo hay); null = tecla en reposo con su degradado realista.
  function overlayFill(midi: number): string | null {
    if (detectedSet.has(midi)) return detectedOk ? '#34d399' : '#fbbf24';
    if (highlightSet.has(midi)) return '#38bdf8';
    return null;
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${viewH}`}
        width={height ? width * scale : '100%'}
        height={height ?? undefined}
        style={{
          maxWidth: height ? '100%' : whites.length * MAX_KEY_PX,
          display: 'block',
          marginInline: 'auto',
          touchAction: 'manipulation',
        }}
        role="img"
        aria-label="Teclado de piano"
      >
        <defs>
          {/* Tecla blanca: sombra del atril arriba, marfil brillante abajo */}
          <linearGradient id="pk-white" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8e93a0" />
            <stop offset="0.045" stopColor="#e6e8ee" />
            <stop offset="0.75" stopColor="#f6f7fa" />
            <stop offset="1" stopColor="#dcdee6" />
          </linearGradient>
          {/* Tecla negra: cuerpo oscuro con cara frontal iluminada */}
          <linearGradient id="pk-black" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0c0d12" />
            <stop offset="0.7" stopColor="#22242d" />
            <stop offset="0.86" stopColor="#41444f" />
            <stop offset="1" stopColor="#2a2c35" />
          </linearGradient>
        </defs>

        {/* Fondo oscuro: los huecos entre teclas */}
        <rect x={0} y={0} width={width} height={WHITE_H} fill="#0a0b10" />

        {/* Teclas blancas */}
        {whites.map(({ midi, x }) => {
          const overlay = overlayFill(midi);
          const isLit = overlay != null;
          return (
            <g key={midi} onPointerDown={() => onPlay?.(midi)} style={{ cursor: onPlay ? 'pointer' : 'default' }}>
              <rect
                x={x + 0.75}
                y={0}
                width={WHITE_W - 1.5}
                height={WHITE_H - 1}
                rx={2.5}
                fill={overlay ?? 'url(#pk-white)'}
                style={isLit ? { filter: `drop-shadow(0 0 6px ${overlay})` } : undefined}
              />
              {(labels || isLit) && (
                <text
                  x={x + WHITE_W / 2}
                  y={WHITE_H - 11}
                  textAnchor="middle"
                  fontSize={10.5}
                  fontWeight={600}
                  fill={isLit ? '#0f1020' : '#9095a3'}
                >
                  {pitchClassName(midi, naming)}
                </text>
              )}
            </g>
          );
        })}

        {/* Teclas negras (encima) */}
        {blacks.map(({ midi, x }) => {
          const overlay = overlayFill(midi);
          const isLit = overlay != null;
          return (
            <g key={midi} onPointerDown={() => onPlay?.(midi)} style={{ cursor: onPlay ? 'pointer' : 'default' }}>
              <rect
                x={x}
                y={0}
                width={BLACK_W}
                height={BLACK_H}
                rx={2.5}
                fill={overlay ?? 'url(#pk-black)'}
                stroke="#000"
                strokeWidth={0.75}
                style={isLit ? { filter: `drop-shadow(0 0 6px ${overlay})` } : undefined}
              />
              {isLit && (
                <text
                  x={x + BLACK_W / 2}
                  y={BLACK_H - 8}
                  textAnchor="middle"
                  fontSize={8.5}
                  fontWeight={700}
                  fill="#0f1020"
                >
                  {pitchClassName(midi, naming)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
