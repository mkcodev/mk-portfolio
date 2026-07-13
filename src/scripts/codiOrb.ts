export function initCodiOrb(): () => void {
  const wrapper = document.querySelector<HTMLElement>('[data-codi-orb]');
  if (!wrapper) return () => {};

  let canvas = wrapper.querySelector<HTMLCanvasElement>('canvas');
  const isNew = !canvas;

  if (isNew) {
    canvas = document.createElement('canvas');
    canvas.className = 'codi-orb-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    wrapper.appendChild(canvas);
  }

  const c = canvas!;
  const dpr = window.devicePixelRatio || 1;
  const SIZE = 64;
  c.style.width = `${SIZE}px`;
  c.style.height = `${SIZE}px`;
  c.width = SIZE * dpr;
  c.height = SIZE * dpr;

  const ctx = c.getContext('2d')!;
  ctx.scale(dpr, dpr);

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = SIZE / 2;

  const particles = Array.from({ length: 6 }, (_, i) => ({
    angle: (i / 6) * Math.PI * 2,
    radius: 22 + Math.random() * 8,
    size: 1 + Math.random(),
    speed: 0.2 + Math.random() * 0.3,
    opacity: 0.4 + Math.random() * 0.4,
    opacityDir: Math.random() > 0.5 ? 1 : -1,
    opacitySpeed: 0.01 + Math.random() * 0.02,
  }));

  let blob1Angle = 0;
  let blob2Angle = Math.PI * 0.7;
  let envelope = 1;
  let scrollVelocityMult = 1;
  let cursorDeltaX = 0;
  let cursorDeltaY = 0;
  let rafId = 0;
  let paused = false;
  let lastTime = 0;

  function draw(ts: number) {
    if (paused) {
      rafId = requestAnimationFrame(draw);
      return;
    }

    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;

    const speedMult = scrollVelocityMult;
    blob1Angle += 0.15 * speedMult * dt;
    blob2Angle += 0.23 * speedMult * dt;

    scrollVelocityMult += (1 - scrollVelocityMult) * 0.05;

    ctx.clearRect(0, 0, SIZE, SIZE);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#005855';
    ctx.fillRect(0, 0, SIZE, SIZE);

    ctx.globalCompositeOperation = 'screen';

    const b1x = cx + Math.cos(blob1Angle) * 12;
    const b1y = cy + Math.sin(blob1Angle) * 12;
    const g1 = ctx.createRadialGradient(b1x, b1y, 0, b1x, b1y, 28);
    g1.addColorStop(0, 'rgba(0, 219, 213, 0.9)');
    g1.addColorStop(1, 'rgba(0, 219, 213, 0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, SIZE, SIZE);

    const b2x = cx + Math.cos(blob2Angle) * 10;
    const b2y = cy + Math.sin(blob2Angle) * 10;
    const g2 = ctx.createRadialGradient(b2x, b2y, 0, b2x, b2y, 22);
    g2.addColorStop(0, 'rgba(1, 147, 144, 0.8)');
    g2.addColorStop(1, 'rgba(1, 147, 144, 0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, SIZE, SIZE);

    ctx.globalCompositeOperation = 'source-over';

    const highlight = ctx.createRadialGradient(cx - 12, cy - 12, 0, cx - 12, cy - 12, 20);
    highlight.addColorStop(0, 'rgba(255,255,255,0.08)');
    highlight.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = highlight;
    ctx.fillRect(0, 0, SIZE, SIZE);

    for (const p of particles) {
      p.angle += p.speed * dt;
      p.opacity += p.opacitySpeed * p.opacityDir;
      if (p.opacity > 0.8 || p.opacity < 0.2) p.opacityDir *= -1;

      const px = cx + Math.cos(p.angle) * p.radius;
      const py = cy + Math.sin(p.angle) * p.radius;

      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 219, 213, ${p.opacity * envelope})`;
      ctx.fill();
    }

    ctx.restore();

    rafId = requestAnimationFrame(draw);
  }

  rafId = requestAnimationFrame((ts) => {
    lastTime = ts;
    draw(ts);
  });

  const onVisibility = () => {
    paused = document.hidden;
  };
  document.addEventListener('visibilitychange', onVisibility);

  const onMouseMove = (e: MouseEvent) => {
    const rect = wrapper.getBoundingClientRect();
    const orbCx = rect.left + rect.width / 2;
    const orbCy = rect.top + rect.height / 2;
    const dx = e.clientX - orbCx;
    const dy = e.clientY - orbCy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 140) {
      const t = (140 - dist) / 140;
      cursorDeltaX += (dx / dist * 6 * t - cursorDeltaX) * 0.08;
      cursorDeltaY += (dy / dist * 6 * t - cursorDeltaY) * 0.08;

      if (dist < 60) {
        scrollVelocityMult = Math.max(scrollVelocityMult, 1.6);
      }

      wrapper.style.transform = `translate(${cursorDeltaX.toFixed(1)}px, ${cursorDeltaY.toFixed(1)}px)`;
    } else {
      cursorDeltaX += (0 - cursorDeltaX) * 0.08;
      cursorDeltaY += (0 - cursorDeltaY) * 0.08;
      wrapper.style.transform = `translate(${cursorDeltaX.toFixed(1)}px, ${cursorDeltaY.toFixed(1)}px)`;
    }
  };
  document.addEventListener('mousemove', onMouseMove);

  const onCodiNotify = () => {
    let ring: HTMLElement | null = wrapper.querySelector('[data-codi-ring]');
    if (!ring) {
      ring = document.createElement('div');
      ring.setAttribute('data-codi-ring', '');
      ring.className = 'codi-orb-ring';
      wrapper.appendChild(ring);
    }

    let count = 0;
    const pulse = () => {
      if (!ring) return;
      ring.animate(
        [
          { transform: 'scale(1)', opacity: '0.8' },
          { transform: 'scale(1.8)', opacity: '0' },
        ],
        { duration: 1200, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' },
      );
      count++;
      if (count < 2) setTimeout(pulse, 400);
    };
    pulse();
  };
  window.addEventListener('mk:codi-notify', onCodiNotify);

  const onCodiState = (e: Event) => {
    const state = (e as CustomEvent<string>).detail;
    if (state === 'open') {
      wrapper.classList.add('codi-orb--docked');
      envelope = 0.5;
    } else {
      wrapper.classList.remove('codi-orb--docked');
      envelope = 1;
    }
  };
  window.addEventListener('mk:codi-state', onCodiState);

  let gsapCtx: { revert: () => void } | null = null;

  void (async () => {
    const { gsap } = await import('gsap');
    gsapCtx = gsap.context(() => {
      gsap.to(wrapper, {
        scale: 1.045,
        duration: 3.2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    }, wrapper);
  })();

  const onScroll = () => {
    const lenis = (window as unknown as { lenis?: { velocity?: number } }).lenis;
    if (!lenis) return;
    const vel = Math.abs(lenis.velocity ?? 0);
    scrollVelocityMult = 1 + Math.min(vel / 50, 1.5);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  wrapper.setAttribute('tabindex', '0');
  const currentLang = document.documentElement.lang ?? 'es';
  wrapper.setAttribute(
    'aria-label',
    currentLang === 'en' ? 'Open chat with Codi' : 'Abrir chat con Codi',
  );
  wrapper.setAttribute('role', 'button');

  const onOrbClick = () => {
    window.dispatchEvent(new CustomEvent('mk:codi-open'));
  };
  const onOrbKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('mk:codi-open'));
    }
  };
  wrapper.addEventListener('click', onOrbClick);
  wrapper.addEventListener('keydown', onOrbKeydown);

  return () => {
    cancelAnimationFrame(rafId);
    document.removeEventListener('visibilitychange', onVisibility);
    document.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mk:codi-notify', onCodiNotify);
    window.removeEventListener('mk:codi-state', onCodiState);
    window.removeEventListener('scroll', onScroll);
    wrapper.removeEventListener('click', onOrbClick);
    wrapper.removeEventListener('keydown', onOrbKeydown);
    gsapCtx?.revert();
    wrapper.style.transform = '';
  };
}
