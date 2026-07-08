import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { Exercise } from '../data/curriculum';
import type { ExerciseResult } from './ExerciseRunner';

interface QuizProps {
  exercise: Extract<Exercise, { kind: 'quiz' }>;
  onComplete: (result: ExerciseResult) => void;
}

export default function QuizExercise({ exercise, onComplete }: QuizProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const wrongAttemptsRef = useRef(0);
  const answered = selected != null;
  const correct = selected === exercise.answer;

  function choose(i: number) {
    if (answered) return;
    setSelected(i);
    if (i === exercise.answer) {
      setTimeout(() => onComplete({ errors: wrongAttemptsRef.current }), 900);
    } else {
      wrongAttemptsRef.current += 1;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-piano-text font-medium">{exercise.prompt}</p>
      <div className="grid gap-2">
        {exercise.options.map((opt, i) => {
          const isAnswer = i === exercise.answer;
          const isChosen = i === selected;
          let cls = 'bg-white/5 hover:bg-white/10';
          if (answered && isAnswer) cls = 'bg-piano-good/20 ring-1 ring-piano-good';
          else if (answered && isChosen && !isAnswer) cls = 'bg-piano-bad/20 ring-1 ring-piano-bad';
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              className={`flex items-center justify-between rounded-xl px-4 py-3 text-left transition ${cls}`}
            >
              <span>{opt}</span>
              {answered && isAnswer && <Check size={18} className="text-piano-good" />}
              {answered && isChosen && !isAnswer && <X size={18} className="text-piano-bad" />}
            </button>
          );
        })}
      </div>
      {answered && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm">
          {correct ? (
            <span className="text-piano-good font-medium">¡Correcto! {exercise.explain}</span>
          ) : (
            <span className="text-piano-warn">
              Casi. {exercise.explain ?? 'Inténtalo de nuevo.'}{' '}
              <button className="underline" onClick={() => setSelected(null)}>
                Reintentar
              </button>
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
}
