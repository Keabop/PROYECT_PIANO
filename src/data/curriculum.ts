// Currículo completo: principiante -> intermedio.
// Estructura: Module -> Lesson -> (Block[] de teoría) + (Exercise[] interactivos).
// El contenido son datos puros: es trivial ampliar o reordenar lecciones.

import { buildChord } from '../theory/chords';
import { buildScale } from '../theory/scales';
import { SONGS } from './songs';

// ----------------------------- Tipos -----------------------------

export type Clef = 'treble' | 'bass';

export type Block =
  | { kind: 'text'; title?: string; body: string }
  | { kind: 'tip'; body: string }
  | { kind: 'keyboard'; highlight: number[]; labels?: boolean; from?: number; to?: number; caption?: string }
  | { kind: 'listen'; notes: number[]; chord?: boolean; label: string }
  | { kind: 'staff'; notes: number[]; clef?: Clef; caption?: string };

export type Exercise =
  | { kind: 'playNote'; id: string; prompt: string; target: number }
  | { kind: 'playSequence'; id: string; prompt: string; targets: number[]; showStaff?: boolean; clef?: Clef }
  | { kind: 'playChord'; id: string; prompt: string; targets: number[] }
  | { kind: 'quiz'; id: string; prompt: string; options: string[]; answer: number; explain?: string };

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  blocks: Block[];
  exercises: Exercise[];
}

export type Level = 'beginner' | 'intermediate';

export interface Module {
  id: string;
  order: number;
  level: Level;
  title: string;
  emoji: string;
  description: string;
  lessons: Lesson[];
}

// --------------------------- Helpers de notas ---------------------------
const C3 = 48, C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71, C5 = 72;
const song = (id: string) => SONGS.find((s) => s.id === id)!;

// =============================================================
//                          MÓDULOS
// =============================================================

export const MODULES: Module[] = [
  // -------------------- 0. Bienvenida --------------------
  {
    id: 'bienvenida',
    order: 0,
    level: 'beginner',
    title: 'Bienvenida y preparación',
    emoji: '🎹',
    description: 'Todo listo para empezar: tu piano, tu postura y tu micrófono.',
    lessons: [
      {
        id: 'preparacion',
        title: 'Antes de tocar',
        subtitle: 'Prepara tu espacio, tu cuerpo y la app.',
        blocks: [
          {
            kind: 'text',
            title: 'Necesitas un piano o teclado',
            body: 'Esta app te enseña con TU instrumento real. Sirve un piano acústico, un piano digital o un teclado. Ideal: al menos 49 teclas; perfecto: 61 u 88.',
          },
          {
            kind: 'text',
            title: 'Postura correcta',
            body: 'Siéntate en el borde del asiento, espalda recta y hombros relajados. Los codos a la altura del teclado y las muñecas rectas, ni caídas ni levantadas. Los pies apoyados en el suelo.',
          },
          {
            kind: 'tip',
            body: 'Imagina que sostienes una pelotita pequeña en cada mano: los dedos se curvan de forma natural y tocas con las puntas.',
          },
          {
            kind: 'text',
            title: 'El micrófono es tu profesor',
            body: 'La app escuchará lo que tocas para corregirte en tiempo real. El audio nunca sale de tu dispositivo. Da permiso cuando te lo pida y toca cerca del micro, en un lugar silencioso.',
          },
        ],
        exercises: [
          {
            kind: 'quiz',
            id: 'q-postura',
            prompt: '¿Cómo deben estar las muñecas al tocar?',
            options: ['Caídas hacia abajo', 'Rectas y relajadas', 'Muy levantadas'],
            answer: 1,
            explain: 'Muñecas rectas y relajadas evitan tensiones y lesiones.',
          },
        ],
      },
    ],
  },

  // -------------------- 1. Conoce el teclado --------------------
  {
    id: 'teclado',
    order: 1,
    level: 'beginner',
    title: 'Conoce el teclado',
    emoji: '⬛',
    description: 'Teclas blancas y negras, encontrar el Do y el alfabeto musical.',
    lessons: [
      {
        id: 'mapa-teclado',
        title: 'El mapa del teclado',
        subtitle: 'Grupos de 2 y 3 teclas negras: tu brújula.',
        blocks: [
          {
            kind: 'text',
            title: 'Blancas y negras',
            body: 'Las teclas negras están agrupadas de 2 en 2 y de 3 en 3. Ese patrón se repite por todo el teclado y te permite orientarte sin mirar los nombres.',
          },
          {
            kind: 'text',
            title: 'Encontrar el Do (C)',
            body: 'El Do está justo a la IZQUIERDA de cada grupo de 2 teclas negras. Búscalo por todo tu teclado: verás que hay muchos "Do".',
          },
          { kind: 'keyboard', highlight: [C4], labels: true, from: 60, to: 72, caption: 'Do central (C4), a la izquierda de las 2 negras' },
          {
            kind: 'text',
            title: 'El alfabeto musical',
            body: 'Solo hay 7 nombres que se repiten: Do, Re, Mi, Fa, Sol, La, Si (C, D, E, F, G, A, B). Después de Si vuelve a empezar en Do, una octava más aguda.',
          },
          { kind: 'listen', notes: [C4, D4, E4, F4, G4, A4, B4, C5], label: 'Escucha las 7 notas + octava' },
        ],
        exercises: [
          {
            kind: 'quiz',
            id: 'q-do',
            prompt: '¿Dónde está el Do?',
            options: [
              'A la derecha de las 3 negras',
              'A la izquierda de las 2 negras',
              'En cualquier tecla negra',
            ],
            answer: 1,
          },
          { kind: 'playNote', id: 'ex-do', prompt: 'Toca un Do en tu piano (el central es ideal).', target: C4 },
        ],
      },
      {
        id: 'octavas',
        title: 'Octavas',
        subtitle: 'La misma nota, más grave o más aguda.',
        blocks: [
          {
            kind: 'text',
            body: 'La distancia entre un Do y el siguiente Do se llama OCTAVA. Suenan "iguales" pero uno es más agudo. A la izquierda del teclado los sonidos son graves; a la derecha, agudos.',
          },
          { kind: 'listen', notes: [C4, C5], label: 'Do central y el Do de arriba' },
        ],
        exercises: [
          { kind: 'playNote', id: 'ex-do5', prompt: 'Toca un Do más agudo que el central (una octava arriba).', target: C5 },
        ],
      },
    ],
  },

  // -------------------- 2. Manos y dedos --------------------
  {
    id: 'dedos',
    order: 2,
    level: 'beginner',
    title: 'Manos y dedos',
    emoji: '🖐️',
    description: 'Numeración de los dedos y posición base en Do.',
    lessons: [
      {
        id: 'numeracion',
        title: 'Numeración de los dedos',
        subtitle: 'Del 1 (pulgar) al 5 (meñique) en ambas manos.',
        blocks: [
          {
            kind: 'text',
            body: 'En ambas manos: 1 = pulgar, 2 = índice, 3 = medio, 4 = anular, 5 = meñique. Las partituras usan estos números para indicarte qué dedo usar.',
          },
          {
            kind: 'text',
            title: 'Posición de Do (mano derecha)',
            body: 'Coloca el pulgar (1) en el Do central y deja caer un dedo por tecla: 1=Do, 2=Re, 3=Mi, 4=Fa, 5=Sol. Esta es tu "posición de 5 dedos".',
          },
          { kind: 'keyboard', highlight: [C4, D4, E4, F4, G4], labels: true, from: 60, to: 72, caption: 'Posición de 5 dedos en Do' },
        ],
        exercises: [
          { kind: 'playSequence', id: 'ex-5dedos', prompt: 'Toca Do–Re–Mi–Fa–Sol con los dedos 1-2-3-4-5.', targets: [C4, D4, E4, F4, G4] },
          {
            kind: 'quiz',
            id: 'q-dedo',
            prompt: '¿Qué número es el dedo medio?',
            options: ['1', '3', '5'],
            answer: 1,
          },
        ],
      },
    ],
  },

  // -------------------- 3. Ritmo básico --------------------
  {
    id: 'ritmo',
    order: 3,
    level: 'beginner',
    title: 'Ritmo básico',
    emoji: '🥁',
    description: 'Pulso, figuras rítmicas y el compás de 4/4.',
    lessons: [
      {
        id: 'figuras',
        title: 'El pulso y las figuras',
        subtitle: 'Redonda, blanca, negra y corchea.',
        blocks: [
          {
            kind: 'text',
            title: 'El pulso',
            body: 'La música tiene un latido constante: el pulso. Contamos "1, 2, 3, 4" de forma regular. El metrónomo (en Herramientas) marca ese pulso.',
          },
          {
            kind: 'text',
            title: 'Figuras y su duración (en 4/4)',
            body: 'Redonda = 4 tiempos. Blanca = 2 tiempos. Negra = 1 tiempo. Corchea = medio tiempo (dos por pulso: "1 y 2 y").',
          },
          {
            kind: 'text',
            title: 'El compás de 4/4',
            body: 'La mayoría de canciones se agrupan en compases de 4 tiempos. El primer tiempo se siente más fuerte (acento).',
          },
        ],
        exercises: [
          {
            kind: 'quiz',
            id: 'q-negra',
            prompt: 'En 4/4, ¿cuántos tiempos dura una blanca?',
            options: ['1', '2', '4'],
            answer: 1,
          },
          { kind: 'playSequence', id: 'ex-pulso', prompt: 'Toca 4 veces el Do, una por pulso, contando "1-2-3-4".', targets: [C4, C4, C4, C4] },
        ],
      },
    ],
  },

  // -------------------- 4. Primeras melodías --------------------
  {
    id: 'melodias',
    order: 4,
    level: 'beginner',
    title: 'Primeras melodías',
    emoji: '🎵',
    description: 'Tus primeras canciones reales con la mano derecha.',
    lessons: [
      {
        id: 'oda',
        title: 'Oda a la Alegría',
        subtitle: 'Tu primera melodía completa.',
        blocks: [
          { kind: 'text', body: 'Empieza con el dedo 3 en Mi. Ve despacio y usa el metrónomo si quieres. La app escuchará cada nota.' },
          { kind: 'listen', notes: song('oda-alegria').notes, label: 'Escuchar la melodía' },
        ],
        exercises: [
          { kind: 'playSequence', id: 'ex-oda', prompt: 'Toca la Oda a la Alegría nota a nota.', targets: song('oda-alegria').notes, showStaff: true },
        ],
      },
      {
        id: 'estrellita',
        title: 'Estrellita',
        subtitle: 'La melodía que todos reconocen.',
        blocks: [
          { kind: 'text', body: 'Do Do Sol Sol La La Sol. Fíjate cómo salta de Do a Sol al principio.' },
          { kind: 'listen', notes: song('estrellita').notes, label: 'Escuchar Estrellita' },
        ],
        exercises: [
          { kind: 'playSequence', id: 'ex-estrellita', prompt: 'Toca Estrellita completa.', targets: song('estrellita').notes, showStaff: true },
        ],
      },
    ],
  },

  // -------------------- 5. Leer partituras --------------------
  {
    id: 'partitura',
    order: 5,
    level: 'beginner',
    title: 'Leer partituras',
    emoji: '📖',
    description: 'El pentagrama, la clave de Sol y de Fa, y las notas.',
    lessons: [
      {
        id: 'pentagrama',
        title: 'El pentagrama y la clave de Sol',
        subtitle: 'Dónde vive cada nota.',
        blocks: [
          {
            kind: 'text',
            title: 'El pentagrama',
            body: 'Son 5 líneas y 4 espacios. Cuanto más arriba está una nota, más aguda suena. La clave de Sol (𝄞) se usa para la mano derecha.',
          },
          {
            kind: 'text',
            title: 'El Do central en clave de Sol',
            body: 'El Do central va en una línea adicional justo debajo del pentagrama. Desde ahí subimos: Re, Mi, Fa, Sol...',
          },
          { kind: 'staff', notes: [C4, D4, E4, F4, G4], clef: 'treble', caption: 'Do–Re–Mi–Fa–Sol en clave de Sol' },
        ],
        exercises: [
          { kind: 'playSequence', id: 'ex-lee1', prompt: 'Lee y toca lo que ves en el pentagrama.', targets: [C4, E4, G4, E4, C4], showStaff: true },
        ],
      },
      {
        id: 'clave-fa',
        title: 'La clave de Fa',
        subtitle: 'Para la mano izquierda y los graves.',
        blocks: [
          {
            kind: 'text',
            body: 'La clave de Fa (𝄢) se usa para la mano izquierda. El Do central aquí va en una línea adicional justo ENCIMA del pentagrama. Los pianistas leen ambas claves a la vez (gran pentagrama).',
          },
          { kind: 'staff', notes: [C3, 52, 55, 60], clef: 'bass', caption: 'Notas graves en clave de Fa' },
        ],
        exercises: [
          {
            kind: 'quiz',
            id: 'q-clavefa',
            prompt: '¿Para qué mano se usa normalmente la clave de Fa?',
            options: ['Derecha', 'Izquierda', 'Ninguna'],
            answer: 1,
          },
        ],
      },
    ],
  },

  // -------------------- 6. Sostenidos y bemoles --------------------
  {
    id: 'alteraciones',
    order: 6,
    level: 'beginner',
    title: 'Sostenidos y bemoles',
    emoji: '♯',
    description: 'Las teclas negras, tonos y semitonos.',
    lessons: [
      {
        id: 'semitonos',
        title: 'Tonos y semitonos',
        subtitle: 'La distancia más pequeña del piano.',
        blocks: [
          {
            kind: 'text',
            title: 'Semitono',
            body: 'Es la distancia de una tecla a la de al lado (sea blanca o negra). De Mi a Fa hay un semitono (¡y no hay negra entre ellas!).',
          },
          {
            kind: 'text',
            title: 'Sostenido (♯) y bemol (♭)',
            body: 'Sostenido = un semitono más agudo (a la derecha). Bemol = un semitono más grave (a la izquierda). Do♯ es la negra entre Do y Re; también es Re♭.',
          },
          { kind: 'keyboard', highlight: [61, 63, 66, 68, 70], labels: true, from: 60, to: 72, caption: 'Las teclas negras: Do♯ Re♯ Fa♯ Sol♯ La♯' },
        ],
        exercises: [
          { kind: 'playNote', id: 'ex-dosos', prompt: 'Toca Do♯ (la negra entre Do y Re).', target: 61 },
          {
            kind: 'quiz',
            id: 'q-semitono',
            prompt: '¿Qué par de notas blancas NO tiene tecla negra entre medias?',
            options: ['Do y Re', 'Mi y Fa', 'Sol y La'],
            answer: 1,
          },
        ],
      },
    ],
  },

  // -------------------- 7. Escalas mayores --------------------
  {
    id: 'escalas',
    order: 7,
    level: 'beginner',
    title: 'Escalas mayores',
    emoji: '🪜',
    description: 'La escala de Do mayor y el paso del pulgar.',
    lessons: [
      {
        id: 'do-mayor',
        title: 'Escala de Do mayor',
        subtitle: 'Todas blancas, de Do a Do.',
        blocks: [
          {
            kind: 'text',
            title: 'El patrón mayor',
            body: 'Una escala mayor sigue el patrón Tono-Tono-Semitono-Tono-Tono-Tono-Semitono. En Do mayor son todas las teclas blancas: Do Re Mi Fa Sol La Si Do.',
          },
          {
            kind: 'text',
            title: 'El paso del pulgar',
            body: 'Con 5 dedos no llegas a 8 notas. La clave: tras tocar Do-Re-Mi (1-2-3), pasa el pulgar POR DEBAJO para tocar Fa (1) y sigue 2-3-4-5. Digitación: 1 2 3 1 2 3 4 5.',
          },
          { kind: 'listen', notes: buildScale(C4, 'major'), label: 'Escuchar la escala de Do mayor' },
        ],
        exercises: [
          { kind: 'playSequence', id: 'ex-domayor', prompt: 'Toca la escala de Do mayor subiendo (1 2 3 1 2 3 4 5).', targets: buildScale(C4, 'major'), showStaff: true },
        ],
      },
      {
        id: 'sol-mayor',
        title: 'Escala de Sol mayor',
        subtitle: 'Tu primer sostenido: Fa♯.',
        blocks: [
          {
            kind: 'text',
            body: 'Sol mayor usa la misma fórmula empezando en Sol. Para que el patrón encaje, el Fa se convierte en Fa♯. Notas: Sol La Si Do Re Mi Fa♯ Sol.',
          },
          { kind: 'listen', notes: buildScale(G4, 'major'), label: 'Escuchar Sol mayor' },
        ],
        exercises: [
          { kind: 'playSequence', id: 'ex-solmayor', prompt: 'Toca la escala de Sol mayor (ojo al Fa♯).', targets: buildScale(G4, 'major') },
        ],
      },
    ],
  },

  // -------------------- 8. Intervalos --------------------
  {
    id: 'intervalos',
    order: 8,
    level: 'beginner',
    title: 'Intervalos',
    emoji: '📏',
    description: 'La distancia entre dos notas: de segundas a octavas.',
    lessons: [
      {
        id: 'intervalos-basicos',
        title: 'Reconocer intervalos',
        subtitle: 'Terceras, quintas y octavas.',
        blocks: [
          {
            kind: 'text',
            body: 'Un intervalo es la distancia entre dos notas. Contando líneas del pentagrama: de Do a Mi hay una TERCERA; de Do a Sol una QUINTA; de Do al siguiente Do, una OCTAVA.',
          },
          { kind: 'listen', notes: [C4, E4], chord: false, label: 'Tercera (Do–Mi)' },
          { kind: 'listen', notes: [C4, G4], chord: false, label: 'Quinta (Do–Sol)' },
        ],
        exercises: [
          { kind: 'playSequence', id: 'ex-tercera', prompt: 'Toca una tercera: Do y luego Mi.', targets: [C4, E4] },
          {
            kind: 'quiz',
            id: 'q-octava',
            prompt: 'De Do al siguiente Do hay una...',
            options: ['Quinta', 'Séptima', 'Octava'],
            answer: 2,
          },
        ],
      },
    ],
  },

  // -------------------- 9. Acordes --------------------
  {
    id: 'acordes',
    order: 9,
    level: 'beginner',
    title: 'Acordes (tríadas)',
    emoji: '🎶',
    description: 'Tres notas a la vez: acordes mayores y menores.',
    lessons: [
      {
        id: 'triadas',
        title: 'Tríadas mayores y menores',
        subtitle: 'Toca 3 notas simultáneas. El micrófono las escucha a la vez.',
        blocks: [
          {
            kind: 'text',
            title: 'Qué es una tríada',
            body: 'Un acorde de 3 notas: fundamental + tercera + quinta. Do mayor = Do-Mi-Sol. Usa los dedos 1-3-5 de la mano derecha.',
          },
          {
            kind: 'text',
            title: 'Mayor vs menor',
            body: 'La tercera decide el carácter: mayor (alegre) tiene la tercera "grande" (Do-Mi); menor (triste) la baja un semitono (Do-Mi♭). Do menor = Do-Mi♭-Sol.',
          },
          { kind: 'keyboard', highlight: buildChord(C4, 'major'), labels: true, from: 60, to: 72, caption: 'Acorde de Do mayor (Do-Mi-Sol)' },
          { kind: 'listen', notes: buildChord(C4, 'major'), chord: true, label: 'Escuchar Do mayor' },
          { kind: 'listen', notes: buildChord(C4, 'minor'), chord: true, label: 'Escuchar Do menor' },
        ],
        exercises: [
          { kind: 'playChord', id: 'ex-domayor-ac', prompt: 'Toca el acorde de Do mayor (Do+Mi+Sol) a la vez.', targets: buildChord(C4, 'major') },
          { kind: 'playChord', id: 'ex-solmayor-ac', prompt: 'Toca el acorde de Sol mayor (Sol+Si+Re).', targets: buildChord(G4, 'major') },
          {
            kind: 'quiz',
            id: 'q-menor',
            prompt: '¿Qué nota cambia para pasar de Do mayor a Do menor?',
            options: ['La fundamental (Do)', 'La tercera (Mi → Mi♭)', 'La quinta (Sol)'],
            answer: 1,
          },
        ],
      },
    ],
  },

  // -------------------- 10. Progresiones --------------------
  {
    id: 'progresiones',
    order: 10,
    level: 'beginner',
    title: 'Progresiones de acordes',
    emoji: '🔁',
    description: 'I–IV–V–I: la base de miles de canciones.',
    lessons: [
      {
        id: 'i-iv-v',
        title: 'La progresión I–IV–V',
        subtitle: 'En Do: Do → Fa → Sol → Do.',
        blocks: [
          {
            kind: 'text',
            body: 'En una tonalidad, los acordes se numeran con romanos. En Do mayor, I=Do, IV=Fa, V=Sol. Encadenarlos (I-IV-V-I) suena a "casa-tensión-resolución".',
          },
          { kind: 'listen', notes: buildChord(C4, 'major'), chord: true, label: 'I — Do mayor' },
          { kind: 'listen', notes: buildChord(F4, 'major'), chord: true, label: 'IV — Fa mayor' },
          { kind: 'listen', notes: buildChord(G4, 'major'), chord: true, label: 'V — Sol mayor' },
        ],
        exercises: [
          { kind: 'playChord', id: 'ex-I', prompt: 'Toca I: Do mayor.', targets: buildChord(C4, 'major') },
          { kind: 'playChord', id: 'ex-IV', prompt: 'Toca IV: Fa mayor.', targets: buildChord(F4, 'major') },
          { kind: 'playChord', id: 'ex-V', prompt: 'Toca V: Sol mayor.', targets: buildChord(G4, 'major') },
        ],
      },
    ],
  },

  // -------------------- 11. Dos manos --------------------
  {
    id: 'dos-manos',
    order: 11,
    level: 'beginner',
    title: 'Dos manos juntas',
    emoji: '🙌',
    description: 'Melodía en la derecha, acordes en la izquierda.',
    lessons: [
      {
        id: 'coordinacion',
        title: 'Coordinar ambas manos',
        subtitle: 'Empieza lento y por separado.',
        blocks: [
          {
            kind: 'text',
            body: 'El reto no es la velocidad, es la independencia. Practica cada mano por separado hasta que salga sola; luego únelas MUY despacio. La mano izquierda suele llevar el acorde base.',
          },
          {
            kind: 'tip',
            body: 'Truco: toca el acorde de la izquierda en el primer tiempo de cada compás y deja que suene mientras la derecha hace la melodía.',
          },
        ],
        exercises: [
          { kind: 'playChord', id: 'ex-izq', prompt: 'Mano izquierda: toca Do mayor grave (Do-Mi-Sol).', targets: buildChord(C3, 'major') },
          { kind: 'playSequence', id: 'ex-der', prompt: 'Mano derecha: toca la melodía Do-Re-Mi-Do.', targets: [C4, D4, E4, C4] },
        ],
      },
    ],
  },

  // ================= INTERMEDIO =================

  // -------------------- 12. Escalas menores --------------------
  {
    id: 'escalas-menores',
    order: 12,
    level: 'intermediate',
    title: 'Escalas menores',
    emoji: '🌙',
    description: 'Natural, armónica y melódica.',
    lessons: [
      {
        id: 'la-menor',
        title: 'La menor y sus variantes',
        subtitle: 'La relativa menor de Do mayor.',
        blocks: [
          {
            kind: 'text',
            body: 'La menor natural usa las mismas teclas que Do mayor, pero empieza en La: La Si Do Re Mi Fa Sol La. La MENOR ARMÓNICA sube el 7º grado (Sol♯) para crear tensión hacia la tónica.',
          },
          { kind: 'listen', notes: buildScale(A4, 'naturalMinor'), label: 'La menor natural' },
          { kind: 'listen', notes: buildScale(A4, 'harmonicMinor'), label: 'La menor armónica (ojo al Sol♯)' },
        ],
        exercises: [
          { kind: 'playSequence', id: 'ex-lamenor', prompt: 'Toca La menor natural.', targets: buildScale(A4, 'naturalMinor') },
          { kind: 'playSequence', id: 'ex-lamenor-arm', prompt: 'Toca La menor armónica (Sol♯).', targets: buildScale(A4, 'harmonicMinor') },
        ],
      },
    ],
  },

  // -------------------- 13. Armaduras --------------------
  {
    id: 'armaduras',
    order: 13,
    level: 'intermediate',
    title: 'Armaduras y círculo de quintas',
    emoji: '🎯',
    description: 'Cuántos sostenidos o bemoles tiene cada tonalidad.',
    lessons: [
      {
        id: 'circulo',
        title: 'El círculo de quintas',
        subtitle: 'Un mapa de todas las tonalidades.',
        blocks: [
          {
            kind: 'text',
            body: 'Cada tonalidad mayor tiene una armadura fija de sostenidos o bemoles. Subiendo de quinta en quinta (Do→Sol→Re→La...) se añade un sostenido cada vez. Do=0, Sol=1♯ (Fa♯), Re=2♯ (Fa♯,Do♯)...',
          },
          {
            kind: 'text',
            title: 'Por qué importa',
            body: 'La armadura al inicio del pentagrama te dice qué notas van alteradas en TODA la pieza, sin repetir el símbolo en cada nota.',
          },
        ],
        exercises: [
          {
            kind: 'quiz',
            id: 'q-sol',
            prompt: '¿Cuántos sostenidos tiene la tonalidad de Sol mayor?',
            options: ['0', '1 (Fa♯)', '2'],
            answer: 1,
          },
        ],
      },
    ],
  },

  // -------------------- 14. Inversiones --------------------
  {
    id: 'inversiones',
    order: 14,
    level: 'intermediate',
    title: 'Inversiones de acordes',
    emoji: '🔀',
    description: 'El mismo acorde con otra nota en el bajo.',
    lessons: [
      {
        id: 'inversiones-basicas',
        title: 'Primera y segunda inversión',
        subtitle: 'Mueve la nota más grave arriba.',
        blocks: [
          {
            kind: 'text',
            body: 'Do mayor fundamental = Do-Mi-Sol. 1ª inversión = Mi-Sol-Do (la 3ª en el bajo). 2ª inversión = Sol-Do-Mi. Las inversiones permiten cambiar de acorde moviendo poco los dedos.',
          },
          { kind: 'listen', notes: buildChord(C4, 'major', 0), chord: true, label: 'Fundamental' },
          { kind: 'listen', notes: buildChord(C4, 'major', 1), chord: true, label: '1ª inversión' },
          { kind: 'listen', notes: buildChord(C4, 'major', 2), chord: true, label: '2ª inversión' },
        ],
        exercises: [
          { kind: 'playChord', id: 'ex-inv1', prompt: 'Toca Do mayor en 1ª inversión (Mi-Sol-Do).', targets: buildChord(C4, 'major', 1) },
          { kind: 'playChord', id: 'ex-inv2', prompt: 'Toca Do mayor en 2ª inversión (Sol-Do-Mi).', targets: buildChord(C4, 'major', 2) },
        ],
      },
    ],
  },

  // -------------------- 15. Séptimas --------------------
  {
    id: 'septimas',
    order: 15,
    level: 'intermediate',
    title: 'Acordes de séptima',
    emoji: '7️⃣',
    description: 'Añade color: dominantes, mayores y menores.',
    lessons: [
      {
        id: 'septimas-basicas',
        title: 'La séptima dominante',
        subtitle: 'El acorde que "pide" resolver.',
        blocks: [
          {
            kind: 'text',
            body: 'Añade una cuarta nota a la tríada. Sol7 (dominante) = Sol-Si-Re-Fa y empuja fuertemente hacia Do. Es la base del blues, el jazz y el pop.',
          },
          { kind: 'listen', notes: buildChord(G4, 'dominant7'), chord: true, label: 'Sol7 (dominante)' },
          { kind: 'listen', notes: buildChord(C4, 'major7'), chord: true, label: 'Do maj7' },
        ],
        exercises: [
          { kind: 'playChord', id: 'ex-g7', prompt: 'Toca Sol7 (Sol-Si-Re-Fa).', targets: buildChord(G4, 'dominant7') },
          { kind: 'playChord', id: 'ex-cmaj7', prompt: 'Toca Do maj7 (Do-Mi-Sol-Si).', targets: buildChord(C4, 'major7') },
        ],
      },
    ],
  },

  // -------------------- 16. Arpegios --------------------
  {
    id: 'arpegios',
    order: 16,
    level: 'intermediate',
    title: 'Arpegios',
    emoji: '💫',
    description: 'Las notas del acorde tocadas una a una.',
    lessons: [
      {
        id: 'arpegios-basicos',
        title: 'Arpegio de Do mayor',
        subtitle: 'Fluidez y paso del pulgar.',
        blocks: [
          {
            kind: 'text',
            body: 'Un arpegio "despliega" el acorde: Do-Mi-Sol-Do en vez de tocarlas juntas. Requiere pasar el pulgar como en las escalas. Aportan movimiento y acompañamientos preciosos.',
          },
          { kind: 'listen', notes: [C4, E4, G4, C5], label: 'Arpegio de Do mayor' },
        ],
        exercises: [
          { kind: 'playSequence', id: 'ex-arp', prompt: 'Toca el arpegio Do-Mi-Sol-Do subiendo.', targets: [C4, E4, G4, C5] },
        ],
      },
    ],
  },

  // -------------------- 17. Expresión --------------------
  {
    id: 'expresion',
    order: 17,
    level: 'intermediate',
    title: 'Dinámica, articulación y pedal',
    emoji: '🎚️',
    description: 'Toca con matices, no solo notas correctas.',
    lessons: [
      {
        id: 'matices',
        title: 'Fuerte, suave, ligado y pedal',
        subtitle: 'Lo que convierte notas en música.',
        blocks: [
          {
            kind: 'text',
            title: 'Dinámica',
            body: 'p (piano) = suave, f (forte) = fuerte, y los intermedios (mp, mf). Controlas el volumen con la fuerza de la pulsación.',
          },
          {
            kind: 'text',
            title: 'Articulación',
            body: 'Legato = notas ligadas y suaves; staccato = cortas y separadas. Cambian por completo el carácter de una frase.',
          },
          {
            kind: 'text',
            title: 'El pedal de resonancia',
            body: 'El pedal derecho mantiene el sonido y une los acordes. Técnica clave: cambia el pedal JUSTO al tocar el nuevo acorde (pedal sincopado) para no "embarrar" el sonido.',
          },
        ],
        exercises: [
          {
            kind: 'quiz',
            id: 'q-legato',
            prompt: '¿Qué significa "staccato"?',
            options: ['Notas ligadas', 'Notas cortas y separadas', 'Muy fuerte'],
            answer: 1,
          },
        ],
      },
    ],
  },

  // -------------------- 18. Lectura a primera vista --------------------
  {
    id: 'lectura-vista',
    order: 18,
    level: 'intermediate',
    title: 'Lectura a primera vista',
    emoji: '👀',
    description: 'Leer y tocar algo nuevo sin pararte.',
    lessons: [
      {
        id: 'sight',
        title: 'Estrategia de lectura',
        subtitle: 'Mira adelante, no te pares.',
        blocks: [
          {
            kind: 'text',
            body: 'Antes de tocar: identifica la armadura, el compás y las notas más agudas/graves. Al tocar, la regla de oro es NUNCA parar: mantén el pulso aunque falles una nota, y ve leyendo un poco por delante de lo que tocas.',
          },
          { kind: 'staff', notes: [C4, E4, G4, F4, E4, D4, C4], clef: 'treble', caption: 'Lee esto de un tirón, a pulso constante' },
        ],
        exercises: [
          { kind: 'playSequence', id: 'ex-sight', prompt: 'Lee y toca esta frase sin parar.', targets: [C4, E4, G4, F4, E4, D4, C4], showStaff: true },
        ],
      },
    ],
  },
];

// --------------------------- API auxiliar ---------------------------

export function getModule(id: string): Module | undefined {
  return MODULES.find((m) => m.id === id);
}

export function getLesson(moduleId: string, lessonId: string): { module: Module; lesson: Lesson } | undefined {
  const module = getModule(moduleId);
  const lesson = module?.lessons.find((l) => l.id === lessonId);
  if (!module || !lesson) return undefined;
  return { module, lesson };
}

/** Lista plana de todas las lecciones en orden, con su módulo. */
export function flatLessons(): { module: Module; lesson: Lesson }[] {
  return MODULES.flatMap((module) => module.lessons.map((lesson) => ({ module, lesson })));
}

export function totalLessons(): number {
  return MODULES.reduce((sum, m) => sum + m.lessons.length, 0);
}

/** Clave única de una lección para el registro de progreso. */
export function lessonKey(moduleId: string, lessonId: string): string {
  return `${moduleId}/${lessonId}`;
}
