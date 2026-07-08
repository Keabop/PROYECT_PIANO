import { describe, expect, it } from 'vitest';
import { centsOff, freqToNearestMidi, midiToFreq, midiToName, nameToMidi, pitchClass } from './noteUtils';

describe('noteUtils', () => {
  it('convierte MIDI a frecuencia (A4=440)', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 3);
    expect(midiToFreq(60)).toBeCloseTo(261.626, 2); // Do central
    expect(midiToFreq(72)).toBeCloseTo(523.251, 2);
  });

  it('convierte frecuencia a la nota MIDI más cercana', () => {
    expect(freqToNearestMidi(440)).toBe(69);
    expect(freqToNearestMidi(261.63)).toBe(60);
    expect(freqToNearestMidi(329.63)).toBe(64); // Mi4
  });

  it('nombra las notas en español e inglés', () => {
    expect(midiToName(60, 'es')).toBe('Do4');
    expect(midiToName(60, 'en')).toBe('C4');
    expect(midiToName(69, 'es')).toBe('La4');
    expect(midiToName(61, 'en')).toBe('C#4');
  });

  it('calcula cents de desviación', () => {
    expect(centsOff(440)).toBeCloseTo(0, 1);
    // ~un tercio de semitono por encima de La4 (448 Hz ≈ +31 cents)
    expect(centsOff(448)).toBeGreaterThan(20);
    expect(centsOff(448)).toBeLessThan(45);
    // ligeramente por debajo
    expect(centsOff(437)).toBeLessThan(0);
  });

  it('convierte nombres a MIDI', () => {
    expect(nameToMidi('C4')).toBe(60);
    expect(nameToMidi('A4')).toBe(69);
    expect(nameToMidi('Do4')).toBe(60);
  });

  it('calcula la clase de altura', () => {
    expect(pitchClass(60)).toBe(0);
    expect(pitchClass(72)).toBe(0);
    expect(pitchClass(69)).toBe(9);
  });
});
