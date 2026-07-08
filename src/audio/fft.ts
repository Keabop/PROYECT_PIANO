// FFT radix-2 iterativa (Cooley-Tukey) para análisis espectral.
// Trabaja in-place sobre pares de arrays real/imaginario del mismo tamaño (potencia de 2).

/** ¿Es potencia de 2? */
export function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * FFT in-place. `re` e `im` deben tener longitud N = potencia de 2.
 * Para una señal real, inicializa `im` a ceros.
 */
export function fft(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  if (!isPowerOfTwo(n)) {
    throw new Error(`FFT: la longitud debe ser potencia de 2, recibido ${n}`);
  }

  // Permutación bit-reversa
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) {
      j ^= bit;
    }
    j ^= bit;
    if (i < j) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
  }

  // Mariposas
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wpr = Math.cos(ang);
    const wpi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wr = 1;
      let wi = 0;
      const half = len >> 1;
      for (let k = 0; k < half; k++) {
        const a = i + k;
        const b = a + half;
        const tr = wr * re[b] - wi * im[b];
        const ti = wr * im[b] + wi * re[b];
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const tmp = wr;
        wr = tmp * wpr - wi * wpi;
        wi = tmp * wpi + wi * wpr;
      }
    }
  }
}

/**
 * Magnitud del espectro de una señal real (mitad útil: N/2 bins).
 * Aplica ventana de Hann para reducir el leakage espectral.
 * Devuelve un Float32Array de longitud N/2 con las magnitudes.
 */
export function magnitudeSpectrum(signal: Float32Array, fftSize: number): Float32Array {
  const re = new Float32Array(fftSize);
  const im = new Float32Array(fftSize);
  const len = Math.min(signal.length, fftSize);

  // Ventana de Hann
  for (let i = 0; i < len; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)));
    re[i] = signal[i] * w;
  }

  fft(re, im);

  const half = fftSize >> 1;
  const mag = new Float32Array(half);
  for (let i = 0; i < half; i++) {
    mag[i] = Math.hypot(re[i], im[i]);
  }
  return mag;
}
