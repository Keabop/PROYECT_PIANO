// Detección de tono MONOFÓNICA (una nota a la vez).
// Método: autocorrelación normalizada (NSDF / McLeod Pitch Method), robusta para el
// timbre del piano. Devuelve la frecuencia fundamental y una "claridad" en [0, 1].

export interface PitchResult {
  frequency: number; // Hz (0 si no se detecta)
  clarity: number; // 0..1 (confianza)
  rms: number; // volumen aproximado del buffer
}

const EMPTY: PitchResult = { frequency: 0, clarity: 0, rms: 0 };

/**
 * Detecta el tono de un buffer de dominio del tiempo.
 * @param buffer  muestras normalizadas [-1, 1]
 * @param sampleRate  frecuencia de muestreo (Hz)
 * @param opts.minFreq / maxFreq  rango de búsqueda (por defecto rango de piano útil)
 * @param opts.clarityThreshold  umbral mínimo de claridad para aceptar (0..1)
 * @param opts.minRms  puerta de volumen: por debajo se considera silencio
 */
export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
  opts: { minFreq?: number; maxFreq?: number; clarityThreshold?: number; minRms?: number } = {}
): PitchResult {
  const { minFreq = 55, maxFreq = 1600, clarityThreshold = 0.9, minRms = 0.006 } = opts;
  const n = buffer.length;

  // RMS: filtra silencio/ruido de fondo.
  let rms = 0;
  for (let i = 0; i < n; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / n);
  if (rms < minRms) return { ...EMPTY, rms };

  const maxLag = Math.min(Math.floor(sampleRate / minFreq), n - 1);
  const minLag = Math.max(2, Math.floor(sampleRate / maxFreq));

  // NSDF (Normalized Square Difference Function) de McLeod.
  const nsdf = new Float32Array(maxLag + 1);
  for (let lag = minLag; lag <= maxLag; lag++) {
    let acf = 0; // autocorrelación
    let norm = 0; // energía (para normalizar)
    for (let i = 0; i < n - lag; i++) {
      const a = buffer[i];
      const b = buffer[i + lag];
      acf += a * b;
      norm += a * a + b * b;
    }
    nsdf[lag] = norm > 0 ? (2 * acf) / norm : 0;
  }

  // Selección de pico: primer máximo tras el primer cruce por cero positivo,
  // aceptando el mejor pico por encima de un umbral relativo al máximo global.
  let globalMax = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (nsdf[lag] > globalMax) globalMax = nsdf[lag];
  }
  if (globalMax <= 0) return { ...EMPTY, rms };

  const threshold = 0.8 * globalMax;
  let bestLag = -1;
  let searching = false;
  for (let lag = minLag; lag < maxLag; lag++) {
    if (!searching) {
      // esperar a que la NSDF baje de 0 antes de buscar el primer pico real
      if (nsdf[lag] < 0) searching = true;
      continue;
    }
    if (nsdf[lag] > threshold && nsdf[lag] > nsdf[lag - 1] && nsdf[lag] >= nsdf[lag + 1]) {
      bestLag = lag;
      break;
    }
  }
  if (bestLag < 0) return { ...EMPTY, rms };

  // Interpolación parabólica para afinar el lag (sub-muestra).
  const y0 = nsdf[bestLag - 1];
  const y1 = nsdf[bestLag];
  const y2 = nsdf[bestLag + 1];
  const denom = y0 - 2 * y1 + y2;
  const shift = denom !== 0 ? (0.5 * (y0 - y2)) / denom : 0;
  const refinedLag = bestLag + shift;

  const clarity = Math.max(0, Math.min(1, y1));
  if (clarity < clarityThreshold) return { ...EMPTY, rms };

  const frequency = sampleRate / refinedLag;
  if (frequency < minFreq || frequency > maxFreq) return { ...EMPTY, rms };

  return { frequency, clarity, rms };
}
