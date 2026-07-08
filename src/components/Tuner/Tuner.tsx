import { useMicrophone } from '../../audio/useMicrophone';
import { midiToName } from '../../audio/noteUtils';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Mic, MicOff } from 'lucide-react';

export default function Tuner() {
  const a4 = useSettingsStore((s) => s.a4);
  const naming = useSettingsStore((s) => s.naming);
  const mic = useMicrophone({ mode: 'mono', a4 });

  const cents = Math.max(-50, Math.min(50, mic.cents));
  const inTune = mic.midi != null && Math.abs(mic.cents) < 6;
  const needleAngle = (cents / 50) * 45; // -45..45 grados

  return (
    <div className="card p-6 flex flex-col items-center gap-4">
      <h3 className="text-lg font-semibold self-start">Afinador</h3>

      <div className="text-6xl font-bold tabular-nums h-20 flex items-center">
        {mic.midi != null ? (
          <span className={inTune ? 'text-piano-good' : 'text-piano-text'}>
            {midiToName(mic.midi, naming)}
          </span>
        ) : (
          <span className="text-piano-muted text-2xl">
            {mic.status === 'active' ? 'Toca una nota…' : 'Micrófono apagado'}
          </span>
        )}
      </div>

      {/* Aguja de afinación */}
      <div className="relative w-full max-w-xs h-24 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 text-xs text-piano-muted">
          <span>♭ -50</span>
          <span>0</span>
          <span>+50 ♯</span>
        </div>
        <div className="absolute left-1/2 bottom-2 h-2 w-2 -translate-x-1/2 rounded-full bg-piano-good" />
        <div
          className="absolute left-1/2 bottom-2 h-20 w-1 origin-bottom rounded-full transition-transform duration-100"
          style={{
            transform: `translateX(-50%) rotate(${needleAngle}deg)`,
            background: inTune ? '#34d399' : '#fbbf24',
          }}
        />
      </div>

      <div className="text-sm text-piano-muted h-5">
        {mic.midi != null && (inTune ? 'Afinado ✓' : `${cents > 0 ? '+' : ''}${cents.toFixed(0)} cents`)}
      </div>

      <button
        className={mic.status === 'active' ? 'btn-ghost' : 'btn-primary'}
        onClick={() => (mic.status === 'active' ? mic.stop() : mic.start())}
      >
        {mic.status === 'active' ? <MicOff size={18} /> : <Mic size={18} />}
        {mic.status === 'active' ? 'Detener' : 'Activar micrófono'}
      </button>
      {mic.error && <p className="text-piano-bad text-sm">{mic.error}</p>}
    </div>
  );
}
