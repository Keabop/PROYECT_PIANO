# 🎹 PianoApp

Web app **reactiva en español** para aprender piano de **principiante a intermedio**,
pensada para practicar con **tu propio piano o teclado**. Su característica distintiva:
la app **escucha lo que tocas por el micrófono** (detección de tono en tiempo real) y valida
los ejercicios al instante, como las apps de pago — incluyendo **detección polifónica de
acordes**.

Todo el progreso se guarda **localmente en tu navegador**. El audio del micrófono **nunca sale
de tu dispositivo**.

## ✨ Qué incluye

- **Currículo completo** de 19 módulos (principiante → intermedio): conocer el teclado, dedos,
  ritmo, primeras melodías, lectura de partituras, escalas, intervalos, acordes, progresiones,
  dos manos, escalas menores, círculo de quintas, inversiones, séptimas, arpegios, expresión y
  lectura a primera vista.
- **Biblioteca de canciones** (sección *Canciones*): 13 piezas divididas en frases —
  Oda a la Alegría, Für Elise, Canon en Re, Gymnopédie n.º 1, Claro de Luna, Greensleeves,
  Cumpleaños feliz, Jingle Bells, Amazing Grace y más, además de fragmentos breves
  simplificados de los temas de **Interstellar** y **La La Land**. Cada frase se estudia con
  partitura, modo escuchar y validación nota a nota por micrófono; el progreso por frase
  queda guardado.
- **Detección de notas por micrófono** (tres motores, todos en tu dispositivo):
  - *Monofónica* (autocorrelación / McLeod Pitch Method) para notas sueltas, escalas y afinador.
  - *Polifónica* (FFT + saliencia armónica + resta iterativa) para **acordes tocados a la vez**,
    con *template matching* contra el acorde objetivo para máxima fiabilidad.
  - **Motor ML (beta)**: [Basic Pitch](https://github.com/spotify/basic-pitch-ts) de Spotify
    sobre TensorFlow.js, seleccionable en Ajustes. Más robusto con pianos reales y ruido, a
    cambio de ~1 s de latencia. El modelo (~900 KB) se sirve localmente y se carga solo si lo
    activas; el audio nunca sale del navegador.
- **Teclado en pantalla** interactivo (resalta la nota objetivo y la que detecta el micro).
- **Partituras** renderizadas con VexFlow (clave de Sol y de Fa).
- **Herramientas**: afinador visual, metrónomo, teclado de referencia y ajustes.
- **Entrenamiento auditivo**: reconoce intervalos y acordes de oído.
- **Progreso local**: XP, racha diaria, estrellas y logros (localStorage).
- **Modo sin micrófono**: puedes completar los ejercicios tocando el teclado en pantalla.

## 🛠️ Stack

Vite · React 18 · TypeScript · Tailwind CSS · Zustand (persist) · Tone.js · VexFlow ·
Web Audio API · Framer Motion · Vitest.

## 🚀 Cómo ejecutar

```bash
npm install
npm run dev      # desarrollo en http://localhost:5173
npm run build    # comprueba tipos + build de producción
npm run preview  # sirve el build
npm run test     # pruebas unitarias (motor de audio y teoría)
npm run e2e      # pruebas end-to-end con AUDIO REAL (requiere build previo)
```

> **Micrófono y HTTPS**: `getUserMedia` solo funciona en **localhost** o bajo **HTTPS**. En
> desarrollo funciona en localhost; para desplegar usa un host con HTTPS (Vercel, Netlify,
> GitHub Pages, etc.). La app usa `HashRouter`, así que funciona en hosting estático sin
> configuración de servidor.

## 🧪 Verificación

**Unitarias** (`npm run test`): validan los motores con audio sintético — una senoide de
frecuencia conocida → el detector monofónico devuelve esa frecuencia; una suma de senoides
(tríada Do mayor) → el polifónico devuelve las tres notas; el remuestreador a 22050 Hz
conserva la frecuencia.

**End-to-end con audio real** (`npm run e2e`): genera WAVs de tonos tipo piano
(armónicos + envolvente de decaimiento) y los inyecta como **micrófono falso de Chromium**
(`--use-file-for-fake-audio-capture`), verificando el pipeline completo
(getUserMedia → AudioContext → detector → validación → UI) en un navegador real:

1. El ejercicio «toca un Do» se completa cuando entra un Do por el micrófono.
2. La primera frase de la Oda a la Alegría avanza **nota a nota** hasta «¡Correcto!» y el
   progreso queda guardado.
3. El acorde de Do mayor tocado simultáneamente se valida con el motor estándar.
4. El **motor ML (Basic Pitch)** carga y detecta Do·Mi·Sol en el juego libre.

Límite honesto: el audio es piano sintetizado; lo único que no cubre es la acústica
particular de cada dispositivo/habitación (para eso está el ajuste de sensibilidad).

## 📁 Estructura

```
src/
  audio/      # noteUtils, fft, pitchDetector (mono), polyphonicDetector (poly),
              # mlDetector (Basic Pitch/TF.js), useMicrophone (hook), synth (Tone.js)
  theory/     # notes, scales, chords, intervals
  data/       # curriculum (módulos y lecciones), songs, library (biblioteca de canciones)
  practice/   # useNoteMatcher, ExerciseRunner, QuizExercise
  components/ # Piano/, Staff/, Tuner/, Metronome/, MicSetup/, ui/, LessonBlock
  pages/      # Onboarding, Dashboard, Curriculum, Lesson, Songs, Practice, Tools,
              # EarTraining, Progress
  store/      # useSettingsStore, useProgressStore (zustand + persist)
e2e/          # gen-audio.mjs (WAVs de piano sintetizado) + run.mjs (escenarios reales)
public/models/basic-pitch/  # modelo Basic Pitch servido localmente (Apache-2.0)
```

## 📝 Notas y límites

- La detección polifónica es intrínsecamente más difícil que la monofónica (armónicos
  compartidos, registro grave, timbre y ruido ambiente). Para los ejercicios de acordes se
  compara contra el acorde objetivo conocido, lo que la hace fiable; en el "juego libre" es
  best-effort. Si el motor estándar falla en tu piano, prueba el **motor ML** en Ajustes.
- Precisión y latencia dependen del dispositivo y del ruido; la **sensibilidad del
  micrófono** y el motor de detección se ajustan en la sección Ajustes.
- Las piezas de película se incluyen únicamente como fragmentos breves simplificados
  (transcripción libre, marcados en la app); el resto del repertorio es dominio público.
- El contenido del currículo son **datos** (`src/data/curriculum.ts`): añadir o ajustar
  lecciones y ejercicios es directo.
