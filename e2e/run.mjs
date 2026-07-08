// E2E con AUDIO REAL: inyecta WAVs de piano sintetizado como micrófono falso de Chromium
// y comprueba que la app escucha, valida las notas y avanza — el pipeline completo:
// getUserMedia -> AudioContext -> detector -> matcher -> UI.
//
// Uso: npm run e2e   (requiere `npm run build` previo; el script levanta vite preview)

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { generateAll } from './gen-audio.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = join(ROOT, 'e2e', 'shots');
const PORT = 4319;
const BASE = `http://localhost:${PORT}/#`;

// Chromium: primero el del entorno de Playwright, si no, variable CHROME_BIN.
const CANDIDATES = [
  process.env.CHROME_BIN,
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  '/opt/pw-browsers/chromium/chrome-linux/chrome',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
].filter(Boolean);
const EXEC = CANDIDATES.find((p) => existsSync(p));
if (!EXEC) {
  console.error('No se encontró Chromium. Define CHROME_BIN.');
  process.exit(2);
}

const SETTINGS = (extra = {}) =>
  JSON.stringify({
    state: {
      onboarded: true,
      micGranted: true,
      a4: 440,
      naming: 'es',
      theme: 'dark',
      micSensitivity: 0.5,
      detectionEngine: 'standard',
      ...extra,
    },
    version: 0,
  });

async function launchWithMic(wavPath, settings) {
  const browser = await chromium.launch({
    executablePath: EXEC,
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      `--use-file-for-fake-audio-capture=${wavPath}`,
      '--autoplay-policy=no-user-gesture-required',
      '--enable-unsafe-swiftshader',
    ],
  });
  const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
  page.on('pageerror', (e) => console.log('  [pageerror]', e.message));
  await page.addInitScript((s) => localStorage.setItem('pianoapp-settings', s), settings);
  return { browser, page };
}

const results = [];
async function scenario(name, fn) {
  process.stdout.write(`\n▶ ${name}\n`);
  const t0 = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, secs: ((Date.now() - t0) / 1000).toFixed(1) });
    console.log(`  ✅ OK (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  } catch (err) {
    results.push({ name, ok: false, secs: ((Date.now() - t0) / 1000).toFixed(1), err: String(err).slice(0, 300) });
    console.log(`  ❌ FALLO: ${String(err).slice(0, 300)}`);
  }
}

// ------------------------------------------------------------------
const audioDir = generateAll();
mkdirSync(SHOTS, { recursive: true });

// Levanta vite preview sobre el build actual.
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: ROOT,
  stdio: 'ignore',
  detached: true,
});
process.on('exit', () => {
  try {
    process.kill(-server.pid);
  } catch {}
});
// Espera a que responda.
for (let i = 0; i < 40; i++) {
  try {
    const r = await fetch(`http://localhost:${PORT}/`);
    if (r.ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 500));
}

// ------------------------------------------------------------------
// 1) LECCIÓN: el ejercicio "toca un Do" se completa con audio real de C4.
await scenario('Lección: nota Do validada por el micrófono', async () => {
  const { browser, page } = await launchWithMic(join(audioDir, 'nota-do.wav'), SETTINGS());
  try {
    await page.goto(`${BASE}/leccion/teclado/mapa-teclado`, { waitUntil: 'networkidle' });
    // Primer ejercicio es un quiz: respóndelo para llegar al de tocar.
    await page.getByRole('button', { name: 'A la izquierda de las 2 negras' }).click();
    await page.getByText('Toca un Do en tu piano', { exact: false }).waitFor({ timeout: 5000 });
    await page.getByRole('button', { name: /Activar micrófono/ }).click();
    await page.getByText('Escuchando tu piano').waitFor({ timeout: 8000 });
    await page.getByText('¡Correcto!').waitFor({ timeout: 30000 });
    await page.screenshot({ path: join(SHOTS, '1-leccion-nota-do.png') });
  } finally {
    await browser.close();
  }
});

// 2) CANCIÓN: la primera frase de la Oda a la Alegría avanza nota a nota hasta completarse.
await scenario('Canción: frase de la Oda a la Alegría completada nota a nota', async () => {
  const { browser, page } = await launchWithMic(join(audioDir, 'oda.wav'), SETTINGS());
  try {
    await page.goto(`${BASE}/canciones/oda-alegria`, { waitUntil: 'networkidle' });
    // La vista cascada (notas cayendo hacia el teclado) es la vista por defecto.
    await page.locator('[data-testid="waterfall"]').waitFor({ timeout: 5000 });
    await page.getByRole('button', { name: /Activar micrófono/ }).click();
    await page.getByText('Escuchando tu piano').waitFor({ timeout: 8000 });
    // 15 notas ≈ 15 s por vuelta del WAV; margen para entrar a mitad de loop.
    await page.getByText('¡Correcto!').waitFor({ timeout: 90000 });
    await page.screenshot({ path: join(SHOTS, '2-cancion-oda.png') });
    // Evidencia extra: el progreso queda guardado (onComplete corre ~700 ms después)
    // y el sistema de maestría registró la repetición (reps: 1 → medalla de bronce).
    await page.waitForFunction(
      () => {
        const raw = localStorage.getItem('pianoapp-progress') ?? '';
        return raw.includes('cancion/oda-alegria/0') && raw.includes('"reps":1');
      },
      { timeout: 8000 }
    );
    // El panel post-frase ofrece repetir (camino a la medalla) en vez de saltar sola.
    await page.getByRole('button', { name: /Repetir/ }).waitFor({ timeout: 5000 });
  } finally {
    await browser.close();
  }
});

// 3) ACORDE (motor estándar): Do mayor tocado simultáneamente se valida.
await scenario('Acorde Do mayor (motor estándar) validado', async () => {
  const { browser, page } = await launchWithMic(join(audioDir, 'acorde-do.wav'), SETTINGS());
  try {
    await page.goto(`${BASE}/leccion/acordes/triadas`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Activar micrófono/ }).click();
    await page.getByText('Escuchando tu piano').waitFor({ timeout: 8000 });
    await page.getByText('¡Correcto!').waitFor({ timeout: 30000 });
    await page.screenshot({ path: join(SHOTS, '3-acorde-estandar.png') });
  } finally {
    await browser.close();
  }
});

// 4) ACORDE (motor ML Basic Pitch): el juego libre detecta Do-Mi-Sol.
await scenario('Motor ML (Basic Pitch): detecta Do·Mi·Sol en juego libre', async () => {
  const { browser, page } = await launchWithMic(
    join(audioDir, 'acorde-do.wav'),
    SETTINGS({ detectionEngine: 'ml' })
  );
  try {
    await page.goto(`${BASE}/practica`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Activar micrófono/ }).click();
    // Espera generosa: primero carga TF.js + modelo, luego inferencia por CPU.
    await page.getByText('Motor ML: listo').waitFor({ timeout: 120000 });
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="freeplay-notes"]');
        const t = el?.textContent ?? '';
        return t.includes('Do') && t.includes('Mi') && t.includes('Sol');
      },
      { timeout: 120000 }
    );
    await page.screenshot({ path: join(SHOTS, '4-acorde-ml.png') });
  } finally {
    await browser.close();
  }
});

// 5) MODO "ESPÉRAME" (cascada continua que pausa en cada nota): la frase de la Oda
//    se completa con audio real — la canción avanza solo cuando el micrófono
//    escucha la nota correcta.
await scenario('Modo Espérame: cascada continua completada con el micrófono', async () => {
  const { browser, page } = await launchWithMic(join(audioDir, 'oda.wav'), SETTINGS());
  try {
    await page.goto(`${BASE}/canciones/oda-alegria`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Espérame/ }).click();
    await page.locator('[data-testid="flow-waterfall"]').waitFor({ timeout: 5000 });
    await page.getByRole('button', { name: /Activar micrófono/ }).click();
    await page.getByText('Escuchando tu piano').waitFor({ timeout: 8000 });
    await page.locator('[data-testid="flow-play"]').click(); // Empezar
    // 15 notas ≈ 15 s de WAV; margen por entrar a mitad de loop y el lead-in.
    await page.getByText(/notas acertadas/).waitFor({ timeout: 120000 });
    const summary = await page.getByText(/notas acertadas/).textContent();
    if (!/15\/15/.test(summary ?? '')) throw new Error('No acertó todas: ' + summary);
    await page.screenshot({ path: join(SHOTS, '5-esperame.png') });
  } finally {
    await browser.close();
  }
});

// 6) IMPORTAR PARTITURA: un MIDI real se importa por la UI y queda practicable.
await scenario('Importar MIDI: crea la canción con frases y ritmo', async () => {
  // Genera un MIDI real con @tonejs/midi (la misma lib que usa la app).
  const midiMod = await import('@tonejs/midi');
  const Midi = midiMod.Midi ?? midiMod.default.Midi;
  const midi = new Midi();
  midi.header.setTempo(100);
  const track = midi.addTrack();
  const beat = 60 / 100;
  [60, 62, 64, 65, 67, 65, 64, 62, 60].forEach((m, i) => {
    track.addNote({ midi: m, time: i * beat, duration: beat * 0.9 });
  });
  const midiPath = join(audioDir, 'importado.mid');
  const { writeFileSync } = await import('node:fs');
  writeFileSync(midiPath, Buffer.from(midi.toArray()));

  const { browser, page } = await launchWithMic(join(audioDir, 'nota-do.wav'), SETTINGS());
  try {
    await page.goto(`${BASE}/canciones`, { waitUntil: 'networkidle' });
    await page.locator('input[type="file"]').setInputFiles(midiPath);
    // Navega sola al detalle de la canción importada.
    await page.getByText('Importada por ti').waitFor({ timeout: 10000 });
    await page.getByRole('button', { name: /Frase 1/ }).waitFor({ timeout: 5000 });
    // Los tres modos disponibles también para partituras importadas.
    await page.getByRole('button', { name: /Corrido/ }).waitFor({ timeout: 3000 });
    await page.screenshot({ path: join(SHOTS, '6-importada.png') });
    // Y aparece en la lista bajo su categoría.
    await page.goto(`${BASE}/canciones`, { waitUntil: 'networkidle' });
    await page.getByText('Mis partituras importadas').waitFor({ timeout: 5000 });
  } finally {
    await browser.close();
  }
});

// 7) BOTÓN "ESCUCHAR": tras un gesto, el audio queda desbloqueado y el clic no falla.
await scenario('Botón «Escuchar»: el audio se desbloquea y reproduce sin errores', async () => {
  const { browser, page } = await launchWithMic(join(audioDir, 'nota-do.wav'), SETTINGS());
  try {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/canciones/oda-alegria`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Escuchar frase/ }).click();
    // El primer gesto debe dejar el contexto de audio en 'running'.
    await page.waitForFunction(
      async () => {
        const ctx = new AudioContext();
        const st = ctx.state;
        ctx.close();
        return st === 'running';
      },
      { timeout: 10000 }
    );
    // Reproduce de nuevo (contexto ya activo) y verifica que no hay errores JS.
    await page.getByRole('button', { name: /Escuchar todo/ }).click();
    await page.waitForTimeout(1500);
    if (errors.length) throw new Error('Errores al reproducir: ' + errors[0]);
  } finally {
    await browser.close();
  }
});

// ------------------------------------------------------------------
console.log('\n================ RESUMEN E2E ================');
for (const r of results) {
  console.log(`${r.ok ? '✅' : '❌'} ${r.name} (${r.secs}s)${r.err ? ' — ' + r.err : ''}`);
}
const failed = results.filter((r) => !r.ok).length;
console.log(failed === 0 ? '\nTODO FUNCIONA: el audio entró por el micrófono y la app validó las notas.' : `\n${failed} escenario(s) fallaron.`);
process.exit(failed === 0 ? 0 : 1);
