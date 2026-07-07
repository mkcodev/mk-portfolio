import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './lifecycle';

gsap.registerPlugin(ScrollTrigger);

const TOGGLE = 'play reverse play reverse';

type Cleanup = () => void;

interface LoopApi {
  alive: () => boolean;
  visible: () => boolean;
  sleep: (ms: number) => Promise<void>;
}

function observeVisibility(el: Element): { visible: () => boolean; stop: Cleanup } {
  let vis = false;
  const io = new IntersectionObserver(
    (entries) => {
      vis = entries.some((e) => e.isIntersecting);
    },
    { threshold: 0.25 },
  );
  io.observe(el);
  return { visible: () => vis, stop: () => io.disconnect() };
}

/** Bucle de demo que solo corre cuando la celda es visible y se cancela en cleanup. */
function createLoop(el: Element, body: (api: LoopApi) => Promise<void>): Cleanup {
  let alive = true;
  let timer: number | undefined;
  const { visible, stop } = observeVisibility(el);
  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      timer = window.setTimeout(resolve, ms);
    });
  const api: LoopApi = { alive: () => alive, visible, sleep };
  void (async () => {
    while (alive) {
      if (!visible()) {
        await sleep(250);
        continue;
      }
      await body(api);
    }
  })();
  return () => {
    alive = false;
    stop();
    if (timer !== undefined) window.clearTimeout(timer);
  };
}

/* -------- Celda 1: terminal en bucle -------- */
const TERM_SCRIPT: ReadonlyArray<{ cmd: string; out: string }> = [
  { cmd: 'pnpm build', out: '✓ 24 pages · 1.4s' },
  { cmd: 'pnpm check', out: '0 errors · 0 warnings' },
  { cmd: 'git commit -m "feat: ship"', out: '[main 4f2a1c9] feat: ship' },
  { cmd: 'vercel --prod', out: '✓ mkcodev.vercel.app' },
];

function initTermLoop(grid: HTMLElement): Cleanup {
  const out = grid.querySelector<HTMLElement>('[data-term-out]');
  if (!out) return () => {};
  return createLoop(out, async ({ alive, visible, sleep }) => {
    out.replaceChildren();
    for (const block of TERM_SCRIPT) {
      if (!alive() || !visible()) return;
      const line = document.createElement('div');
      const prompt = document.createElement('span');
      prompt.className = 'bt-prompt';
      prompt.textContent = '$ ';
      const cmd = document.createElement('span');
      line.append(prompt, cmd);
      out.append(line);
      for (const ch of block.cmd) {
        cmd.textContent += ch;
        await sleep(34);
        if (!alive()) return;
      }
      await sleep(260);
      const res = document.createElement('div');
      res.className = 'bt-out';
      res.textContent = block.out;
      out.append(res);
      await sleep(700);
    }
    await sleep(2400);
  });
}

/* -------- Celda 2: gauge Lighthouse → 100 -------- */
function initGauge(grid: HTMLElement): void {
  const cell = grid.querySelector<HTMLElement>('[data-demo="gauge"]');
  const arc = cell?.querySelector('[data-gauge-arc]');
  const num = cell?.querySelector<HTMLElement>('[data-gauge-num]');
  if (!cell || !arc || !num) return;
  const counter = { v: 0 };
  const tl = gsap.timeline({
    scrollTrigger: { trigger: cell, start: 'top 80%', toggleActions: TOGGLE },
  });
  tl.fromTo(
    arc,
    { strokeDashoffset: 100 },
    { strokeDashoffset: 0, duration: 1.6, ease: 'power3.out' },
  );
  tl.fromTo(
    counter,
    { v: 0 },
    {
      v: 100,
      duration: 1.6,
      ease: 'power3.out',
      onUpdate: () => {
        num.textContent = String(Math.round(counter.v));
      },
    },
    0,
  );
}

/* -------- Celda 3: keycaps h j k l (loop + teclas reales) -------- */
function initKeysDemo(grid: HTMLElement): Cleanup {
  const cell = grid.querySelector<HTMLElement>('[data-demo="keys"]');
  if (!cell) return () => {};
  const keys = new Map<string, HTMLElement>();
  cell.querySelectorAll<HTMLElement>('[data-key]').forEach((k) => {
    const name = k.dataset.key;
    if (name) keys.set(name, k);
  });
  const flash = (name: string, ms: number) => {
    const el = keys.get(name);
    if (!el) return;
    el.classList.add('is-pressed');
    window.setTimeout(() => el.classList.remove('is-pressed'), ms);
  };
  const stopLoop = createLoop(cell, async ({ alive, visible, sleep }) => {
    for (const k of ['j', 'k', 'h', 'l']) {
      flash(k, 320);
      await sleep(560);
      if (!alive() || !visible()) return;
    }
    await sleep(1100);
  });
  const onKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = e.target instanceof HTMLElement ? e.target.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (keys.has(e.key)) flash(e.key, 200);
  };
  document.addEventListener('keydown', onKey);
  return () => {
    stopLoop();
    document.removeEventListener('keydown', onKey);
  };
}

/* -------- Celda 4: git graph dibujándose -------- */
function initGitGraph(grid: HTMLElement): void {
  const cell = grid.querySelector<HTMLElement>('[data-demo="git"]');
  if (!cell) return;
  const paths = cell.querySelectorAll('[data-git-path]');
  const dots = cell.querySelectorAll('[data-git-dot]');
  const labels = cell.querySelectorAll('[data-git-label]');
  const tl = gsap.timeline({
    scrollTrigger: { trigger: cell, start: 'top 80%', toggleActions: TOGGLE },
  });
  tl.fromTo(
    paths,
    { strokeDashoffset: 1 },
    { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.25 },
  );
  tl.fromTo(
    dots,
    { scale: 0, transformOrigin: '50% 50%' },
    { scale: 1, duration: 0.35, ease: 'back.out(2)', stagger: 0.07 },
    '-=0.7',
  );
  tl.fromTo(labels, { opacity: 0 }, { opacity: 1, duration: 0.3 }, '-=0.3');
}

/* -------- Celda 5: dotfiles en scroll infinito -------- */
function initDotfiles(grid: HTMLElement): Cleanup {
  const inner = grid.querySelector<HTMLElement>('[data-dotfiles]');
  if (!inner) return () => {};
  const tween = gsap.to(inner, { yPercent: -50, duration: 18, ease: 'none', repeat: -1 });
  tween.pause();
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) tween.play();
      else tween.pause();
    },
    { threshold: 0.2 },
  );
  io.observe(inner);
  return () => {
    io.disconnect();
    tween.kill();
  };
}

/* -------- Celda 6: Claude streaming -------- */
function initClaudeLoop(grid: HTMLElement): Cleanup {
  const out = grid.querySelector<HTMLElement>('[data-claude-out]');
  const reply = out?.dataset.claudeReply;
  if (!out || !reply) return () => {};
  return createLoop(out, async ({ alive, visible, sleep }) => {
    out.textContent = '';
    out.classList.add('is-streaming');
    for (const ch of reply) {
      out.textContent += ch;
      await sleep(16);
      if (!alive() || !visible()) {
        out.classList.remove('is-streaming');
        return;
      }
    }
    out.classList.remove('is-streaming');
    await sleep(2800);
  });
}

/** Bento "cómo trabajo": entrada scale 0.96→1 stagger 0.1 + 6 mini-demos vivas. */
export function initBento(): (() => void) | void {
  const grid = document.querySelector<HTMLElement>('[data-bento]');
  if (!grid) return;
  // Reduced motion: el markup ya contiene los estados finales de cada demo.
  if (prefersReducedMotion()) return;

  const cleanups: Cleanup[] = [];
  const ctx = gsap.context(() => {
    gsap.fromTo(
      grid.querySelectorAll('[data-bento-cell]'),
      { opacity: 0, scale: 0.96 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: grid, start: 'top 85%', toggleActions: TOGGLE },
      },
    );
    initGauge(grid);
    initGitGraph(grid);
  }, grid);
  cleanups.push(() => ctx.revert());
  cleanups.push(initTermLoop(grid), initKeysDemo(grid), initDotfiles(grid), initClaudeLoop(grid));
  return () => cleanups.forEach((fn) => fn());
}
