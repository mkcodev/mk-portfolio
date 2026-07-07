import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TOGGLE = 'play reverse play reverse';

function buildScrub(wrap: HTMLElement): void {
  const line = wrap.querySelector('[data-tl-line]');
  const rows = wrap.querySelectorAll<HTMLElement>('[data-tl-row]');
  if (!line || rows.length === 0) return;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: wrap,
      start: 'top top',
      end: '+=170%',
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

function buildMobile(wrap: HTMLElement): void {
  const line = wrap.querySelector('[data-tl-line]');
  const rows = wrap.querySelectorAll('[data-tl-row]');
  if (rows.length === 0) return;

  if (line) {
    gsap.fromTo(
      line,
      { scaleY: 0, transformOrigin: 'top center' },
      {
        scaleY: 1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: wrap, start: 'top 80%', toggleActions: TOGGLE },
      },
    );
  }
  gsap.fromTo(
    rows,
    { opacity: 0, x: -16 },
    {
      opacity: 1,
      x: 0,
      duration: 0.6,
      ease: 'power3.out',
      stagger: 0.09,
      scrollTrigger: { trigger: wrap, start: 'top 80%', toggleActions: TOGGLE },
    },
  );
}

/** git log 2019→2026 — pin+scrub SOLO ≥768px; mobile: lista vertical con stagger. */
export function initTimeline(): (() => void) | void {
  const wrap = document.querySelector<HTMLElement>('[data-timeline]');
  if (!wrap) return;

  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => buildScrub(wrap));
  mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => buildMobile(wrap));
  return () => mm.revert();
}
