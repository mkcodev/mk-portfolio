import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './lifecycle';

gsap.registerPlugin(ScrollTrigger);

const TOGGLE = 'play reverse play reverse';

/**
 * Reveals genéricos por scroll — cada sección solo necesita data-attributes:
 * - `data-animate="section-heading"` (SectionHeading): marker primero, título después.
 * - `data-reveal-group` + hijos `data-reveal`: fade+y con stagger 0.08.
 * Los estados iniciales se fijan desde JS: sin JS el contenido es visible.
 */
export function initReveals(): (() => void) | void {
  if (prefersReducedMotion()) return;

  const ctx = gsap.context(() => {
    document.querySelectorAll<HTMLElement>('[data-animate="section-heading"]').forEach((el) => {
      const marker = el.querySelector('[data-animate-marker]');
      const title = el.querySelector('[data-animate-title]');
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: TOGGLE },
      });
      if (marker) tl.fromTo(marker, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'none' });
      if (title) {
        tl.fromTo(
          title,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
          '-=0.15',
        );
      }
    });

    document.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
      const items = group.querySelectorAll('[data-reveal]');
      if (items.length === 0) return;
      gsap.fromTo(
        items,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: group, start: 'top 82%', toggleActions: TOGGLE },
          // El transform inline residual pisa los :hover CSS (lift de las cards)
          onComplete: () => gsap.set(items, { clearProps: 'transform' }),
        },
      );
    });
  });

  return () => ctx.revert();
}
