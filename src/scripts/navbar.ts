import gsap from 'gsap';

const THRESHOLD = 80;
// Vueltas ENTERAS para que el logo aterrice en la misma orientación
// (1.5 dejaba la moneda cabeza abajo al terminar el spin).
const SPIN_TURNS = 2;
const SPIN_DURATION = 1.1;
const SPIN_EASE = 'power2.inOut';

const SECTION_IDS = ['proyectos', 'como-trabajo', 'trayectoria', 'sobre-mi', 'contacto'];

function initSectionActive(navbar: HTMLElement): (() => void) | undefined {
  const links = new Map<string, HTMLElement>();
  navbar.querySelectorAll<HTMLElement>('.navbar-link').forEach((a) => {
    const href = a.getAttribute('href') ?? '';
    const hashIdx = href.indexOf('#');
    if (hashIdx === -1) return;
    const hash = href.slice(hashIdx + 1);
    if (hash) links.set(hash, a);
  });
  if (links.size === 0) return;

  const targets: HTMLElement[] = [];
  for (const id of SECTION_IDS) {
    const el = document.getElementById(id);
    if (el) targets.push(el);
  }
  if (targets.length === 0) return;

  const setActive = (id: string | null): void => {
    for (const [key, el] of links) el.classList.toggle('is-active', key === id);
  };

  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
      const first = visible[0]?.target as HTMLElement | undefined;
      if (first) setActive(first.id);
    },
    { rootMargin: '-30% 0px -60% 0px' },
  );
  for (const el of targets) io.observe(el);

  return () => {
    io.disconnect();
    setActive(null);
  };
}

/**
 * Navbar cinemático:
 * - Compacta la barra (altura) al scroll >80px.
 * - Sustituye el shrink del logo por rotación acumulativa (1.5 vueltas, power2.inOut).
 * - Actualiza el progress ring alrededor del logo con scrollY/maxScroll.
 * - Marca link activo por sección visible (solo si hay anchors matching).
 */
export function initNavbar(): (() => void) | void {
  const navbar = document.querySelector<HTMLElement>('[data-navbar]');
  if (!navbar) return;
  const logoImg = navbar.querySelector<HTMLElement>('[data-nav-logo]');
  const progress = navbar.querySelector<SVGCircleElement>('[data-nav-progress]');

  let compact = window.scrollY > THRESHOLD;
  let rotation = 0;
  navbar.classList.toggle('navbar--compact', compact);

  let ticking = false;

  const applyProgress = (): void => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    progress.style.strokeDashoffset = String(1 - p);
  };

  const update = (): void => {
    ticking = false;
    applyProgress();
    const shouldCompact = window.scrollY > THRESHOLD;
    if (shouldCompact === compact) return;
    compact = shouldCompact;
    navbar.classList.toggle('navbar--compact', compact);
    if (!logoImg) return;
    const dir = compact ? 1 : -1;
    rotation += dir * 360 * SPIN_TURNS;
    gsap.to(logoImg, {
      rotate: rotation,
      duration: SPIN_DURATION,
      ease: SPIN_EASE,
      overwrite: 'auto',
    });
  };

  const onScroll = (): void => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  applyProgress();
  window.addEventListener('scroll', onScroll, { passive: true });

  const cleanupSections = initSectionActive(navbar);

  return () => {
    window.removeEventListener('scroll', onScroll);
    cleanupSections?.();
  };
}
