const CHARS = ' .:-=+*#%@';
const CELL = 7;

function accentColor(): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim();
  return v || '#00dbd5';
}

function renderAscii(img: HTMLImageElement, canvas: HTMLCanvasElement): void {
  const rect = img.getBoundingClientRect();
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
  if (w === 0 || h === 0) return;
  const cols = Math.floor(w / CELL);
  const rows = Math.floor(h / (CELL * 1.6));

  const off = document.createElement('canvas');
  off.width = cols;
  off.height = rows;
  const octx = off.getContext('2d', { willReadFrequently: true });
  if (!octx) return;
  octx.drawImage(img, 0, 0, cols, rows);
  const data = octx.getImageData(0, 0, cols, rows).data;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.font = `${CELL + 1}px monospace`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = accentColor();

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const alpha = data[i + 3] ?? 0;
      if (alpha < 40) continue;
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      const ch = CHARS[Math.min(CHARS.length - 1, Math.floor(lum * CHARS.length))];
      if (!ch || ch === ' ') continue;
      ctx.globalAlpha = 0.3 + lum * 0.7;
      ctx.fillText(ch, x * CELL, y * CELL * 1.6);
    }
  }
}

/** Foto → ASCII precalculada en idle; el crossfade al hover es CSS puro. */
export function initAsciiPhoto(): (() => void) | void {
  const wrap = document.querySelector<HTMLElement>('[data-ascii]');
  const img = wrap?.querySelector('img');
  const canvas = wrap?.querySelector('canvas');
  if (!wrap || !img || !canvas) return;
  if (window.matchMedia('(hover: none)').matches) return;

  let idleId = 0;
  let built = false;
  const build = () => {
    if (built) return;
    built = true;
    renderAscii(img, canvas);
    wrap.classList.add('ascii-ready');
  };
  const schedule = () => {
    idleId =
      typeof requestIdleCallback === 'function'
        ? requestIdleCallback(build, { timeout: 2000 })
        : window.setTimeout(build, 400);
  };
  if (img.complete && img.naturalWidth > 0) schedule();
  else img.addEventListener('load', schedule, { once: true });

  return () => {
    if (typeof cancelIdleCallback === 'function') cancelIdleCallback(idleId);
    else window.clearTimeout(idleId);
  };
}
