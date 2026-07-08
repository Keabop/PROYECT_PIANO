import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Lock, Star } from 'lucide-react';
import { MODULES, flatLessons, lessonKey } from '../data/curriculum';
import { useProgressStore } from '../store/useProgressStore';

export default function Curriculum() {
  const lessons = useProgressStore((s) => s.lessons);

  // Desbloqueo secuencial: una lección se abre cuando la anterior está completa.
  const flat = flatLessons();
  const unlocked = new Set<string>();
  for (let i = 0; i < flat.length; i++) {
    const key = lessonKey(flat[i].module.id, flat[i].lesson.id);
    if (i === 0) unlocked.add(key);
    else {
      const prev = flat[i - 1];
      if (lessons[lessonKey(prev.module.id, prev.lesson.id)]) unlocked.add(key);
    }
  }

  const levels: { level: 'beginner' | 'intermediate'; title: string }[] = [
    { level: 'beginner', title: 'Principiante' },
    { level: 'intermediate', title: 'Intermedio' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold">Lecciones</h1>
        <p className="text-piano-muted">Completa cada lección para desbloquear la siguiente.</p>
      </header>

      {levels.map(({ level, title }) => (
        <section key={level} className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-piano-muted">{title}</h2>
          {MODULES.filter((m) => m.level === level).map((module) => (
            <div key={module.id} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{module.emoji}</span>
                <div>
                  <h3 className="font-semibold">{module.title}</h3>
                  <p className="text-sm text-piano-muted">{module.description}</p>
                </div>
              </div>
              <div className="flex flex-col divide-y divide-white/5">
                {module.lessons.map((lesson) => {
                  const key = lessonKey(module.id, lesson.id);
                  const record = lessons[key];
                  const isUnlocked = unlocked.has(key);
                  const inner = (
                    <div className="flex items-center gap-3 py-3">
                      {record ? (
                        <CheckCircle2 size={20} className="text-piano-good shrink-0" />
                      ) : isUnlocked ? (
                        <Circle size={20} className="text-piano-muted shrink-0" />
                      ) : (
                        <Lock size={18} className="text-piano-muted/60 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${isUnlocked ? '' : 'text-piano-muted/60'}`}>{lesson.title}</p>
                        <p className="text-xs text-piano-muted truncate">{lesson.subtitle}</p>
                      </div>
                      {record && (
                        <div className="flex gap-0.5">
                          {[0, 1, 2].map((i) => (
                            <Star key={i} size={14} className={i < record.stars ? 'text-piano-warn fill-piano-warn' : 'text-white/15'} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                  return isUnlocked ? (
                    <Link key={lesson.id} to={`/leccion/${module.id}/${lesson.id}`} className="hover:opacity-80 transition">
                      {inner}
                    </Link>
                  ) : (
                    <div key={lesson.id} className="cursor-not-allowed">
                      {inner}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
