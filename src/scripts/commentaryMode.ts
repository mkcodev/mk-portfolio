import type { Annotation, CommentaryAnchor } from '../data/commentary';
import { commentary } from '../data/commentary';

const STORAGE_KEY = 'mk:commentary';
const TOGGLE_EVENT = 'mk:commentary-toggle';
const MARKER_SIZE = 22;
const MARKER_INSET = 12;

type MarkerRecord = {
  el: HTMLElement;
  tip: HTMLElement;
  target: HTMLElement;
  anchor: CommentaryAnchor;
  pinToViewport: boolean;
};

function readStorage(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeStorage(value: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    /* privado o cuota — ignorar */
  }
}

function resolveTarget(selector: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(selector);
}

function buildMarker(entry: Annotation, idx: number): HTMLElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'cm-marker';
  btn.dataset['cmIdx'] = String(idx);
  btn.textContent = '?';
  btn.setAttribute('aria-label', `Explicación técnica: ${entry.name}`);
  btn.setAttribute('aria-describedby', `cm-tip-${idx}`);
  return btn;
}

function buildTooltip(entry: Annotation, idx: number): HTMLElement {
  const tip = document.createElement('div');
  tip.className = 'cm-tooltip';
  tip.id = `cm-tip-${idx}`;
  tip.setAttribute('role', 'tooltip');

  const title = document.createElement('h4');
  title.className = 'cm-tip-title';
  title.textContent = entry.name;
  tip.appendChild(title);

  const desc = document.createElement('p');
  desc.className = 'cm-tip-desc';
  desc.textContent = entry.desc;
  tip.appendChild(desc);

  const libs = document.createElement('ul');
  libs.className = 'cm-tip-libs';
  libs.setAttribute('role', 'list');
  for (const lib of entry.libs) {
    const li = document.createElement('li');
    li.textContent = lib;
    libs.appendChild(li);
  }
  tip.appendChild(libs);

  const file = document.createElement('p');
  file.className = 'cm-tip-file';
  file.textContent = entry.file;
  tip.appendChild(file);

  return tip;
}

function placeMarker(rec: MarkerRecord): void {
  const vh = window.innerHeight;
  const vw = window.innerWidth;

  if (rec.pinToViewport) {
    // Efectos globales: marker anclado a una esquina del viewport si el target existe.
    const rect = rec.target.getBoundingClientRect();
    const onScreen = rect.bottom > 0 && rect.top < vh && rect.right > 0 && rect.left < vw;
    if (!onScreen && rec.target.tagName !== 'MAIN') {
      rec.el.style.opacity = '0';
      rec.el.style.pointerEvents = 'none';
      return;
    }
    rec.el.style.opacity = '';
    rec.el.style.pointerEvents = '';
    const off = 16;
    let x = vw - MARKER_SIZE - off;
    let y = off;
    if (rec.anchor === 'tl') x = off;
    else if (rec.anchor === 'bl') {
      x = off;
      y = vh - MARKER_SIZE - off;
    } else if (rec.anchor === 'br') {
      y = vh - MARKER_SIZE - off;
    }
    rec.el.style.left = `${Math.round(x)}px`;
    rec.el.style.top = `${Math.round(y)}px`;
    return;
  }

  const rect = rec.target.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    rec.el.style.display = 'none';
    rec.tip.style.display = 'none';
    return;
  }
  rec.el.style.display = '';
  rec.tip.style.display = '';

  let x = rect.right - MARKER_SIZE - MARKER_INSET;
  let y = rect.top + MARKER_INSET;
  if (rec.anchor === 'tl') {
    x = rect.left + MARKER_INSET;
  } else if (rec.anchor === 'bl') {
    x = rect.left + MARKER_INSET;
    y = rect.bottom - MARKER_SIZE - MARKER_INSET;
  } else if (rec.anchor === 'br') {
    y = rect.bottom - MARKER_SIZE - MARKER_INSET;
  }

  if (rect.bottom < 0 || rect.top > vh || rect.right < 0 || rect.left > vw) {
    rec.el.style.opacity = '0';
    rec.el.style.pointerEvents = 'none';
  } else {
    rec.el.style.opacity = '';
    rec.el.style.pointerEvents = '';
  }

  rec.el.style.left = `${Math.round(x)}px`;
  rec.el.style.top = `${Math.round(y)}px`;
}

function placeTooltip(rec: MarkerRecord): void {
  const markerRect = rec.el.getBoundingClientRect();
  const tipRect = rec.tip.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Por defecto: bajo el marker, alineado a su borde derecho
  let x = markerRect.right - tipRect.width;
  let y = markerRect.bottom + 8;
  // Si se sale por la derecha, empujar a la izquierda
  if (x < 12) x = 12;
  if (x + tipRect.width > vw - 12) x = vw - tipRect.width - 12;
  // Si se sale por abajo, mostrar sobre el marker
  if (y + tipRect.height > vh - 12) y = markerRect.top - tipRect.height - 8;
  if (y < 12) y = 12;

  rec.tip.style.left = `${Math.round(x)}px`;
  rec.tip.style.top = `${Math.round(y)}px`;
}

export function initCommentaryMode(): (() => void) | void {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const records: MarkerRecord[] = [];
  let on = readStorage();
  let rafId = 0;
  let scheduled = false;
  let activeIdx = -1;

  const scheduleLayout = () => {
    if (scheduled) return;
    scheduled = true;
    rafId = requestAnimationFrame(() => {
      scheduled = false;
      for (const rec of records) placeMarker(rec);
      if (activeIdx >= 0 && records[activeIdx]) placeTooltip(records[activeIdx]);
    });
  };

  const applyState = () => {
    document.body.dataset['commentary'] = on ? 'on' : 'off';
    if (on) scheduleLayout();
  };

  const showTooltip = (idx: number) => {
    const rec = records[idx];
    if (!rec) return;
    if (activeIdx >= 0 && activeIdx !== idx) {
      const prev = records[activeIdx];
      if (prev) prev.tip.dataset['visible'] = 'off';
    }
    activeIdx = idx;
    rec.tip.dataset['visible'] = 'on';
    placeTooltip(rec);
  };

  const hideTooltip = (idx: number) => {
    const rec = records[idx];
    if (!rec) return;
    rec.tip.dataset['visible'] = 'off';
    if (activeIdx === idx) activeIdx = -1;
  };

  const build = () => {
    for (const [idx, entry] of commentary.entries()) {
      const target = resolveTarget(entry.selector);
      if (!target) continue;
      const marker = buildMarker(entry, idx);
      const tip = buildTooltip(entry, idx);
      document.body.appendChild(marker);
      document.body.appendChild(tip);
      const rec: MarkerRecord = {
        el: marker,
        tip,
        target,
        anchor: entry.anchor,
        pinToViewport: entry.pinToViewport ?? false,
      };
      records.push(rec);
      marker.addEventListener('mouseenter', () => showTooltip(idx));
      marker.addEventListener('focus', () => showTooltip(idx));
      marker.addEventListener('mouseleave', () => hideTooltip(idx));
      marker.addEventListener('blur', () => hideTooltip(idx));
    }
  };

  const onToggle = () => {
    on = !on;
    writeStorage(on);
    applyState();
    document.dispatchEvent(new CustomEvent('mk:commentary-state', { detail: on }));
  };

  build();
  applyState();

  window.addEventListener(TOGGLE_EVENT, onToggle);
  window.addEventListener('scroll', scheduleLayout, { passive: true });
  window.addEventListener('resize', scheduleLayout);

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener(TOGGLE_EVENT, onToggle);
    window.removeEventListener('scroll', scheduleLayout);
    window.removeEventListener('resize', scheduleLayout);
    for (const rec of records) {
      rec.el.remove();
      rec.tip.remove();
    }
    records.length = 0;
    delete document.body.dataset['commentary'];
  };
}
