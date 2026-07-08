import { useEffect } from 'react';
import { Mic, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useMicrophone } from '../../audio/useMicrophone';
import { midiToName } from '../../audio/noteUtils';
import { useSettingsStore } from '../../store/useSettingsStore';

interface MicSetupProps {
  onGranted?: () => void;
}

/** Flujo de permiso de micrófono con una prueba en vivo. */
export default function MicSetup({ onGranted }: MicSetupProps) {
  const a4 = useSettingsStore((s) => s.a4);
  const naming = useSettingsStore((s) => s.naming);
  const setMicGranted = useSettingsStore((s) => s.setMicGranted);
  const mic = useMicrophone({ mode: 'mono', a4 });

  useEffect(() => {
    if (mic.status === 'active') {
      setMicGranted(true);
      onGranted?.();
    }
  }, [mic.status, setMicGranted, onGranted]);

  const heard = mic.midi != null && mic.clarity > 0.9;

  return (
    <div className="card p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="grid place-items-center h-11 w-11 rounded-full bg-piano-primary/20 text-piano-primary">
          <Mic size={22} />
        </div>
        <div>
          <h3 className="font-semibold">Prueba tu micrófono</h3>
          <p className="text-sm text-piano-muted">Toca cualquier tecla de tu piano.</p>
        </div>
      </div>

      {mic.status !== 'active' ? (
        <button className="btn-primary self-start" onClick={mic.start}>
          <Mic size={18} /> Dar permiso y probar
        </button>
      ) : (
        <div
          className={`rounded-xl p-4 flex items-center gap-3 transition ${
            heard ? 'bg-piano-good/15 text-piano-good' : 'bg-white/5 text-piano-muted'
          }`}
        >
          {heard ? <CheckCircle2 size={22} /> : <div className="h-3 w-3 rounded-full bg-piano-warn animate-pulse" />}
          <span className="text-lg font-semibold">
            {heard ? `¡Te escucho! Nota: ${midiToName(mic.midi!, naming)}` : 'Escuchando… toca una tecla'}
          </span>
        </div>
      )}

      {(mic.status === 'denied' || mic.status === 'unsupported' || mic.status === 'error') && (
        <div className="flex items-start gap-2 text-sm text-piano-warn">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span>
            {mic.error} Puedes seguir usando la app tocando el teclado en pantalla; activa el micro más tarde
            desde Herramientas. (El micrófono requiere HTTPS o localhost).
          </span>
        </div>
      )}
    </div>
  );
}
