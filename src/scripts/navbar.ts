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
 * Navbar: altura fija (siempre "compacto"). Solo actualiza el progress ring
 * alrededor del logo y marca link activo por sección visible.
 */
export function initNavbar(): (() => void) | void {
  const navbar = document.querySelector<HTMLElement>('[data-navbar]');
  if (!navbar) return;
  const progress = navbar.querySelector<SVGCircleElement>('[data-nav-progress]');

  let ticking = false;

  const applyProgress = (): void => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    progress.style.strokeDashoffset = String(1 - p);
  };

  const onScroll = (): void => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      applyProgress();
    });
  };

  applyProgress();
  window.addEventListener('scroll', onScroll, { passive: true });

  const cleanupSections = initSectionActive(navbar);

  return () => {
    window.removeEventListener('scroll', onScroll);
    cleanupSections?.();
  };
}
