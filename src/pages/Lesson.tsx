import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, PartyPopper, Star } from 'lucide-react';
import { flatLessons, getLesson, lessonKey } from '../data/curriculum';
import LessonBlock from '../components/LessonBlock';
import ExerciseRunner from '../practice/ExerciseRunner';
import { useProgressStore } from '../store/useProgressStore';

export default function Lesson() {
  const { moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const completeLesson = useProgressStore((s) => s.completeLesson);

  const found = moduleId && lessonId ? getLesson(moduleId, lessonId) : undefined;
  const [exIndex, setExIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setExIndex(0);
    setFinished(false);
  }, [moduleId, lessonId]);

  const next = useMemo(() => {
    if (!found) return undefined;
    const flat = flatLessons();
    const i = flat.findIndex((f) => f.module.id === moduleId && f.lesson.id === lessonId);
    return i >= 0 && i < flat.length - 1 ? flat[i + 1] : undefined;
  }, [found, moduleId, lessonId]);

  if (!found) {
    return (
      <div className="text-center py-16">
        <p className="text-piano-muted mb-4">Lección no encontrada.</p>
        <Link to="/curriculum" className="btn-primary">Volver a lecciones</Link>
      </div>
    );
  }

  const { module, lesson } = found;
  const exercises = lesson.exercises;

  function handleExerciseComplete() {
    if (exIndex < exercises.length - 1) {
      setExIndex((i) => i + 1);
    } else {
      completeLesson(lessonKey(module.id, lesson.id), 100);
      setFinished(true);
    }
  }

  if (finished) {
    return <Completion module={module} next={next} onNav={(to) => navigate(to)} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/curriculum" className="flex items-center gap-1 text-sm text-piano-muted hover:text-piano-text">
        <ArrowLeft size={16} /> Lecciones
      </Link>

      <header>
        <div className="flex items-center gap-2 text-sm text-piano-muted">
          <span>{module.emoji}</span>
          <span>{module.title}</span>
        </div>
        <h1 className="text-2xl font-bold mt-1">{lesson.title}</h1>
        <p className="text-piano-muted">{lesson.subtitle}</p>
      </header>

      {/* Teoría */}
      <div className="flex flex-col gap-5">
        {lesson.blocks.map((block, i) => (
          <LessonBlock key={i} block={block} />
        ))}
      </div>

      {/* Práctica */}
      {exercises.length > 0 && (
        <div className="card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Práctica</h2>
            <span className="text-sm text-piano-muted">
              Ejercicio {exIndex + 1} de {exercises.length}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-piano-primary transition-all" style={{ width: `${(exIndex / exercises.length) * 100}%` }} />
          </div>
          <motion.div key={exIndex} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <ExerciseRunner exercise={exercises[exIndex]} onComplete={handleExerciseComplete} />
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Completion({
  module,
  next,
  onNav,
}: {
  module: { emoji: string };
  next?: { module: { id: string; title: string; emoji: string }; lesson: { id: string; title: string } };
  onNav: (to: string) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-8 text-center flex flex-col items-center gap-4 mt-6">
      <PartyPopper size={48} className="text-piano-warn" />
      <h1 className="text-2xl font-bold">¡Lección completada!</h1>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <Star key={i} size={28} className="text-piano-warn fill-piano-warn" />
        ))}
      </div>
      <p className="text-piano-muted">+20 XP {module.emoji}</p>
      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        {next ? (
          <button className="btn-primary" onClick={() => onNav(`/leccion/${next.module.id}/${next.lesson.id}`)}>
            Siguiente: {next.lesson.title} <ArrowRight size={18} />
          </button>
        ) : (
          <button className="btn-primary" onClick={() => onNav('/practica')}>
            Ir a práctica libre <ArrowRight size={18} />
          </button>
        )}
        <button className="btn-ghost" onClick={() => onNav('/curriculum')}>
          Ver todas las lecciones
        </button>
      </div>
    </motion.div>
  );
}
