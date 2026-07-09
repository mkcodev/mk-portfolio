import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type CinemaOpts = {
  parallaxRange: number;
  copyLagX: number;
  copyLagOpacity: number;
  scrub: number;
};

function buildCinema(cinema: HTMLElement, opts: CinemaOpts): void {
  const track = cinema.querySelector<HTMLElement>('[data-proj-track]');
  if (!track) return;
  const chapters = track.querySelectorAll<HTMLElement>('[data-proj-chapter]');
  if (chapters.length < 2) return;

  const distance = () => track.scrollWidth - cinema.clientWidth;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: cinema,
      start: 'top top',
      end: () => `+=${distance()}`,
      pin: true,
      scrub: opts.scrub,
      invalidateOnRefresh: true,
    },
  });

  tl.to(track, { x: () => -distance(), ease: 'none', duration: 1 }, 0);

  const progress = cinema.querySelector('[data-cin-progress]');
  if (progress) {
    tl.fromTo(progress, { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 1 }, 0);
  }

  // Deriva horizontal sutil de las imágenes contra el movimiento del track.
  // Desktop: img 110% + margin -5%, parallaxRange 4. Móvil: 106% + -3%, parallaxRange 2.
  const imgs = track.querySelectorAll<HTMLElement>('[data-cin-img]');
  if (imgs.length > 0) {
    tl.fromTo(
      imgs,
      { xPercent: -opts.parallaxRange },
      { xPercent: opts.parallaxRange, ease: 'none', duration: 1 },
      0,
    );
  }

  // La copy de los capítulos siguientes entra con lag respecto al track.
  chapters.forEach((chapter, i) => {
    if (i === 0) return;
    const copy = chapter.querySelector<HTMLElement>('[data-cin-copy]');
    if (!copy) return;
    const at = ((i - 0.55) / (chapters.length - 1)) * 1;
    tl.fromTo(
      copy,
      { xPercent: opts.copyLagX, opacity: opts.copyLagOpacity },
      { xPercent: 0, opacity: 1, ease: 'none', duration: 0.45 },
      Math.max(0, at),
    );
  });
}

function buildTabletReveal(cinema: HTMLElement): void {
  const chapters = cinema.querySelectorAll<HTMLElement>('[data-proj-chapter]');
  if (chapters.length === 0) return;
  chapters.forEach((chapter) => {
    gsap.fromTo(
      chapter,
      { opacity: 0, y: 32 },
      {
        opacity: 1,
        y: 0,
        duration: 0.75,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: chapter,
          start: 'top 85%',
          toggleActions: 'play reverse play reverse',
        },
        onComplete: () => gsap.set(chapter, { clearProps: 'transform' }),
      },
    );
  });
}

/**
 * Flagships:
 * - ≥1024px: cinema horizontal pinneado con GSAP, parallax ±4, scrub 1.2.
 * - 768-1023px (tablet): chapters apilados con reveal fade+y por scroll.
 * - <768px (móvil): mismo cinema pinneado con parámetros atenuados (parallax ±2, scrub 0.6).
 *   Lenis convierte el swipe vertical en scrollTop → ScrollTrigger lo traduce a x del track.
 */
export function initProjectsCinema(): (() => void) | void {
  const cinema = document.querySelector<HTMLElement>('[data-proj-cinema]');
  if (!cinema) return;

  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px)', () =>
    buildCinema(cinema, { parallaxRange: 4, copyLagX: 10, copyLagOpacity: 0.2, scrub: 1.2 }),
  );
  mm.add('(min-width: 768px) and (max-width: 1023px)', () => buildTabletReveal(cinema));
  mm.add('(max-width: 767px)', () =>
    buildCinema(cinema, { parallaxRange: 2, copyLagX: 6, copyLagOpacity: 0.4, scrub: 0.6 }),
  );
  return () => mm.revert();
}
