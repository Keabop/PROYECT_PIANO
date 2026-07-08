import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Music, Piano, ShieldCheck } from 'lucide-react';
import MicSetup from '../components/MicSetup/MicSetup';
import { useSettingsStore } from '../store/useSettingsStore';

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);

  function finish() {
    setOnboarded(true);
    navigate('/');
  }

  const steps = [
    <Welcome key="w" onNext={() => setStep(1)} />,
    <NeedPiano key="p" onNext={() => setStep(2)} />,
    <MicStep key="m" onFinish={finish} />,
  ];

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 w-10 rounded-full transition ${i <= step ? 'bg-piano-primary' : 'bg-white/10'}`} />
          ))}
        </div>
        <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {steps[step]}
        </motion.div>
      </div>
    </div>
  );
}

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="card p-8 text-center flex flex-col items-center gap-4">
      <div className="text-6xl">🎹</div>
      <h1 className="text-2xl font-bold">Bienvenido a PianoApp</h1>
      <p className="text-piano-muted">
        Aprende piano de principiante a intermedio, a tu ritmo. La app <b>escucha tu piano</b> por el micrófono y
        te corrige mientras tocas, como un profesor particular.
      </p>
      <button className="btn-primary" onClick={onNext}>
        Empezar <ArrowRight size={18} />
      </button>
    </div>
  );
}

function NeedPiano({ onNext }: { onNext: () => void }) {
  return (
    <div className="card p-8 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Piano className="text-piano-primary" size={28} />
        <h2 className="text-xl font-bold">Necesitas un piano o teclado</h2>
      </div>
      <p className="text-piano-muted">
        Esta app está pensada para aprender con tu instrumento real. Puedes usar:
      </p>
      <ul className="flex flex-col gap-2 text-sm">
        <li className="flex items-center gap-2"><Music size={16} className="text-piano-accent" /> Piano acústico</li>
        <li className="flex items-center gap-2"><Music size={16} className="text-piano-accent" /> Piano digital</li>
        <li className="flex items-center gap-2"><Music size={16} className="text-piano-accent" /> Teclado (mínimo 49 teclas recomendado)</li>
      </ul>
      <div className="flex items-start gap-2 text-sm text-piano-muted rounded-xl bg-white/5 p-3">
        <ShieldCheck size={18} className="text-piano-good shrink-0 mt-0.5" />
        Tu progreso se guarda solo en este dispositivo y el audio del micrófono nunca sale de él.
      </div>
      <button className="btn-primary self-start" onClick={onNext}>
        Ya tengo mi piano <ArrowRight size={18} />
      </button>
    </div>
  );
}

function MicStep({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <MicSetup />
      <div className="card p-4 text-sm text-piano-muted">
        Consejo: coloca el dispositivo cerca del piano, en un sitio silencioso. Podrás ajustar todo esto luego.
      </div>
      <button className="btn-primary self-center" onClick={onFinish}>
        Ir a mis lecciones <ArrowRight size={18} />
      </button>
    </div>
  );
}
