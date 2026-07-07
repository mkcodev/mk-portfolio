const GAP = 28;
const RADIUS = 140;
const MAX_PUSH = 10;
const LERP = 0.12;
const GLYPHS = ['.', '·', ':', '+'];
const ACTIVE_GLYPH = '+';
const OFFSCREEN = -9999;

interface Cell {
  x: number;
  y: number;
  ox: number;
  oy: number;
  heat: number;
  glyph: string;
  phase: number;
}

function buildCells(width: number, height: number): Cell[] {
  const cells: Cell[] = [];
  for (let y = GAP; y < height; y += GAP) {
    for (let x = GAP; x < width; x += GAP) {
      cells.push({
        x,
        y,
        ox: x,
        oy: y,
        heat: 0,
        glyph: GLYPHS[(Math.random() * GLYPHS.length) | 0] ?? '.',
        phase: Math.random() * Math.PI * 2,
      });
    }
  }
  return cells;
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  cells: Cell[],
  mx: number,
  my: number,
  t: number,
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);
  for (const c of cells) {
    const dx = c.ox - mx;
    const dy = c.oy - my;
    const d = Math.hypot(dx, dy);
    let targetHeat = 0;
    let tx = c.ox;
    let ty = c.oy;
    if (d < RADIUS) {
      const f = (1 - d / RADIUS) ** 2; // falloff cuadrático
      targetHeat = f;
      tx = c.ox + (dx / (d || 1)) * MAX_PUSH * f;
      ty = c.oy + (dy / (d || 1)) * MAX_PUSH * f;
    }
    c.heat += (targetHeat - c.heat) * LERP;
    c.x += (tx - c.x) * LERP;
    c.y += (ty - c.y) * LERP;
    const idle = 0.35 + Math.sin(t / 640 + c.phase) * 0.08;
    const alpha = idle + (0.9 - idle) * c.heat;
    // ink-deep rgb(0 88 85) → accent rgb(0 219 213) según heat
    ctx.fillStyle =
      c.heat > 0.15
        ? `rgb(0 ${Math.round(88 + 131 * c.heat)} ${Math.round(85 + 128 * c.heat)} / ${alpha.toFixed(3)})`
        : `rgb(0 88 85 / ${alpha.toFixed(3)})`;
    ctx.fillText(c.heat > 0.5 ? ACTIVE_GLYPH : c.glyph, c.x, c.y);
  }
}

/** Campo de glifos ASCII del hero con repulsión al cursor — solo desktop (pointer fine). */
export function initHeroField(): (() => void) | void {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const canvas = document.querySelector<HTMLCanvasElement>('[data-hero-field]');
  if (!hero || !canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let cells: Cell[] = [];
  let logicalW = 0;
  let logicalH = 0;
  let mx = OFFSCREEN;
  let my = OFFSCREEN;
  let rafId = 0;
  let visible = false;

  const build = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = hero.getBoundingClientRect();
    logicalW = rect.width;
    logicalH = rect.height;
    canvas.width = Math.round(logicalW * dpr);
    canvas.height = Math.round(logicalH * dpr);
    canvas.style.width = `${logicalW}px`;
    canvas.style.height = `${logicalH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = '13px "JetBrains Mono Variable", "JetBrains Mono Fallback", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    cells = buildCells(logicalW, logicalH);
  };

  const frame = (t: number) => {
    drawFrame(ctx, cells, mx, my, t, logicalW, logicalH);
    rafId = requestAnimationFrame(frame);
  };

  const restart = () => {
    cancelAnimationFrame(rafId);
    if (visible && !document.hidden) rafId = requestAnimationFrame(frame);
  };

  const onMove = (e: MouseEvent) => {
    const rect = hero.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
  };
  const onLeave = () => {
    mx = OFFSCREEN;
    my = OFFSCREEN;
  };
  const onVisibility = () => restart();

  const io = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    restart();
  });

  build();
  hero.addEventListener('mousemove', onMove);
  hero.addEventListener('mouseleave', onLeave);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('resize', build);
  io.observe(hero);

  return () => {
    cancelAnimationFrame(rafId);
    io.disconnect();
    hero.removeEventListener('mousemove', onMove);
    hero.removeEventListener('mouseleave', onLeave);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('resize', build);
  };
}
