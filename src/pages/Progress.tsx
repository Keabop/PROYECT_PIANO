import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Flame, Lock, MapPin, RotateCcw, Star, Trophy } from 'lucide-react';
import { ACHIEVEMENTS, useProgressStore } from '../store/useProgressStore';
import { MODULES, lessonKey, totalLessons } from '../data/curriculum';
import { evaluateJourney } from '../data/journey';

export default function Progress() {
  const lessons = useProgressStore((s) => s.lessons);
  const xp = useProgressStore((s) => s.xp);
  const streak = useProgressStore((s) => s.streak);
  const achievements = useProgressStore((s) => s.achievements);
  const reset = useProgressStore((s) => s.reset);

  const completed = Object.keys(lessons).length;
  const totalStars = Object.values(lessons).reduce((sum, r) => sum + r.stars, 0);
  const maxStars = totalLessons() * 3;
  const journey = evaluateJourney(lessons);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy /> Tu progreso
        </h1>
      </header>

      {/* El Camino: de aprendiz a intermedio */}
      <div className="card p-5">
        <h2 className="font-semibold mb-1 flex items-center gap-2">
          <MapPin size={18} className="text-piano-primary" /> El Camino: de aprendiz a intermedio
        </h2>
        <p className="text-sm text-piano-muted mb-4">
          {journey.completed
            ? '¡Camino completado! Eres oficialmente pianista de nivel intermedio. 🎉'
            : `Estás en la fase ${journey.currentPhase} de 6.`}
        </p>
        <div className="flex flex-col gap-3">
          {journey.phases.map(({ phase, done, missing, progress }) => {
            const isCurrent = phase.num === journey.currentPhase && !journey.completed;
            const locked = phase.num > journey.currentPhase;
            return (
              <div
                key={phase.num}
                className={`rounded-xl p-4 ${
                  isCurrent ? 'bg-piano-primary/10 ring-1 ring-piano-primary/40' : 'bg-white/5'
                } ${locked ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {done ? (
                    <CheckCircle2 size={20} className="text-piano-good shrink-0" />
                  ) : locked ? (
                    <Lock size={18} className="text-piano-muted shrink-0" />
                  ) : (
                    <span className="h-5 w-5 grid place-items-center rounded-full bg-piano-primary text-[11px] font-bold shrink-0">
                      {phase.num}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {phase.emoji} Fase {phase.num}: {phase.title}
                    </p>
                    <p className="text-xs text-piano-muted">{phase.description}</p>
                  </div>
                  <span className="text-xs text-piano-muted shrink-0">{Math.round(progress * 100)}%</span>
                </div>
                {isCurrent && missing.length > 0 && (
                  <div className="mt-3 pl-8 flex flex-col gap-1">
                    <p className="text-xs font-medium text-piano-muted uppercase tracking-wide">Te falta:</p>
                    {missing.map((m, i) => (
                      <p key={i} className="text-sm text-piano-text">• {m}</p>
                    ))}
                    <div className="flex gap-3 mt-1 text-xs">
                      <Link to="/curriculum" className="underline text-piano-muted hover:text-piano-text">Lecciones</Link>
                      <Link to="/canciones" className="underline text-piano-muted hover:text-piano-text">Canciones</Link>
                      <Link to="/practica" className="underline text-piano-muted hover:text-piano-text">Drills</Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat value={xp} label="XP total" icon={<Star className="text-piano-warn" />} />
        <Stat value={streak} label="racha (días)" icon={<Flame className="text-orange-400" />} />
        <Stat value={`${completed}/${totalLessons()}`} label="lecciones" icon={<Trophy className="text-piano-accent" />} />
        <Stat value={`${totalStars}/${maxStars}`} label="estrellas" icon={<Star className="text-piano-warn" />} />
      </div>

      {/* Logros */}
      <div className="card p-5">
        <h2 className="font-semibold mb-3">Logros</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(ACHIEVEMENTS).map(([id, a]) => {
            const got = achievements.includes(id);
            return (
              <div key={id} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${got ? 'bg-piano-primary/20' : 'bg-white/5 opacity-40'}`}>
                <span className="text-xl">{a.emoji}</span>
                <span className="text-sm">{a.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progreso por módulo */}
      <div className="card p-5">
        <h2 className="font-semibold mb-3">Por módulo</h2>
        <div className="flex flex-col gap-3">
          {MODULES.map((m) => {
            const done = m.lessons.filter((l) => lessons[lessonKey(m.id, l.id)]).length;
            const pct = Math.round((done / m.lessons.length) * 100);
            return (
              <div key={m.id} className="flex items-center gap-3">
                <span className="text-lg w-6 text-center">{m.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm">
                    <span className="truncate">{m.title}</span>
                    <span className="text-piano-muted">{done}/{m.lessons.length}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden mt-1">
                    <div className="h-full bg-piano-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        className="btn-ghost self-start text-piano-bad"
        onClick={() => {
          if (confirm('¿Seguro que quieres borrar todo tu progreso? Esto no se puede deshacer.')) reset();
        }}
      >
        <RotateCcw size={18} /> Reiniciar progreso
      </button>
    </div>
  );
}

function Stat({ value, label, icon }: { value: ReactNode; label: string; icon: ReactNode }) {
  return (
    <div className="card p-4 flex flex-col items-center gap-1 text-center">
      <div className="text-xl h-7 flex items-center">{icon}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[11px] text-piano-muted">{label}</div>
    </div>
  );
}
