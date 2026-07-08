import { useState } from 'react';
import Metronome from '../components/Metronome/Metronome';
import Tuner from '../components/Tuner/Tuner';
import PianoKeyboard from '../components/Piano/PianoKeyboard';
import { playMidi } from '../audio/synth';
import { useSettingsStore } from '../store/useSettingsStore';

export default function Tools() {
  const a4 = useSettingsStore((s) => s.a4);
  const naming = useSettingsStore((s) => s.naming);
  const theme = useSettingsStore((s) => s.theme);
  const setNaming = useSettingsStore((s) => s.setNaming);
  const setA4 = useSettingsStore((s) => s.setA4);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const [labels, setLabels] = useState(true);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Herramientas</h1>
        <p className="text-piano-muted">Afinador, metrónomo, teclado de referencia y ajustes.</p>
      </header>

      <Tuner />
      <Metronome />

      {/* Teclado de referencia */}
      <div className="card p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Teclado de referencia</h3>
          <label className="flex items-center gap-2 text-sm text-piano-muted">
            <input type="checkbox" checked={labels} onChange={(e) => setLabels(e.target.checked)} className="accent-piano-primary" />
            Nombres
          </label>
        </div>
        <PianoKeyboard from={48} to={84} labels={labels} onPlay={(m) => playMidi(m, 0.6, a4)} />
        <p className="text-xs text-piano-muted">Pulsa las teclas para escuchar cada nota.</p>
      </div>

      {/* Ajustes */}
      <div className="card p-5 flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Ajustes</h3>

        <div className="flex items-center justify-between">
          <span className="text-sm">Nombres de notas</span>
          <div className="flex gap-2">
            <button className={`px-3 py-1 rounded-lg text-sm ${naming === 'es' ? 'bg-piano-primary text-white' : 'bg-white/5'}`} onClick={() => setNaming('es')}>
              Do Re Mi
            </button>
            <button className={`px-3 py-1 rounded-lg text-sm ${naming === 'en' ? 'bg-piano-primary text-white' : 'bg-white/5'}`} onClick={() => setNaming('en')}>
              C D E
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Afinación de referencia (A4)</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={415}
              max={466}
              value={a4}
              onChange={(e) => setA4(Number(e.target.value) || 440)}
              className="w-20 rounded-lg bg-white/5 px-2 py-1 text-right"
            />
            <span className="text-sm text-piano-muted">Hz</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Tema</span>
          <button className="px-3 py-1 rounded-lg text-sm bg-white/5" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? '🌙 Oscuro' : '☀️ Claro'}
          </button>
        </div>
      </div>
    </div>
  );
}
