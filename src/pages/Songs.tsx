import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Music, PartyPopper, Volume2 } from 'lucide-react';
import { LIBRARY, phraseDurationsSec, phraseKey, songByIdLib, type LibrarySong } from '../data/library';
import type { Exercise } from '../data/curriculum';
import ExerciseRunner from '../practice/ExerciseRunner';
import { playTimedSequence } from '../audio/synth';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';

const LEVEL_COLOR: Record<LibrarySong['level'], string> = {
  fácil: 'text-piano-good',
  media: 'text-piano-warn',
  difícil: 'text-piano-bad',
};

export function SongList() {
  const lessons = useProgressStore((s) => s.lessons);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Music /> Canciones
        </h1>
        <p className="text-piano-muted">
          Aprende por frases: escucha, toca en tu piano y la app valida cada nota con el micrófono.
        </p>
      </header>

      <div className="grid gap-3">
        {LIBRARY.map((song) => {
          const done = song.phrases.filter((_, i) => lessons[phraseKey(song.id, i)]).length;
          const complete = done === song.phrases.length;
          return (
            <Link
              key={song.id}
              to={`/canciones/${song.id}`}
              className="card p-4 flex items-center gap-4 hover:bg-piano-surface2 transition"
            >
              <span className="text-3xl">{song.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{song.title}</h3>
                  {complete && <CheckCircle2 size={16} className="text-piano-good shrink-0" />}
                </div>
                <p className="text-sm text-piano-muted truncate">{song.origin}</p>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-xs font-medium capitalize ${LEVEL_COLOR[song.level]}`}>{song.level}</div>
                <div className="text-xs text-piano-muted mt-1">
                  {done}/{song.phrases.length} frases
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="text-xs text-piano-muted">
        Las piezas marcadas como «fragmento simplificado» son transcripciones libres y breves con fines
        educativos; el resto del repertorio es de dominio público.
      </p>
    </div>
  );
}

export function SongDetail() {
  const { songId } = useParams();
  const song = songId ? songByIdLib(songId) : undefined;
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [runKey, setRunKey] = useState(0);
  const a4 = useSettingsStore((s) => s.a4);
  const lessons = useProgressStore((s) => s.lessons);
  const completeLesson = useProgressStore((s) => s.completeLesson);

  const exercise = useMemo<Exercise | null>(() => {
    if (!song) return null;
    const phrase = song.phrases[phraseIdx];
    return {
      kind: 'playSequence',
      id: `song-${song.id}-${phraseIdx}`,
      prompt: `${phrase.name}: toca las notas en orden. Ve a tu ritmo.`,
      targets: phrase.notes,
      durations: phrase.durations,
      bpm: song.bpm,
      showStaff: true,
    };
  }, [song, phraseIdx]);

  if (!song || !exercise) {
    return (
      <div className="text-center py-16">
        <p className="text-piano-muted mb-4">Canción no encontrada.</p>
        <Link to="/canciones" className="btn-primary">Volver a canciones</Link>
      </div>
    );
  }

  const doneCount = song.phrases.filter((_, i) => lessons[phraseKey(song.id, i)]).length;
  const songComplete = doneCount === song.phrases.length;

  function listenPhrase(i: number) {
    playTimedSequence(song!.phrases[i].notes, phraseDurationsSec(song!.phrases[i], song!.bpm), a4);
  }

  function listenWholeSong() {
    const notes: number[] = [];
    const durs: number[] = [];
    const breath = 60 / song!.bpm; // un tiempo de respiro entre frases
    song!.phrases.forEach((p, pi) => {
      const d = phraseDurationsSec(p, song!.bpm);
      notes.push(...p.notes);
      durs.push(...d);
      if (pi < song!.phrases.length - 1) durs[durs.length - 1] += breath;
    });
    playTimedSequence(notes, durs, a4);
  }

  function handlePhraseComplete() {
    completeLesson(phraseKey(song!.id, phraseIdx), 100, 10);
    // Avanza a la siguiente frase pendiente, si la hay.
    const next = phraseIdx + 1 < song!.phrases.length ? phraseIdx + 1 : null;
    if (next != null) {
      setTimeout(() => {
        setPhraseIdx(next);
        setRunKey((k) => k + 1);
      }, 1200);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Link to="/canciones" className="flex items-center gap-1 text-sm text-piano-muted hover:text-piano-text">
        <ArrowLeft size={16} /> Canciones
      </Link>

      <header className="flex items-start gap-3">
        <span className="text-4xl">{song.emoji}</span>
        <div>
          <h1 className="text-2xl font-bold">{song.title}</h1>
          <p className="text-piano-muted text-sm">
            {song.origin} · <span className={`capitalize ${LEVEL_COLOR[song.level]}`}>{song.level}</span> · ♩ ≈ {song.bpm}
          </p>
          {song.isExcerpt && <span className="chip mt-1">Fragmento simplificado</span>}
        </div>
      </header>

      {songComplete && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-4 flex items-center gap-3 text-piano-good">
          <PartyPopper size={22} /> ¡Canción completada! Puedes repasar cualquier frase.
        </motion.div>
      )}

      {/* Selector de frases */}
      <div className="flex flex-wrap gap-2">
        {song.phrases.map((p, i) => {
          const done = !!lessons[phraseKey(song.id, i)];
          return (
            <button
              key={i}
              onClick={() => {
                setPhraseIdx(i);
                setRunKey((k) => k + 1);
              }}
              className={`px-3 py-1.5 rounded-xl text-sm flex items-center gap-1.5 transition ${
                phraseIdx === i ? 'bg-piano-primary text-white' : 'bg-white/5 text-piano-muted hover:bg-white/10'
              }`}
            >
              {done && <CheckCircle2 size={14} className={phraseIdx === i ? 'text-white' : 'text-piano-good'} />}
              {p.name}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button className="btn-ghost" onClick={() => listenPhrase(phraseIdx)}>
          <Volume2 size={18} /> Escuchar frase
        </button>
        <button className="btn-ghost" onClick={listenWholeSong}>
          <Volume2 size={18} /> Canción completa
        </button>
      </div>

      <div className="card p-5">
        <ExerciseRunner key={`${phraseIdx}-${runKey}`} exercise={exercise} onComplete={handlePhraseComplete} />
      </div>
    </div>
  );
}
