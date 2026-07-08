import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, Music, PartyPopper, RotateCcw, Trophy, Volume2 } from 'lucide-react';
import { LIBRARY, phraseDurationsSec, phraseKey, songByIdLib, type LibrarySong } from '../data/library';
import type { Exercise } from '../data/curriculum';
import ExerciseRunner, { type ExerciseResult } from '../practice/ExerciseRunner';
import { playTimedSequence } from '../audio/synth';
import { MASTERY_LABEL, MASTERY_RANK, masteryOf, useProgressStore } from '../store/useProgressStore';
import { isSongDominated, songMastery } from '../data/journey';
import { useSettingsStore } from '../store/useSettingsStore';

const LEVEL_COLOR: Record<LibrarySong['level'], string> = {
  fácil: 'text-piano-good',
  media: 'text-piano-warn',
  difícil: 'text-piano-bad',
};

const FULL = 'full';

export function SongList() {
  const lessons = useProgressStore((s) => s.lessons);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Music /> Canciones
        </h1>
        <p className="text-piano-muted">
          Aprende por frases y repite hasta dominarlas: 🥉 una vez · 🥈 3 veces con una limpia · 🥇 3 limpias
          seguidas.
        </p>
      </header>

      <div className="grid gap-3">
        {LIBRARY.map((song) => {
          const mastery = songMastery(lessons, song.id);
          const dominated = isSongDominated(lessons, song.id);
          const bronzeCount = song.phrases.filter(
            (_, i) => MASTERY_RANK[masteryOf(lessons[phraseKey(song.id, i)])] >= MASTERY_RANK.bronze
          ).length;
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
                  {dominated ? (
                    <Trophy size={16} className="text-piano-warn shrink-0" />
                  ) : (
                    mastery !== 'new' && <span className="shrink-0">{MASTERY_LABEL[mastery]}</span>
                  )}
                </div>
                <p className="text-sm text-piano-muted truncate">{song.origin}</p>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-xs font-medium capitalize ${LEVEL_COLOR[song.level]}`}>{song.level}</div>
                <div className="text-xs text-piano-muted mt-1">
                  {bronzeCount}/{song.phrases.length} frases
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
  const [selected, setSelected] = useState<number | typeof FULL>(0);
  const [runKey, setRunKey] = useState(0);
  const [lastResult, setLastResult] = useState<ExerciseResult | null>(null);
  const a4 = useSettingsStore((s) => s.a4);
  const lessons = useProgressStore((s) => s.lessons);
  const recordPractice = useProgressStore((s) => s.recordPractice);

  const exercise = useMemo<Exercise | null>(() => {
    if (!song) return null;
    if (selected === FULL) {
      const notes = song.phrases.flatMap((p) => p.notes);
      const durations = song.phrases.flatMap((p) => p.notes.map((_, i) => p.durations?.[i] ?? 1));
      return {
        kind: 'playSequence',
        id: `song-${song.id}-full`,
        prompt: 'Canción completa: encadena todas las frases, a tu ritmo y sin errores.',
        targets: notes,
        durations,
        bpm: song.bpm,
        showStaff: false, // demasiadas notas para un solo pentagrama legible
      };
    }
    const phrase = song.phrases[selected];
    return {
      kind: 'playSequence',
      id: `song-${song.id}-${selected}`,
      prompt: `${phrase.name}: toca las notas en orden. Ve a tu ritmo.`,
      targets: phrase.notes,
      durations: phrase.durations,
      bpm: song.bpm,
      showStaff: true,
    };
  }, [song, selected]);

  if (!song || !exercise) {
    return (
      <div className="text-center py-16">
        <p className="text-piano-muted mb-4">Canción no encontrada.</p>
        <Link to="/canciones" className="btn-primary">Volver a canciones</Link>
      </div>
    );
  }

  const keyOf = (sel: number | typeof FULL) =>
    sel === FULL ? `cancion/${song.id}/${FULL}` : phraseKey(song.id, sel);
  const currentRecord = lessons[keyOf(selected)];
  const currentMastery = masteryOf(currentRecord);
  const allBronze = song.phrases.every(
    (_, i) => MASTERY_RANK[masteryOf(lessons[phraseKey(song.id, i)])] >= MASTERY_RANK.bronze
  );
  const dominated = isSongDominated(lessons, song.id);

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

  function select(sel: number | typeof FULL) {
    setSelected(sel);
    setLastResult(null);
    setRunKey((k) => k + 1);
  }

  function handleComplete(result: ExerciseResult) {
    recordPractice(keyOf(selected), result.errors, selected === FULL ? 25 : 10);
    setLastResult(result);
  }

  const nextPhraseIdx = typeof selected === 'number' && selected + 1 < song.phrases.length ? selected + 1 : null;

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

      {dominated && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-4 flex items-center gap-3 text-piano-warn">
          <Trophy size={22} /> <b>Canción dominada.</b> Vuelve de vez en cuando a repasarla: aparecerá en tus repasos.
        </motion.div>
      )}

      {/* Selector de frases con medallas */}
      <div className="flex flex-wrap gap-2">
        {song.phrases.map((p, i) => {
          const m = masteryOf(lessons[phraseKey(song.id, i)]);
          return (
            <button
              key={i}
              onClick={() => select(i)}
              className={`px-3 py-1.5 rounded-xl text-sm flex items-center gap-1.5 transition ${
                selected === i ? 'bg-piano-primary text-white' : 'bg-white/5 text-piano-muted hover:bg-white/10'
              }`}
            >
              <span>{MASTERY_LABEL[m]}</span>
              {p.name}
            </button>
          );
        })}
        <button
          onClick={() => allBronze && select(FULL)}
          disabled={!allBronze}
          title={allBronze ? 'Encadena todas las frases' : 'Consigue 🥉 en todas las frases para desbloquear'}
          className={`px-3 py-1.5 rounded-xl text-sm flex items-center gap-1.5 transition ${
            selected === FULL
              ? 'bg-piano-primary text-white'
              : allBronze
                ? 'bg-white/5 text-piano-muted hover:bg-white/10'
                : 'bg-white/5 text-piano-muted/40 cursor-not-allowed'
          }`}
        >
          {allBronze ? <Trophy size={14} /> : <Lock size={14} />} Canción completa
        </button>
      </div>

      {/* Estado de maestría de lo seleccionado */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-piano-muted">
        <span className="chip">
          {MASTERY_LABEL[currentMastery]}{' '}
          {currentMastery === 'new' ? 'Nuevo' : currentMastery === 'bronze' ? 'Bronce' : currentMastery === 'silver' ? 'Plata' : 'Oro'}
        </span>
        <span>
          Repeticiones: {currentRecord?.reps ?? 0} · limpias: {currentRecord?.cleanReps ?? 0} · racha:{' '}
          {currentRecord?.streak ?? 0}
        </span>
        {currentMastery !== 'gold' && (
          <span className="text-xs">
            {currentMastery === 'new' && '→ complétala una vez para 🥉'}
            {currentMastery === 'bronze' && '→ para 🥈: 3 repeticiones y al menos 1 sin errores'}
            {currentMastery === 'silver' && '→ para 🥇: 3 repeticiones limpias seguidas'}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          className="btn-ghost"
          onClick={() => (selected === FULL ? listenWholeSong() : listenPhrase(selected))}
        >
          <Volume2 size={18} /> Escuchar {selected === FULL ? 'canción' : 'frase'}
        </button>
        {selected !== FULL && (
          <button className="btn-ghost" onClick={listenWholeSong}>
            <Volume2 size={18} /> Escuchar todo
          </button>
        )}
      </div>

      <div className="card p-5">
        <ExerciseRunner key={`${String(selected)}-${runKey}`} exercise={exercise} onComplete={handleComplete} />

        {/* Panel tras completar: decidir conscientemente entre repetir o avanzar */}
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl bg-white/5 p-4 flex flex-col gap-3"
          >
            <div className="flex items-center gap-2 font-medium">
              {lastResult.errors === 0 ? (
                <>
                  <CheckCircle2 size={18} className="text-piano-good" /> Repetición limpia
                  {currentMastery === 'gold' && ' — ¡ORO! 🥇'}
                </>
              ) : (
                <>
                  <PartyPopper size={18} className="text-piano-warn" /> Completada con {lastResult.errors} error
                  {lastResult.errors === 1 ? '' : 'es'} — para que cuente como limpia, sin fallos.
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" onClick={() => select(selected)}>
                <RotateCcw size={16} /> Repetir{currentMastery !== 'gold' ? ' (camino a la siguiente medalla)' : ''}
              </button>
              {nextPhraseIdx != null && MASTERY_RANK[currentMastery] >= MASTERY_RANK.silver && (
                <button className="btn-ghost" onClick={() => select(nextPhraseIdx)}>
                  Siguiente frase <ArrowRight size={16} />
                </button>
              )}
              {nextPhraseIdx != null && MASTERY_RANK[currentMastery] < MASTERY_RANK.silver && (
                <button className="btn-ghost opacity-70" onClick={() => select(nextPhraseIdx)}>
                  Pasar de todas formas <ArrowRight size={16} />
                </button>
              )}
              {nextPhraseIdx == null && selected !== FULL && allBronze && (
                <button className="btn-ghost" onClick={() => select(FULL)}>
                  <Trophy size={16} /> Ir a la canción completa
                </button>
              )}
            </div>
            {MASTERY_RANK[currentMastery] < MASTERY_RANK.silver && nextPhraseIdx != null && (
              <p className="text-xs text-piano-muted">
                Consejo: los pianistas avanzan cuando la frase sale 🥈 — te lo agradecerás al encadenarlas.
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
