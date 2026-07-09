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
 * Entrada del case study: browser frame sube desde y:32 con opacity 0 y
 * los chips del stack entran con stagger tras el título. Se dispara al
 * cargar (post astro:page-load) porque el frame ya está en viewport.
 */
function initEntrance(): void {
  const frame = document.querySelector<HTMLElement>('.cs-media');
  const stack = document.querySelector<HTMLElement>('.cs-meta-stack');
  const links = document.querySelector<HTMLElement>('.cs-links');

  if (frame) {
    gsap.fromTo(
      frame,
      { y: 32, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.15 },
    );
  }
  if (stack) {
    // Cortamos el stack por " · " para animar cada chip como span.
    const parts = (stack.textContent ?? '').split(' · ');
    if (parts.length > 1) {
      stack.innerHTML = parts
        .map(
          (p, i) =>
            `<span class="cs-chip" style="opacity:0">${p}</span>${i < parts.length - 1 ? '<span class="cs-chip-sep"> · </span>' : ''}`,
        )
        .join('');
      gsap.to(stack.querySelectorAll('.cs-chip'), {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'power3.out',
        stagger: 0.05,
        delay: 0.5,
      });
    }
  }
  if (links) {
    gsap.fromTo(
      links.children,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.08, delay: 0.35 },
    );
  }
}

/**
 * Parallax 3D del browser frame: rotateY/rotateX según posición del cursor
 * dentro del frame, con lerp 0.1 en rAF. Se aplica `perspective` al padre
 * (.cs) y se transforma el frame. Solo pointer fine.
 * Devuelve cleanup — el consumidor lo agrupa con los demás.
 */
function initFrameParallax(frame: HTMLElement): () => void {
  if (!window.matchMedia('(pointer: fine)').matches) return () => {};
  const parent = frame.closest<HTMLElement>('.cs') ?? frame.parentElement;
  if (!parent) return () => {};
  parent.style.perspective = '1200px';
  frame.style.transformStyle = 'preserve-3d';
  frame.style.willChange = 'transform';

  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;
  let rafId = 0;

  const onMove = (e: MouseEvent): void => {
    const r = frame.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2; // -1..1
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
    tx = Math.max(-1, Math.min(1, nx));
    ty = Math.max(-1, Math.min(1, ny));
  };
  const onLeave = (): void => {
    tx = 0;
    ty = 0;
  };
  const loop = (): void => {
    cx += (tx - cx) * 0.1;
    cy += (ty - cy) * 0.1;
    const rotY = cx * 5;
    const rotX = -cy * 5;
    frame.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    rafId = requestAnimationFrame(loop);
  };
  frame.addEventListener('mousemove', onMove);
  frame.addEventListener('mouseleave', onLeave);
  rafId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(rafId);
    frame.removeEventListener('mousemove', onMove);
    frame.removeEventListener('mouseleave', onLeave);
    frame.style.transform = '';
    frame.style.willChange = '';
    parent.style.perspective = '';
  };
}

/**
 * Case study cinemático: SVG line dibujado con scrub, nodos ◇ que se activan
 * por sección al entrar en viewport, y contadores GSAP en las métricas.
 * Métricas `[data-cs-pending]` no corren counter (renderizadas con punto pulsante).
 */
export function initCaseStudy(): (() => void) | void {
  const body = document.querySelector<HTMLElement>('[data-cs-body]');
  const frame = document.querySelector<HTMLElement>('.cs-media');
  // Sin ninguno de los dos, no hay case study en esta página.
  if (!body && !frame) return;

  let cleanupParallax: () => void = () => {};
  const ctx = gsap.context(() => {
    initEntrance();
    if (body) {
      initLine(body);
      initSteps(body);
      initCounters(body);
    }
    if (frame) {
      cleanupParallax = initFrameParallax(frame);
    }
  }, document.body);

  return () => {
    cleanupParallax();
    ctx.revert();
  };
}
