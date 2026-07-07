import { prefersReducedMotion } from './lifecycle';

const STRENGTH = 0.35;
const LERP = 0.18;

function attach(el: HTMLElement): () => void {
  let raf = 0;
  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;

  const tick = () => {
    cx += (tx - cx) * LERP;
    cy += (ty - cy) * LERP;
    el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
    if (Math.abs(cx - tx) > 0.1 || Math.abs(cy - ty) > 0.1) raf = requestAnimationFrame(tick);
    else raf = 0;
  };
  const start = () => {
    if (raf === 0) raf = requestAnimationFrame(tick);
  };
  const onMove = (e: MouseEvent) => {
    const r = el.getBoundingClientRect();
    tx = (e.clientX - (r.left + r.width / 2)) * STRENGTH;
    ty = (e.clientY - (r.top + r.height / 2)) * STRENGTH;
    start();
  };
  const onLeave = () => {
    tx = 0;
    ty = 0;
    start();
  };

  el.addEventListener('mousemove', onMove);
  el.addEventListener('mouseleave', onLeave);
  return () => {
    el.removeEventListener('mousemove', onMove);
    el.removeEventListener('mouseleave', onLeave);
    cancelAnimationFrame(raf);
    el.style.transform = '';
  };
}

/** Links magnéticos [data-magnetic] — solo pointer fine y sin reduced-motion. */
export function initMagnetic(): (() => void) | void {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (prefersReducedMotion()) return;
  const els = document.querySelectorAll<HTMLElement>('[data-magnetic]');
  if (els.length === 0) return;
  const cleanups = Array.from(els, attach);
  return () => cleanups.forEach((fn) => fn());
}
