import { prefersReducedMotion } from './lifecycle';

const LERP = 0.1;
const FOLLOW = 0.55;

/** Glow del hero que persigue al cursor con lerp — solo transform, solo pointer fine. */
export function initHeroGlow(): (() => void) | void {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const glow = document.querySelector<HTMLElement>('[data-hero-glow]');
  if (!hero || !glow) return;
  if (prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return;

  let targetX = 0;
  let targetY = 0;
  let x = 0;
  let y = 0;
  let rafId = 0;
  let running = false;

  const onMove = (e: MouseEvent) => {
    const rect = hero.getBoundingClientRect();
    const baseX = rect.width / 2;
    const baseY = 160; // centro visual del glow en reposo (top -120px + radio)
    targetX = (e.clientX - rect.left - baseX) * FOLLOW;
    targetY = (e.clientY - rect.top - baseY) * FOLLOW;
    if (!running) {
      running = true;
      rafId = requestAnimationFrame(loop);
    }
  };

  const loop = () => {
    x += (targetX - x) * LERP;
    y += (targetY - y) * LERP;
    glow.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    rafId = requestAnimationFrame(loop);
  };

  hero.addEventListener('mousemove', onMove);

  return () => {
    hero.removeEventListener('mousemove', onMove);
    cancelAnimationFrame(rafId);
  };
}
