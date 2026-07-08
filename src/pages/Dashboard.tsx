import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Star, ArrowRight, Sliders, Ear, Dumbbell, Music } from 'lucide-react';
import { flatLessons, lessonKey, totalLessons } from '../data/curriculum';
import { useProgressStore } from '../store/useProgressStore';

export default function Dashboard() {
  const lessons = useProgressStore((s) => s.lessons);
  const xp = useProgressStore((s) => s.xp);
  const streak = useProgressStore((s) => s.streak);

  const all = flatLessons();
  const completedCount = Object.keys(lessons).length;
  const next = all.find(({ module, lesson }) => !lessons[lessonKey(module.id, lesson.id)]);
  const pct = Math.round((completedCount / totalLessons()) * 100);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Hola 👋</h1>
        <p className="text-piano-muted">¿List@ para tocar hoy?</p>
      </header>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<Flame className="text-orange-400" />} value={streak} label="días de racha" />
        <Stat icon={<Star className="text-piano-warn" />} value={xp} label="XP" />
        <Stat icon={<span className="text-piano-accent font-bold">{pct}%</span>} value={`${completedCount}/${totalLessons()}`} label="lecciones" />
      </div>

      {/* Continuar */}
      <div className="card p-6">
        <p className="text-sm text-piano-muted mb-1">{next ? 'Continúa donde lo dejaste' : '¡Has completado todo! 🎉'}</p>
        {next ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{next.module.emoji}</span>
              <div>
                <h2 className="text-lg font-semibold leading-tight">{next.lesson.title}</h2>
                <p className="text-sm text-piano-muted">{next.module.title}</p>
              </div>
            </div>
            <Link className="btn-primary" to={`/leccion/${next.module.id}/${next.lesson.id}`}>
              Empezar lección <ArrowRight size={18} />
            </Link>
          </>
        ) : (
          <Link className="btn-primary" to="/practica">
            Ir a práctica libre <ArrowRight size={18} />
          </Link>
        )}
      </div>

      {/* Barra de progreso global */}
      <div>
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-piano-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-4 gap-3">
        <QuickLink to="/canciones" icon={<Music />} label="Canciones" />
        <QuickLink to="/practica" icon={<Dumbbell />} label="Práctica" />
        <QuickLink to="/oido" icon={<Ear />} label="Oído" />
        <QuickLink to="/herramientas" icon={<Sliders />} label="Ajustes" />
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: ReactNode; label: string }) {
  return (
    <div className="card p-4 flex flex-col items-center gap-1 text-center">
      <div className="text-xl h-7 flex items-center">{icon}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[11px] text-piano-muted leading-tight">{label}</div>
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link to={to} className="card p-4 flex flex-col items-center gap-2 hover:bg-piano-surface2 transition">
      <span className="text-piano-primary">{icon}</span>
      <span className="text-sm">{label}</span>
    </Link>
  );
}
