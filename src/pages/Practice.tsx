import { useState } from 'react';
import { Music2, Piano } from 'lucide-react';
import type { Exercise } from '../data/curriculum';
import { buildScale } from '../theory/scales';
import { buildChord } from '../theory/chords';
import ExerciseRunner from '../practice/ExerciseRunner';
import PianoKeyboard from '../components/Piano/PianoKeyboard';
import { useMicrophone } from '../audio/useMicrophone';
import { midiToName } from '../audio/noteUtils';
import { useSettingsStore } from '../store/useSettingsStore';

interface Drill {
  id: string;
  label: string;
  make: () => Exercise;
}

const DRILLS: { group: string; items: Drill[] }[] = [
  {
    group: 'Escalas',
    items: [
      { id: 's-do', label: 'Do mayor', make: () => ({ kind: 'playSequence', id: 's-do', prompt: 'Toca la escala de Do mayor.', targets: buildScale(60, 'major'), showStaff: true }) },
      { id: 's-sol', label: 'Sol mayor', make: () => ({ kind: 'playSequence', id: 's-sol', prompt: 'Toca la escala de Sol mayor (Fa♯).', targets: buildScale(67, 'major') }) },
      { id: 's-fa', label: 'Fa mayor', make: () => ({ kind: 'playSequence', id: 's-fa', prompt: 'Toca la escala de Fa mayor (Si♭).', targets: buildScale(65, 'major') }) },
      { id: 's-lam', label: 'La menor', make: () => ({ kind: 'playSequence', id: 's-lam', prompt: 'Toca la escala de La menor natural.', targets: buildScale(69, 'naturalMinor') }) },
    ],
  },
  {
    group: 'Acordes',
    items: [
      { id: 'c-do', label: 'Do mayor', make: () => ({ kind: 'playChord', id: 'c-do', prompt: 'Toca el acorde de Do mayor (Do-Mi-Sol).', targets: buildChord(60, 'major') }) },
      { id: 'c-sol', label: 'Sol mayor', make: () => ({ kind: 'playChord', id: 'c-sol', prompt: 'Toca el acorde de Sol mayor (Sol-Si-Re).', targets: buildChord(67, 'major') }) },
      { id: 'c-fa', label: 'Fa mayor', make: () => ({ kind: 'playChord', id: 'c-fa', prompt: 'Toca el acorde de Fa mayor (Fa-La-Do).', targets: buildChord(65, 'major') }) },
      { id: 'c-lam', label: 'La menor', make: () => ({ kind: 'playChord', id: 'c-lam', prompt: 'Toca el acorde de La menor (La-Do-Mi).', targets: buildChord(69, 'minor') }) },
      { id: 'c-g7', label: 'Sol 7', make: () => ({ kind: 'playChord', id: 'c-g7', prompt: 'Toca Sol séptima (Sol-Si-Re-Fa).', targets: buildChord(67, 'dominant7') }) },
    ],
  },
  {
    group: 'Arpegios',
    items: [
      { id: 'a-do', label: 'Do mayor', make: () => ({ kind: 'playSequence', id: 'a-do', prompt: 'Toca el arpegio de Do mayor.', targets: [60, 64, 67, 72] }) },
      { id: 'a-lam', label: 'La menor', make: () => ({ kind: 'playSequence', id: 'a-lam', prompt: 'Toca el arpegio de La menor.', targets: [69, 72, 76, 81] }) },
    ],
  },
];

export default function Practice() {
  const [active, setActive] = useState<Exercise | null>(null);
  const [key, setKey] = useState(0);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Práctica libre</h1>
        <p className="text-piano-muted">Repasa escalas, acordes y arpegios, o toca libremente.</p>
      </header>

      {active ? (
        <div className="card p-5 flex flex-col gap-4">
          <button className="text-sm text-piano-muted self-start hover:text-piano-text" onClick={() => setActive(null)}>
            ← Elegir otro ejercicio
          </button>
          <ExerciseRunner key={key} exercise={active} onComplete={() => setKey((k) => k + 1)} />
        </div>
      ) : (
        <>
          {DRILLS.map((section) => (
            <div key={section.group} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-piano-muted flex items-center gap-2">
                <Music2 size={16} /> {section.group}
              </h2>
              <div className="flex flex-wrap gap-2">
                {section.items.map((d) => (
                  <button
                    key={d.id}
                    className="btn-ghost"
                    onClick={() => {
                      setActive(d.make());
                      setKey((k) => k + 1);
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <FreePlay />
        </>
      )}
    </div>
  );
}

function FreePlay() {
  const a4 = useSettingsStore((s) => s.a4);
  const naming = useSettingsStore((s) => s.naming);
  const detectionEngine = useSettingsStore((s) => s.detectionEngine);
  const mic = useMicrophone({ mode: 'poly', engine: detectionEngine, a4 });
  const detected = mic.activeNotes.map((n) => n.midi);

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Piano size={18} className="text-piano-primary" />
        <h3 className="text-lg font-semibold">Juego libre</h3>
      </div>
      <p className="text-sm text-piano-muted">
        Activa el micrófono y toca lo que quieras: la app resaltará en verde las notas que escucha (detección
        polifónica, funciona también con acordes).
      </p>
      <PianoKeyboard from={48} to={84} detected={detected} detectedOk />
      <div className="min-h-[24px] text-sm" data-testid="freeplay-notes">
        {detected.length > 0 ? (
          <span className="text-piano-good font-medium">Escuchando: {detected.map((m) => midiToName(m, naming)).join('  ·  ')}</span>
        ) : (
          <span className="text-piano-muted">
            {mic.status === 'active'
              ? detectionEngine === 'ml' && mic.mlStatus !== 'ready'
                ? 'Cargando motor ML (Basic Pitch)…'
                : 'Toca algo en tu piano…'
              : 'Micrófono apagado'}
          </span>
        )}
      </div>
      {detectionEngine === 'ml' && (
        <span className="chip">🧠 Motor ML: {mic.mlStatus === 'ready' ? 'listo' : mic.mlStatus === 'error' ? 'error (usando estándar)' : 'cargando…'}</span>
      )}
      <button className={mic.status === 'active' ? 'btn-ghost self-start' : 'btn-primary self-start'} onClick={() => (mic.status === 'active' ? mic.stop() : mic.start())}>
        {mic.status === 'active' ? 'Detener micrófono' : 'Activar micrófono'}
      </button>
      {mic.error && <p className="text-sm text-piano-bad">{mic.error}</p>}
    </div>
  );
}
