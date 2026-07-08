import { describe, expect, it } from 'vitest';
import { buildScale } from './scales';
import { buildChord } from './chords';

describe('escalas', () => {
  it('construye Do mayor (todas blancas)', () => {
    expect(buildScale(60, 'major')).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
  });

  it('construye La menor natural', () => {
    expect(buildScale(69, 'naturalMinor')).toEqual([69, 71, 72, 74, 76, 77, 79, 81]);
  });
});

describe('acordes', () => {
  it('construye la tríada de Do mayor', () => {
    expect(buildChord(60, 'major')).toEqual([60, 64, 67]);
  });

  it('construye la tríada de Do menor', () => {
    expect(buildChord(60, 'minor')).toEqual([60, 63, 67]);
  });

  it('aplica inversiones', () => {
    expect(buildChord(60, 'major', 1)).toEqual([64, 67, 72]); // 1ª inversión
    expect(buildChord(60, 'major', 2)).toEqual([67, 72, 76]); // 2ª inversión
  });

  it('construye Sol7 (dominante)', () => {
    expect(buildChord(67, 'dominant7')).toEqual([67, 71, 74, 77]);
  });
});
