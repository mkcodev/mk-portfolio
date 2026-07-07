/**
 * Lifecycle de View Transitions — PATRÓN CENTRAL del sitio.
 *
 * Astro ClientRouter hace swap del DOM en cada navegación: cualquier script
 * global (Lenis, ScrollTrigger, cursor, navbar, vim nav) debe re-inicializarse
 * en `astro:page-load` y limpiarse en `astro:before-swap`. Sin esto, tras la
 * primera navegación las animaciones mueren o se duplican.
 *
 * Uso: cada módulo se registra UNA vez con `onPageLoad(init)` donde `init`
 * devuelve su función de cleanup (o nada si no necesita).
 */

type CleanupFn = () => void;
type InitFn = () => CleanupFn | void;

const inits: InitFn[] = [];
let cleanups: CleanupFn[] = [];
let started = false;

export function onPageLoad(init: InitFn): void {
  inits.push(init);
}

function runInits(): void {
  cleanups = inits.map((init) => init()).filter((c): c is CleanupFn => typeof c === 'function');
}

function runCleanups(): void {
  const pending = cleanups;
  cleanups = [];
  pending.forEach((cleanup) => cleanup());
}

/** Llamar una única vez desde el entry (app.ts). */
export function startLifecycle(): void {
  if (started) return;
  started = true;
  document.addEventListener('astro:page-load', runInits);
  document.addEventListener('astro:before-swap', runCleanups);
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
