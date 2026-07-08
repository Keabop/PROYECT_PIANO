import { describe, expect, it } from 'vitest';
import { BLOCK_GAP, MIN_BLOCK_H, PX_PER_BEAT, waterfallLayout } from './NoteWaterfall';
import { keyboardLayout } from '../Piano/PianoKeyboard';

const FROM = 60; // C4
const TO = 72; // C5
const H = 250;

describe('waterfallLayout (vista cascada)', () => {
  it('el bloque objetivo descansa sobre el teclado y los demás se apilan arriba', () => {
    const blocks = waterfallLayout([60, 62, 64], [1, 1, 1], 0, FROM, TO, H);
    expect(blocks[0].isTarget).toBe(true);
    expect(blocks[0].y + blocks[0].h).toBe(H); // base tocando la línea de impacto
    // Cada bloque siguiente termina donde empieza el anterior (menos el hueco).
    expect(blocks[1].y + blocks[1].h).toBe(blocks[0].y - BLOCK_GAP);
    expect(blocks[2].y + blocks[2].h).toBe(blocks[1].y - BLOCK_GAP);
  });

  it('avanza: con index=1 el segundo se vuelve objetivo', () => {
    const blocks = waterfallLayout([60, 62, 64], undefined, 1, FROM, TO, H);
    expect(blocks[0].midi).toBe(62);
    expect(blocks[0].isTarget).toBe(true);
    expect(blocks.some((b) => b.midi === 60)).toBe(false); // la ya tocada desaparece
  });

  it('la altura del bloque refleja la duración en tiempos', () => {
    const blocks = waterfallLayout([60, 62], [2, 0.25], 0, FROM, TO, H);
    expect(blocks[0].h).toBe(2 * PX_PER_BEAT - BLOCK_GAP);
    expect(blocks[1].h).toBe(MIN_BLOCK_H); // muy corta -> altura mínima legible
  });

  it('los bloques quedan alineados horizontalmente con su tecla', () => {
    const layout = keyboardLayout(FROM, TO);
    const blocks = waterfallLayout([61, 64], undefined, 0, FROM, TO, H); // Do#4 (negra) y Mi4
    expect(blocks[0].x).toBe(layout.keyRect(61)!.x);
    expect(blocks[0].black).toBe(true);
    expect(blocks[0].w).toBe(layout.keyRect(61)!.w);
    expect(blocks[1].x).toBe(layout.keyRect(64)!.x);
    expect(blocks[1].black).toBe(false);
  });

  it('notas fuera del rango del teclado se omiten sin romper', () => {
    const blocks = waterfallLayout([60, 100, 64], undefined, 0, FROM, TO, H);
    expect(blocks.map((b) => b.midi)).toEqual([60, 64]);
  });
});
