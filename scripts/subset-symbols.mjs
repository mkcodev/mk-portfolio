/**
 * Genera public/fonts/jbm-symbols.woff2: subset de JetBrains Mono con los
 * glifos box-drawing / bloques / flechas / checks que usa el sitio (ASCII art
 * del terminal, bento, 404). Sin este subset, esos caracteres no están en los
 * woff2 latin de fontsource y cada layout dispara un escaneo de fuentes del
 * sistema por glifo: ~200ms extra por pasada de layout (medido con tracing).
 *
 * Uso: descargar el TTF completo y ejecutar
 *   curl -sL -o /tmp/jbm-full.ttf https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/ttf/JetBrainsMono-Regular.ttf
 *   node scripts/subset-symbols.mjs /tmp/jbm-full.ttf
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import subsetFont from 'subset-font';

const input = process.argv[2];
if (!input) {
  console.error('uso: node scripts/subset-symbols.mjs <ruta-al-ttf-completo>');
  process.exit(1);
}

// U+2190–21FF flechas · U+2500–259F box drawing + bloques · U+2713–2717 checks
const ranges = [
  [0x2190, 0x21ff],
  [0x2500, 0x259f],
  [0x2713, 0x2717],
];
const text = ranges
  .map(([from, to]) =>
    Array.from({ length: to - from + 1 }, (_, i) => String.fromCodePoint(from + i)).join(''),
  )
  .join('');

const ttf = await readFile(input);
const woff2 = await subsetFont(ttf, text, { targetFormat: 'woff2' });
await mkdir('public/fonts', { recursive: true });
await writeFile('public/fonts/jbm-symbols.woff2', woff2);
console.log(`public/fonts/jbm-symbols.woff2 → ${woff2.length} bytes`);
