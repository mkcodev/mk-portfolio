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
let pageReady = false;
let runToken = 0;

export function onPageLoad(init: InitFn): void {
  inits.push(init);
}

/** Cada init corre en su propia tarea (yield entre módulos): trocea el
 *  trabajo en tareas <50ms y evita long tasks que disparan el TBT. */
async function runInits(): Promise<void> {
  const token = ++runToken;
  for (const init of inits) {
    if (token !== runToken) return; // hubo swap durante la secuencia
    const cleanup = init();
    if (typeof cleanup === 'function') cleanups.push(cleanup);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

function handlePageLoad(): void {
  if (pageReady) return;
  pageReady = true;
  void runInits();
}

function handleBeforeSwap(): void {
  pageReady = false;
  runToken += 1; // cancela cualquier secuencia de inits en curso
  const pending = cleanups;
  cleanups = [];
  pending.forEach((cleanup) => cleanup());
}

/** Llamar una única vez desde el entry. El entry difiere la carga a idle
 *  (post-load), así que el astro:page-load inicial ya pasó: se compensa
 *  ejecutando los inits de inmediato si el documento ya está cargado. */
export function startLifecycle(): void {
  if (started) return;
  started = true;
  document.addEventListener('astro:page-load', handlePageLoad);
  document.addEventListener('astro:before-swap', handleBeforeSwap);
  if (document.readyState !== 'loading') handlePageLoad();
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
