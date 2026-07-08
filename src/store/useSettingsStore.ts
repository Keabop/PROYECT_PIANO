// Ajustes de usuario, persistidos en localStorage.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NoteNaming } from '../audio/noteUtils';

export type DetectionEngine = 'standard' | 'ml';

interface SettingsState {
  onboarded: boolean;
  micGranted: boolean;
  a4: number;
  naming: NoteNaming;
  theme: 'dark' | 'light';
  micSensitivity: number; // 0..1, ajusta umbrales (0 = estricto, 1 = permisivo)
  detectionEngine: DetectionEngine; // motor para acordes (poly)
  setOnboarded: (v: boolean) => void;
  setMicGranted: (v: boolean) => void;
  setA4: (v: number) => void;
  setNaming: (v: NoteNaming) => void;
  setTheme: (v: 'dark' | 'light') => void;
  setMicSensitivity: (v: number) => void;
  setDetectionEngine: (v: DetectionEngine) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      onboarded: false,
      micGranted: false,
      a4: 440,
      naming: 'es',
      theme: 'dark',
      micSensitivity: 0.5,
      detectionEngine: 'standard',
      setOnboarded: (v) => set({ onboarded: v }),
      setMicGranted: (v) => set({ micGranted: v }),
      setA4: (v) => set({ a4: v }),
      setNaming: (v) => set({ naming: v }),
      setTheme: (v) => set({ theme: v }),
      setMicSensitivity: (v) => set({ micSensitivity: v }),
      setDetectionEngine: (v) => set({ detectionEngine: v }),
    }),
    { name: 'pianoapp-settings' }
  )
);
