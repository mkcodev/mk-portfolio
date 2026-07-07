import { navigate } from 'astro:transitions/client';
import { lenis, scrollToTarget } from './scroll';

const SEQ_TIMEOUT = 900;
const SCROLL_STEP = 160;

/** Destinos de `g <tecla>` — anchors del home o páginas. */
const GO: Record<string, string> = {
  p: '#proyectos',
  w: '#como-trabajo',
  t: '#trayectoria',
  a: '#sobre-mi',
  c: '#contacto',
  u: '/uses',
  h: '/',
};

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable ||
    target.closest('[role="dialog"]') !== null
  );
}

function homePath(): string {
  const p = window.location.pathname;
  return p === '/en' || p.startsWith('/en/') ? '/en' : '/';
}

function goTo(dest: string): void {
  const home = homePath();
  if (dest.startsWith('#')) {
    const current = window.location.pathname.replace(/\/+$/, '') || '/';
    if (current === home) scrollToTarget(dest);
    else void navigate(home === '/' ? `/${dest}` : `${home}${dest}`);
    return;
  }
  void navigate(home === '/' ? dest : `/en${dest === '/' ? '' : dest}`);
}

function setOverlay(open: boolean): void {
  const overlay = document.querySelector<HTMLElement>('[data-shortcuts]');
  if (!overlay) return;
  overlay.hidden = !open;
  const active = document.activeElement;
  if (open) overlay.querySelector<HTMLElement>('[data-shortcuts-close]')?.focus();
  else if (active instanceof HTMLElement && overlay.contains(active)) active.blur();
}

/** Vim nav global: `g <x>` navega, `j`/`k` scroll, `?` overlay de atajos. */
export function initKeys(): () => void {
  let pendingG = false;
  let timer = 0;

  const clearSeq = () => {
    pendingG = false;
    window.clearTimeout(timer);
  };

  const onKeydown = (e: KeyboardEvent): void => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const overlay = document.querySelector<HTMLElement>('[data-shortcuts]');
    const overlayOpen = overlay !== null && !overlay.hidden;

    // Antes de isEditable: el foco vive dentro del dialog del overlay
    if (e.key === 'Escape' && overlayOpen) {
      setOverlay(false);
      return;
    }
    if (isEditable(e.target)) return;

    if (e.key === '?') {
      e.preventDefault();
      setOverlay(!overlayOpen);
      clearSeq();
      return;
    }
    if (overlayOpen) return;

    if (pendingG) {
      const dest = GO[e.key];
      clearSeq();
      if (dest) {
        e.preventDefault();
        goTo(dest);
      }
      return;
    }

    if (e.key === 'g') {
      pendingG = true;
      timer = window.setTimeout(clearSeq, SEQ_TIMEOUT);
      return;
    }
    if (e.key === 'j' || e.key === 'k') {
      const delta = e.key === 'j' ? SCROLL_STEP : -SCROLL_STEP;
      if (lenis) lenis.scrollTo(window.scrollY + delta, { duration: 0.35 });
      else window.scrollBy(0, delta);
    }
  };

  const onClick = (e: MouseEvent): void => {
    const target = e.target as Element;
    if (target.closest('[data-shortcuts-close]')) setOverlay(false);
    else if (target.closest('[data-shortcuts]') === document.querySelector('[data-shortcuts]')) {
      // click en el backdrop (no en el panel) cierra
      if (!target.closest('[data-shortcuts-panel]')) setOverlay(false);
    }
  };

  const onScrollTo = (e: Event): void => {
    const detail = (e as CustomEvent<string>).detail;
    if (typeof detail === 'string') scrollToTarget(detail);
  };

  document.addEventListener('keydown', onKeydown);
  document.addEventListener('click', onClick);
  window.addEventListener('mk:scrollto', onScrollTo);

  return () => {
    clearSeq();
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('click', onClick);
    window.removeEventListener('mk:scrollto', onScrollTo);
  };
}
