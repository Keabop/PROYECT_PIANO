import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileUp,
  Lock,
  Music,
  PartyPopper,
  RotateCcw,
  Trash2,
  Trophy,
  Volume2,
} from 'lucide-react';
import {
  CATEGORIES,
  LIBRARY,
  phraseDurationsBeats,
  phraseDurationsSec,
  phraseKey,
  phraseOffsetsBeats,
  type LibrarySong,
} from '../data/library';
import type { Exercise } from '../data/curriculum';
import ExerciseRunner, { type ExerciseResult } from '../practice/ExerciseRunner';
import FlowRunner, { type FlowMode } from '../practice/FlowRunner';
import { playTimedSequence } from '../audio/synth';
import { MASTERY_LABEL, MASTERY_RANK, masteryOf, useProgressStore } from '../store/useProgressStore';
import { isSongDominatedSong, songMasteryOf } from '../data/journey';
import { useSettingsStore } from '../store/useSettingsStore';
import { useUserSongsStore } from '../store/useUserSongsStore';

const LEVEL_COLOR: Record<LibrarySong['level'], string> = {
  fácil: 'text-piano-good',
  media: 'text-piano-warn',
  difícil: 'text-piano-bad',
};

const FULL = 'full';
type PracticeMode = 'step' | FlowMode;

export function SongList() {
  const lessons = useProgressStore((s) => s.lessons);
  const userSongs = useUserSongsStore((s) => s.songs);
  const addSong = useUserSongsStore((s) => s.addSong);
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const allSongs = useMemo(() => [...LIBRARY, ...userSongs], [userSongs]);

  async function handleFile(file: File) {
    setImporting(true);
    setImportError(null);
    try {
      const buffer = await file.arrayBuffer();
      const existingIds = allSongs.map((s) => s.id);
      const name = file.name.toLowerCase();
      let song: LibrarySong;
      if (name.endsWith('.mid') || name.endsWith('.midi')) {
        const { parseMidiFile } = await import('../import/midiImport');
        song = parseMidiFile(buffer, file.name, existingIds);
      } else if (name.endsWith('.xml') || name.endsWith('.musicxml') || name.endsWith('.mxl')) {
        const { parseMusicXmlFile } = await import('../import/musicXmlImport');
        song = await parseMusicXmlFile(buffer, file.name, existingIds);
      } else {
        throw new Error('Formato no soportado. Usa .mid, .midi, .musicxml, .xml o .mxl');
      }
      if (song.phrases.length === 0) throw new Error('No se encontraron notas en la partitura.');
      addSong(song);
      navigate(`/canciones/${song.id}`);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'No se pudo leer el archivo.');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Music /> Canciones
          </h1>
          <p className="text-piano-muted">
            Aprende por frases y repite hasta dominarlas: 🥉 una vez · 🥈 3 veces con una limpia · 🥇 3 limpias
            seguidas.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button className="btn-primary" onClick={() => fileRef.current?.click()} disabled={importing}>
            <FileUp size={18} /> {importing ? 'Importando…' : 'Importar partitura'}
          </button>
          <span className="text-[11px] text-piano-muted">.mid · .midi · .musicxml · .xml · .mxl</span>
          <input
            ref={fileRef}
            type="file"
            accept=".mid,.midi,.xml,.musicxml,.mxl"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      </header>

      {importError && (
        <div className="rounded-xl bg-piano-bad/15 border border-piano-bad/30 p-3 text-sm text-piano-bad">
          {importError}
        </div>
      )}

      {CATEGORIES.map((cat) => {
        const songs = allSongs.filter((s) => s.category === cat.id);
        if (songs.length === 0) return null;
        return (
          <section key={cat.id} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-piano-muted">
              {cat.emoji} {cat.title} <span className="opacity-60">({songs.length})</span>
            </h2>
            <div className="grid gap-3">
              {songs.map((song) => {
                const mastery = songMasteryOf(lessons, song);
                const dominated = isSongDominatedSong(lessons, song);
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
          </section>
        );
      })}

      <p className="text-xs text-piano-muted">
        Las piezas marcadas como «arreglo simplificado» son transcripciones libres de una sola voz con fines
        educativos, para uso personal; el resto del repertorio es de dominio público. De las partituras
        importadas se extrae automáticamente la melodía (voz superior).
      </p>
    </div>
  );
}

export function SongDetail() {
  const { songId } = useParams();
  const navigate = useNavigate();
  const userSongs = useUserSongsStore((s) => s.songs);
  const removeSong = useUserSongsStore((s) => s.removeSong);
  const song = useMemo(
    () => LIBRARY.find((s) => s.id === songId) ?? userSongs.find((s) => s.id === songId),
    [songId, userSongs]
  );
  const [selected, setSelected] = useState<number | typeof FULL>(0);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('step');
  const [runKey, setRunKey] = useState(0);
  const [lastResult, setLastResult] = useState<ExerciseResult | null>(null);
  const a4 = useSettingsStore((s) => s.a4);
  const lessons = useProgressStore((s) => s.lessons);
  const recordPractice = useProgressStore((s) => s.recordPractice);

  // Datos de la selección (frase o canción completa) con tiempos reales.
  const flowData = useMemo(() => {
    if (!song) return null;
    if (selected === FULL) {
      const notes: number[] = [];
      const offsets: number[] = [];
      const durations: number[] = [];
      let shift = 0;
      for (const p of song.phrases) {
        const off = phraseOffsetsBeats(p);
        const dur = phraseDurationsBeats(p);
        off.forEach((o, i) => {
          notes.push(p.notes[i]);
          offsets.push(o + shift);
          durations.push(dur[i]);
        });
        shift = offsets[offsets.length - 1] + durations[durations.length - 1] + 1; // respiro entre frases
      }
      return { notes, offsets, durations };
    }
    const p = song.phrases[selected];
    return { notes: p.notes, offsets: phraseOffsetsBeats(p), durations: phraseDurationsBeats(p) };
  }, [song, selected]);

  const exercise = useMemo<Exercise | null>(() => {
    if (!song || !flowData) return null;
    const prompt =
      selected === FULL
        ? 'Canción completa: encadena todas las frases, a tu ritmo y sin errores.'
        : `${song.phrases[selected].name}: toca las notas en orden. Ve a tu ritmo.`;
    return {
      kind: 'playSequence',
      id: `song-${song.id}-${String(selected)}`,
      prompt,
      targets: flowData.notes,
      durations: flowData.durations,
      bpm: song.bpm,
      showStaff: selected !== FULL,
    };
  }, [song, selected, flowData]);

  if (!song || !exercise || !flowData) {
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
  const dominated = isSongDominatedSong(lessons, song);

  function listen() {
    const beat = 60 / song!.bpm;
    playTimedSequence(flowData!.notes, flowData!.durations.map((d) => d * beat), a4);
  }

  function listenWholeSong() {
    const notes: number[] = [];
    const durs: number[] = [];
    const breath = 60 / song!.bpm;
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

  function deleteSong() {
    if (confirm(`¿Borrar "${song!.title}" de tus partituras importadas?`)) {
      removeSong(song!.id);
      navigate('/canciones');
    }
  }

  const nextPhraseIdx = typeof selected === 'number' && selected + 1 < song.phrases.length ? selected + 1 : null;

  return (
    <div className="flex flex-col gap-5">
      <Link to="/canciones" className="flex items-center gap-1 text-sm text-piano-muted hover:text-piano-text">
        <ArrowLeft size={16} /> Canciones
      </Link>

      <header className="flex items-start gap-3">
        <span className="text-4xl">{song.emoji}</span>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{song.title}</h1>
          <p className="text-piano-muted text-sm">
            {song.origin} · <span className={`capitalize ${LEVEL_COLOR[song.level]}`}>{song.level}</span> · ♩ ≈ {song.bpm}
          </p>
          {song.isExcerpt && song.category !== 'importada' && <span className="chip mt-1">Arreglo simplificado</span>}
        </div>
        {song.category === 'importada' && (
          <button className="btn-ghost text-piano-bad" onClick={deleteSong} title="Borrar esta partitura">
            <Trash2 size={18} />
          </button>
        )}
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

      {/* Modo de práctica */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-piano-muted uppercase tracking-wide">Modo:</span>
        {(
          [
            { id: 'step', label: '🐢 Paso a paso', tip: 'Sin reloj: cada nota te espera.' },
            { id: 'wait', label: '🤝 Espérame', tip: 'Las notas caen con el tempo, pero la canción se pausa hasta que toques la nota.' },
            { id: 'go', label: '🌊 Corrido', tip: 'La canción no se detiene: si se te va una nota, cuenta como fallo y sigue.' },
          ] as { id: PracticeMode; label: string; tip: string }[]
        ).map((m) => (
          <button
            key={m.id}
            title={m.tip}
            onClick={() => {
              setPracticeMode(m.id);
              setLastResult(null);
              setRunKey((k) => k + 1);
            }}
            className={`px-3 py-1.5 rounded-xl text-sm transition ${
              practiceMode === m.id ? 'bg-piano-primary text-white' : 'bg-white/5 text-piano-muted hover:bg-white/10'
            }`}
          >
            {m.label}
          </button>
        ))}
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
        <button className="btn-ghost" onClick={listen}>
          <Volume2 size={18} /> Escuchar {selected === FULL ? 'canción' : 'frase'}
        </button>
        {selected !== FULL && (
          <button className="btn-ghost" onClick={listenWholeSong}>
            <Volume2 size={18} /> Escuchar todo
          </button>
        )}
      </div>

      <div className="card p-5">
        {practiceMode === 'step' ? (
          <ExerciseRunner key={`step-${String(selected)}-${runKey}`} exercise={exercise} onComplete={handleComplete} />
        ) : (
          <FlowRunner
            key={`${practiceMode}-${String(selected)}-${runKey}`}
            notes={flowData.notes}
            offsetsBeats={flowData.offsets}
            durationsBeats={flowData.durations}
            bpm={song.bpm}
            mode={practiceMode}
            onComplete={(r) => handleComplete(r)}
          />
        )}

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
