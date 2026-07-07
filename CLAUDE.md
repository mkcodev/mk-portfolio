# mk-portfolio — CLAUDE.md

Portfolio de Mikel Salvador García (mkcodev). Astro 7 + TS strict + Tailwind v4 + GSAP + Lenis. Dark only. Deploy: Vercel (`mkcodev.vercel.app`).

## Reglas duras

- **Cero valores Tailwind arbitrarios** (`w-[347px]`). Todo sale de `src/styles/tokens.css`. One-offs justificados se documentan aquí.
- **Glass SOLO en**: navbar, mega menu, celdas bento, ⌘K, modals → utility `.glass`. Cards de proyecto = surface sólida + hairline border.
- **Animar solo** `transform`/`opacity`/`filter`. `will-change` quirúrgico. `prefers-reduced-motion` colapsa todo a fades.
- **Acento con disciplina**: prompts, CTAs, glows, estados activos. Si todo brilla, nada brilla.
- **Proyectos**: solo los 6 reales de `src/data/projects.ts`. Métricas reales o `[PENDIENTE]`, nunca inventadas.
- Radius máx 10px (cards). Fuentes: Space Grotesk (display) + JetBrains Mono (terminal/labels/números).
- React islands SOLO: Terminal hero, ⌘K palette. Todo lo demás vanilla TS + GSAP.

## PATRÓN CENTRAL — Lifecycle de View Transitions

`src/scripts/lifecycle.ts`. ClientRouter hace swap del DOM en cada navegación:

- `src/scripts/app.ts` es solo un loader: en `requestIdleCallback` (timeout 1.5s) importa dinámicamente `src/scripts/modules.ts`, que registra todos los módulos con `onPageLoad(init)` y llama `startLifecycle()`. Así el grafo GSAP/Lenis no compite con el LCP.
- `startLifecycle()` compensa el `astro:page-load` inicial ya perdido (si `readyState !== 'loading'`, ejecuta los inits directamente).
- Los inits corren secuencialmente con yield (`setTimeout 0`) entre cada uno para no crear long tasks; un `runToken` los cancela si llega un swap a mitad.
- `astro:page-load` → re-init de todos los módulos. `astro:before-swap` → cleanup (Lenis destroy, `ScrollTrigger.getAll().forEach(kill)`, listeners).
- Scripts de componente (`<script>` en .astro) corren UNA vez por bundle: usar **delegación a nivel de document** (ver Navbar.astro) o registrar vía `onPageLoad`.
- Scroll programático: `scrollToTarget()` de `src/scripts/scroll.ts` (Lenis), nunca `window.scrollTo`.

## Animation Manifest

Tokens GSAP: entradas `power3.out 0.6–0.9s` · salidas `power2.in 0.4s` · hover `0.25s` (CSS) · stagger `0.06–0.1s`. ScrollTrigger: `toggleActions: "play reverse play reverse"` (re-anima al reentrar).

| Elemento | Trigger | In / Out |
|---|---|---|
| Boot-line | 1ª visita (sessionStorage) | type ~0.8s + fade overlay |
| Hero LCP | ninguno | render inmediato; terminal enhance después |
| Navbar compact | scroll >80px | clase `.navbar--compact`, CSS 0.25s |
| Mega menu | toggle | fade+y 0.4 power3.out, stagger li 0.06 / 0.3 power2.in |
| Section headings | ScrollTrigger 80% | fade+y 24px 0.7s, reverse |
| Project cards | ScrollTrigger | fade+y stagger 0.08; hover lift+glow CSS |
| Card→case study | click | VT morph (`transition:name` en imagen+título) |
| Bento | ScrollTrigger | scale 0.96→1 stagger 0.1; hover glow + demo despierta |
| Timeline | pin+scrub SOLO ≥768px (gsap.matchMedia) | branch stroke-dashoffset; mobile: lista vertical stagger |
| About foto | hover | crossfade ASCII canvas 0.4s |
| ⌘K | Ctrl/Cmd+K | scale 0.98→1 fade 0.25s |

## Decisiones

1. **Astro 7** (no 5 como decía el brief): última estable, mismas APIs necesarias (ClientRouter, astro:assets, i18n). create-astro la instaló por defecto.
2. **Bento vanilla GSAP** (no React): sin estado; más ligero.
3. **Fuentes**: `font-display: swap` (default fontsource) + fallbacks con métricas ajustadas (`size-adjust`/`ascent-override` en tokens.css, calibradas empíricamente con canvas TextMetrics → CLS 0). Preload de 3 woff2 en Base.astro: los 2 latin + `jbm-symbols`.
4. **OG images**: astro-og-canvas (build time) en `src/pages/og/[...slug].ts`. `canvaskit-wasm` debe ser dependencia directa (quirk de pnpm; sin ella el build falla con `__dirname is not defined`). Al añadir página nueva: añadir su entrada en `pages` del endpoint y pasar `ogImage` a Base.
5. **Grain**: SVG feTurbulence data-URI en `body::after`, opacity .03.
6. **i18n**: ES default sin prefijo, EN en `/en`. **Mapa de rutas explícito** en `src/i18n/routes.ts` — al añadir página, añadir su par ES↔EN ahí. Toggle SIEMPRE a la página equivalente. `trailingSlash: 'never'`.
7. **foto es .png** (brief decía .jpg) — astro:assets la sirve AVIF igualmente.
8. **Dominio centralizado**: `SITE_URL` en `src/data/site.ts` — cambio de dominio = 1 línea.
9. **Overlays vanilla + atajos**: `keys.ts` ignora teclas cuando el foco está dentro de `[role="dialog"]` (isEditable). Por eso al cerrar un overlay hay que liberar el foco (`blur`) y el Escape del overlay se evalúa ANTES de isEditable — si no, el foco en el botón de cierre secuestra el teclado.
10. **console.log**: prohibido salvo el banner easter egg de `src/scripts/eggs.ts` (excepción documentada).
11. **Subset de símbolos** `public/fonts/jbm-symbols.woff2` (8 KB): glifos box-drawing/bloques/flechas/checks del ASCII art, ausentes de los subsets latin de fontsource. Cara `unicode-range` en tokens.css. Regenerar con `scripts/subset-symbols.mjs` (instrucciones en su cabecera) si el ASCII art usa rangos nuevos.
12. **GSAP en scripts de componente**: import dinámico (`await import('gsap')`) dentro del handler, no import estático — evita meter GSAP en el bundle inicial de la página (ver Navbar.astro).
13. **Lighthouse local es ruidoso**: en esta máquina, runs individuales dan falsos negativos (CLS/robots flaky, layout ±40%). Medir siempre 2-3 runs y quedarse con la mediana. Techo medido v1: mobile 61 / desktop 85 (93 sin boot overlay) — TBT mobile está dominado por layout/shaping del DOM SSR bajo throttle 4x, no por JS. `content-visibility: auto` probado y descartado (empeoró layout).

## Entorno (Windows)

- **pnpm vía Bash tool o `pnpm.cmd`** — ExecutionPolicy bloquea `pnpm.ps1` en PowerShell.
- Verificar TS: `pnpm astro check`. Build: `pnpm build`. Dev: `pnpm dev`.
- Screenshots: `node scripts/screenshot.mjs` (1440 y 390 + estados interactivos). Refs de calidad en `refs/`.

## Cómo añadir un proyecto

1. Añadir entrada en `src/data/projects.ts` (con `slug` + `slugEn`).
2. Si es flagship con case study: rellenar `caseStudy` y añadir par de rutas en `src/i18n/routes.ts`.
3. Screenshot 1440×900 en `src/assets/projects/`.

## Verificación por sección (obligatoria antes de enseñar)

1. Screenshot 1440px Y 390px, mirarlos.
2. Estados interactivos con Playwright: hover cards/bento, mega menu abierto, ⌘K abierto, terminal tras comando.
3. **OJO**: `scripts/screenshot.mjs` emula `reducedMotion: 'reduce'` (para captar todo el contenido) — eso OCULTA bugs de animación. Los hovers/reveals se verifican con `reducedMotion: 'no-preference'`. Bug histórico: el transform inline residual de GSAP tras un reveal pisa los `:hover` CSS → siempre `clearProps: 'transform'` en `onComplete` si el elemento tiene hover con transform.
4. Reduced motion es un modo de primera clase (Windows "Efectos de animación" off lo activa): sin movimiento pero CON feedback — global.css limita `transition-property` a opacidad/color/borde con 150ms, nunca `transition: none` global.
5. Commit por sección (conventional commits).
