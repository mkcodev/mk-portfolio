import { lenis } from './scroll';

const MAX_DEG = 3;
const GAIN = -0.05;
const LERP = 0.15;
const SETTLE = 0.002;

/**
 * Skew sutil del contenido proporcional a la velocidad del scroll.
 * Se aplica por sección (hijos de <main>) y NUNCA a la sección del timeline:
 * un transform en su ancestro rompería el position:fixed del pin de ScrollTrigger.
 */
export function initScrollSkew(): (() => void) | void {
  const main = document.getElementById('main-content');
  if (!main) return;
  const targets = [...main.children].filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && !el.matches('[data-timeline]') && !el.querySelector('[data-timeline]'),
  );
  if (targets.length === 0) return;
  for (const t of targets) t.style.transformOrigin = '50% 0';

  let current = 0;
  let dirty = false;
  let rafId = 0;

  const apply = (value: string, willChange: string) => {
    for (const t of targets) {
      t.style.transform = value;
      t.style.willChange = willChange;
    }
  };

  const frame = () => {
    const v = lenis?.velocity ?? 0;
    const target = Math.max(-MAX_DEG, Math.min(MAX_DEG, v * GAIN));
    current += (target - current) * LERP;
    if (Math.abs(current) < SETTLE && Math.abs(target) < SETTLE) {
      if (dirty) {
        apply('', '');
        dirty = false;
        current = 0;
      }
    } else {
      apply(`skewY(${current.toFixed(3)}deg)`, 'transform');
      dirty = true;
    }
    rafId = requestAnimationFrame(frame);
  };

  const restart = () => {
    cancelAnimationFrame(rafId);
    if (!document.hidden) rafId = requestAnimationFrame(frame);
  };

  restart();
  document.addEventListener('visibilitychange', restart);

  return () => {
    cancelAnimationFrame(rafId);
    document.removeEventListener('visibilitychange', restart);
    if (dirty) apply('', '');
    for (const t of targets) t.style.transformOrigin = '';
  };
}
