const POOL_SIZE = 20;
const EMIT_MS = 55;
const GLYPHS = ['.', '·', '+'];
const OFFSET_X = 10;
const OFFSET_Y = 14;

/** Estela de glifos mono que el cursor deja al moverse — solo pointer fine. */
export function initCursorTrail(): (() => void) | void {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const wrap = document.createElement('div');
  wrap.dataset['cursorTrail'] = '';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9998;overflow:hidden;';

  const pool: HTMLSpanElement[] = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const s = document.createElement('span');
    s.style.cssText =
      'position:absolute;left:0;top:0;font:12px var(--font-mono);' +
      'color:var(--color-accent);opacity:0;will-change:transform,opacity;';
    wrap.appendChild(s);
    pool.push(s);
  }
  document.body.appendChild(wrap);

  let last = 0;
  let idx = 0;

  const onMove = (e: PointerEvent) => {
    const now = performance.now();
    if (now - last < EMIT_MS) return;
    last = now;
    const s = pool[idx];
    idx = (idx + 1) % POOL_SIZE;
    if (!s) return;
    const x = e.clientX + OFFSET_X;
    const y = e.clientY + OFFSET_Y;
    s.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0] ?? '.';
    s.style.transition = 'none';
    s.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1)`;
    s.style.opacity = '0.4';
    // Doble rAF: garantiza que el estado inicial se pinta antes de transicionar
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        s.style.transition = 'opacity 500ms ease-out, transform 500ms ease-out';
        s.style.opacity = '0';
        s.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.4)`;
      });
    });
  };

  window.addEventListener('pointermove', onMove, { passive: true });

  return () => {
    window.removeEventListener('pointermove', onMove);
    wrap.remove();
  };
}
