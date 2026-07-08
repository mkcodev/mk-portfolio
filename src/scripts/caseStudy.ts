import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const VALUE_REGEX = /^(\d+(?:[.,]\d+)?)(.*)$/;

function initCounters(body: HTMLElement): void {
  const nodes = body.querySelectorAll<HTMLElement>('[data-cs-metric-value]:not([data-cs-pending])');
  for (const node of nodes) {
    const raw = (node.textContent ?? '').trim();
    const match = VALUE_REGEX.exec(raw);
    if (!match) continue;
    const [, numStr, suffix = ''] = match;
    if (numStr === undefined) continue;
    const target = Number(numStr.replace(',', '.'));
    if (!Number.isFinite(target)) continue;
    const decimals = numStr.includes('.') ? (numStr.split('.')[1]?.length ?? 0) : 0;
    const counter = { v: 0 };
    node.textContent = `0${decimals > 0 ? '.'.padEnd(decimals + 1, '0') : ''}${suffix}`;
    gsap.fromTo(
      counter,
      { v: 0 },
      {
        v: target,
        duration: 1.4,
        ease: 'power2.out',
        scrollTrigger: { trigger: node, start: 'top 82%', once: true },
        onUpdate: () => {
          const shown = decimals > 0 ? counter.v.toFixed(decimals) : String(Math.round(counter.v));
          node.textContent = `${shown}${suffix}`;
        },
      },
    );
  }
}

function initSteps(body: HTMLElement): void {
  const steps = body.querySelectorAll<HTMLElement>('[data-cs-step]');
  for (const step of steps) {
    ScrollTrigger.create({
      trigger: step,
      start: 'top 75%',
      end: 'bottom 25%',
      toggleClass: { targets: step, className: 'is-active' },
    });
  }
}

function initLine(body: HTMLElement): void {
  const line = body.querySelector<SVGPathElement>('[data-cs-line]');
  if (!line) return;
  gsap.fromTo(
    line,
    { strokeDashoffset: 1 },
    {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: body,
        start: 'top 65%',
        end: 'bottom 85%',
        scrub: 0.8,
      },
    },
  );
}

/**
 * Case study cinemático: SVG line dibujado con scrub, nodos ◇ que se activan
 * por sección al entrar en viewport, y contadores GSAP en las métricas.
 * Métricas `[data-cs-pending]` no corren counter (renderizadas con punto pulsante).
 */
export function initCaseStudy(): (() => void) | void {
  const body = document.querySelector<HTMLElement>('[data-cs-body]');
  if (!body) return;

  const ctx = gsap.context(() => {
    initLine(body);
    initSteps(body);
    initCounters(body);
  }, body);

  return () => ctx.revert();
}
