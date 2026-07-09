import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function buildScrub(wrap: HTMLElement, opts: { end: string }): void {
  const line = wrap.querySelector('[data-tl-line]');
  const rows = wrap.querySelectorAll<HTMLElement>('[data-tl-row]');
  if (!line || rows.length === 0) return;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: wrap,
      start: 'top top',
      end: opts.end,
      pin: true,
      scrub: 0.8,
      invalidateOnRefresh: true,
    },
  });
  tl.fromTo(
    line,
    { scaleY: 0, transformOrigin: 'top center' },
    { scaleY: 1, duration: 1, ease: 'none' },
    0,
  );
  rows.forEach((row, i) => {
    const at = (i / rows.length) * 0.92;
    const dot = row.querySelector('[data-tl-dot]');
    const text = row.querySelector('[data-tl-text]');
    if (dot) tl.fromTo(dot, { scale: 0 }, { scale: 1, duration: 0.05, ease: 'back.out(2)' }, at);
    if (text) {
      tl.fromTo(
        text,
        { opacity: 0, x: 24 },
        { opacity: 1, x: 0, duration: 0.1, ease: 'power2.out' },
        at,
      );
    }
  });
}

/** git log 2019→2026 — pin+scrub en todos los breakpoints. Móvil usa end más corto. */
export function initTimeline(): (() => void) | void {
  const wrap = document.querySelector<HTMLElement>('[data-timeline]');
  if (!wrap) return;

  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => buildScrub(wrap, { end: '+=170%' }));
  mm.add('(max-width: 767px)', () => buildScrub(wrap, { end: '+=140%' }));
  return () => mm.revert();
}
