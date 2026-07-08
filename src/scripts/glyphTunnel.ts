import { lenis } from './scroll';

const ROW = 22;
const GLYPHS = ['.', '·', ':', '+', '─', '╌', '>', '│'];
const BASE_FLOW = 0.6;
const V_FACTOR = 0.35;
const V_HOT = 35; // |velocity| a partir del cual el flujo "se enciende" en acento
const V_ALPHA_RANGE = 40;

interface Column {
  x: number;
  speed: number;
  offset: number;
  glyphs: string[];
  alphas: number[];
}

interface Tunnel {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  cols: Column[];
}

const randGlyph = (): string => GLYPHS[(Math.random() * GLYPHS.length) | 0] ?? '.';
const randAlpha = (): number => 0.6 + Math.random() * 0.4;

function buildTunnel(canvas: HTMLCanvasElement): Tunnel | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = '13px "JetBrains Mono Variable", "JetBrains Mono Fallback", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const nCols = Math.max(1, Math.floor(rect.width / 26));
  const rows = Math.ceil(rect.height / ROW) + 2;
  const cols: Column[] = [];
  for (let c = 0; c < nCols; c++) {
    cols.push({
      x: (rect.width / (nCols + 1)) * (c + 1),
      speed: 0.75 + Math.random() * 0.5,
      offset: Math.random() * ROW,
      glyphs: Array.from({ length: rows }, randGlyph),
      alphas: Array.from({ length: rows }, randAlpha),
    });
  }
  return { canvas, ctx, w: rect.width, h: rect.height, cols };
}

function stepColumn(col: Column, flow: number): void {
  col.offset += flow * col.speed;
  while (col.offset >= ROW) {
    col.offset -= ROW;
    col.glyphs.pop();
    col.glyphs.unshift(randGlyph());
    col.alphas.pop();
    col.alphas.unshift(randAlpha());
  }
  while (col.offset <= -ROW) {
    col.offset += ROW;
    col.glyphs.shift();
    col.glyphs.push(randGlyph());
    col.alphas.shift();
    col.alphas.push(randAlpha());
  }
}

function drawTunnel(t: Tunnel, vs: number): void {
  const flow = BASE_FLOW + vs * V_FACTOR;
  const k = Math.min(Math.abs(vs) / V_ALPHA_RANGE, 1);
  const baseAlpha = 0.28 + 0.27 * k;
  const hot = Math.abs(vs) > V_HOT;
  const hotZoneStart = vs >= 0 ? t.h * 0.7 : 0;
  const hotZoneEnd = vs >= 0 ? t.h : t.h * 0.3;
  t.ctx.clearRect(0, 0, t.w, t.h);
  for (const col of t.cols) {
    stepColumn(col, flow);
    for (let i = 0; i < col.glyphs.length; i++) {
      const y = i * ROW - ROW + col.offset;
      if (y < -ROW || y > t.h + ROW) continue;
      const a = (col.alphas[i] ?? 1) * baseAlpha;
      t.ctx.fillStyle =
        hot && y >= hotZoneStart && y <= hotZoneEnd
          ? `rgb(0 219 213 / ${(0.65 * (col.alphas[i] ?? 1)).toFixed(3)})`
          : `rgb(0 88 85 / ${a.toFixed(3)})`;
      t.ctx.fillText(col.glyphs[i] ?? '.', col.x, y);
    }
  }
}

/** Columnas laterales de glifos que fluyen a la velocidad del scroll (Lenis). */
export function initGlyphTunnel(): (() => void) | void {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const canvases = [...document.querySelectorAll<HTMLCanvasElement>('[data-glyph-tunnel]')];
  if (canvases.length === 0) return;

  let tunnels: Tunnel[] = [];
  let vs = 0;
  let rafId = 0;

  const build = () => {
    tunnels = canvases
      .map(buildTunnel)
      .filter((t): t is Tunnel => t !== null);
  };

  const frame = () => {
    // Consulta perezosa: lenis puede ser null durante swaps de View Transitions
    const v = lenis?.velocity ?? 0;
    vs += (v - vs) * 0.12;
    for (const t of tunnels) drawTunnel(t, vs);
    rafId = requestAnimationFrame(frame);
  };

  const restart = () => {
    cancelAnimationFrame(rafId);
    if (!document.hidden) rafId = requestAnimationFrame(frame);
  };

  build();
  restart();
  document.addEventListener('visibilitychange', restart);
  window.addEventListener('resize', build);

  return () => {
    cancelAnimationFrame(rafId);
    document.removeEventListener('visibilitychange', restart);
    window.removeEventListener('resize', build);
  };
}
