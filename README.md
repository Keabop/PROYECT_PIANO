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
- **Detección de notas por micrófono**:
  - *Monofónica* (autocorrelación / McLeod Pitch Method) para notas sueltas, escalas y afinador.
  - *Polifónica* (FFT + saliencia armónica + resta iterativa) para **acordes tocados a la vez**,
    con *template matching* contra el acorde objetivo para máxima fiabilidad.
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
```

> **Micrófono y HTTPS**: `getUserMedia` solo funciona en **localhost** o bajo **HTTPS**. En
> desarrollo funciona en localhost; para desplegar usa un host con HTTPS (Vercel, Netlify,
> GitHub Pages, etc.). La app usa `HashRouter`, así que funciona en hosting estático sin
> configuración de servidor.

## 🧪 Verificación de la detección de tono (sin micrófono)

Las pruebas (`npm run test`) validan el motor alimentándolo con **audio sintético**:
- Una senoide de frecuencia conocida (440 Hz, 261.63 Hz…) → el detector monofónico devuelve esa
  frecuencia.
- Una **suma de senoides** (tríada Do mayor: Do4+Mi4+Sol4) → el detector polifónico devuelve las
  tres notas.

## 📁 Estructura

```
src/
  audio/      # noteUtils, fft, pitchDetector (mono), polyphonicDetector (poly),
              # useMicrophone (hook), synth (Tone.js)
  theory/     # notes, scales, chords, intervals
  data/       # curriculum (módulos y lecciones), songs
  practice/   # useNoteMatcher, ExerciseRunner, QuizExercise
  components/ # Piano/, Staff/, Tuner/, Metronome/, MicSetup/, ui/, LessonBlock
  pages/      # Onboarding, Dashboard, Curriculum, Lesson, Practice, Tools, EarTraining, Progress
  store/      # useSettingsStore, useProgressStore (zustand + persist)
```

## 📝 Notas y límites

- La detección polifónica es intrínsecamente más difícil que la monofónica (armónicos
  compartidos, registro grave, timbre y ruido ambiente). Para los ejercicios de acordes se
  compara contra el acorde objetivo conocido, lo que la hace fiable; en el "juego libre" es
  best-effort. Un backend basado en ML (p. ej. Basic Pitch) es una posible mejora futura.
- Precisión y latencia dependen del dispositivo y del ruido; el afinador y la sensibilidad se
  pueden ajustar en Herramientas.
- El contenido del currículo son **datos** (`src/data/curriculum.ts`): añadir o ajustar
  lecciones y ejercicios es directo.
