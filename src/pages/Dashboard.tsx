import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Star, ArrowRight, Sliders, Ear, Dumbbell, Music, CheckCircle2, Circle, BookOpen, RefreshCcw, Hand } from 'lucide-react';
import { flatLessons, lessonKey, totalLessons } from '../data/curriculum';
import { evaluateJourney, labelForKey, linkForKey, suggestSong, WARMUP_BY_PHASE } from '../data/journey';
import { todayKey, useProgressStore } from '../store/useProgressStore';

export default function Dashboard() {
  const lessons = useProgressStore((s) => s.lessons);
  const xp = useProgressStore((s) => s.xp);
  const streak = useProgressStore((s) => s.streak);
  const sessionLog = useProgressStore((s) => s.sessionLog);
  const dueReviews = useProgressStore((s) => s.dueReviews);

  const all = flatLessons();
  const completedCount = all.filter(({ module, lesson }) => lessons[lessonKey(module.id, lesson.id)]).length;
  const next = all.find(({ module, lesson }) => !lessons[lessonKey(module.id, lesson.id)]);
  const pct = Math.round((completedCount / totalLessons()) * 100);

  const journey = evaluateJourney(lessons);
  const phaseStatus = journey.phases[journey.currentPhase - 1];
  const warmup = WARMUP_BY_PHASE[journey.currentPhase];
  const song = suggestSong(lessons, journey.currentPhase);
  const due = dueReviews().slice(0, 3);
  const today = sessionLog[todayKey()] ?? {};

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Hola 👋</h1>
        <p className="text-piano-muted">
          Fase {journey.currentPhase} — {phaseStatus.phase.emoji} {phaseStatus.phase.title}
        </p>
      </header>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<Flame className="text-orange-400" />} value={streak} label="días de racha" />
        <Stat icon={<Star className="text-piano-warn" />} value={xp} label="XP" />
        <Stat icon={<span className="text-piano-accent font-bold">{pct}%</span>} value={`${completedCount}/${totalLessons()}`} label="lecciones" />
      </div>

      {/* Tu sesión de hoy */}
      <div className="card p-5 flex flex-col gap-1">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Tu sesión de hoy</h2>
          <span className="text-xs text-piano-muted">~15–20 min · como con un profesor</span>
        </div>

        <SessionStep
          done={!!today.warmup}
          icon={<Hand size={18} />}
          title="Calentamiento"
          subtitle={warmup ? `Técnica: ${warmup.label}` : 'Un drill de técnica'}
          to="/practica"
        />
        <SessionStep
          done={!!today.lesson}
          icon={<BookOpen size={18} />}
          title="Aprende algo nuevo"
          subtitle={next ? `${next.module.emoji} ${next.lesson.title}` : '¡Currículo completado!'}
          to={next ? `/leccion/${next.module.id}/${next.lesson.id}` : '/curriculum'}
        />
        <SessionStep
          done={!!today.song}
          icon={<Music size={18} />}
          title="Tu canción"
          subtitle={song ? `${song.emoji} ${song.title}` : 'Elige una canción'}
          to={song ? `/canciones/${song.id}` : '/canciones'}
        />
        <SessionStep
          done={!!today.review}
          icon={<RefreshCcw size={18} />}
          title="Repaso"
          subtitle={
            due.length > 0
              ? `${due.length} pendiente${due.length > 1 ? 's' : ''}: ${labelForKey(due[0])}${due.length > 1 ? '…' : ''}`
              : 'Nada vencido hoy 🎉'
          }
          to={due.length > 0 ? linkForKey(due[0]) : '/progreso'}
          muted={due.length === 0}
        />
      </div>

      {/* Barra de progreso global */}
      <div>
        <div className="flex justify-between text-xs text-piano-muted mb-1">
          <span>Camino a intermedio</span>
          <Link to="/progreso" className="underline hover:text-piano-text">ver el camino</Link>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-piano-primary transition-all"
            style={{ width: `${((journey.currentPhase - 1 + phaseStatus.progress) / 6) * 100}%` }}
          />
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

function SessionStep({
  done,
  icon,
  title,
  subtitle,
  to,
  muted,
}: {
  done: boolean;
  icon: ReactNode;
  title: string;
  subtitle: string;
  to: string;
  muted?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/5 ${muted ? 'opacity-60' : ''}`}
    >
      {done ? (
        <CheckCircle2 size={20} className="text-piano-good shrink-0" />
      ) : (
        <Circle size={20} className="text-piano-muted shrink-0" />
      )}
      <span className="text-piano-primary shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${done ? 'line-through text-piano-muted' : ''}`}>{title}</p>
        <p className="text-xs text-piano-muted truncate">{subtitle}</p>
      </div>
      <ArrowRight size={16} className="text-piano-muted shrink-0" />
    </Link>
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
