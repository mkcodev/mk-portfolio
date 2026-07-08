# POLISH.md — Auditoría vs refs/ + barra Awwwards SOTD

Auditoría basada en `shots/audit/*` (07-07-2026) contra `refs/` (linear, raycast, supabase, rauno, dennis, lusion). Ordenado por **impacto visual por hora**. Cada ítem tiene spec exacta para implementar sin decisiones creativas.

## Reglas globales (aplican a TODOS los ítems — no negociables)

- **Registro**: todo módulo nuevo se registra en `src/scripts/modules.ts` vía `onPageLoad(init)`. El init devuelve la función de cleanup (`() => ctx.revert()` o remover listeners). NUNCA scripts sueltos que sobrevivan al swap de View Transitions.
- **GSAP**: siempre `gsap.context(..., ref)` + cleanup. ScrollTrigger con `toggleActions: 'play reverse play reverse'`. Tras cualquier reveal de elementos con `:hover` propio: `onComplete: () => gsap.set(items, { clearProps: 'transform' })` (bug histórico, ver CLAUDE.md §Verificación).
- **Solo animar** `transform` / `opacity` / `filter`. `will-change` quirúrgico (poner antes de animar, quitar en onComplete).
- **`prefers-reduced-motion` SE IGNORA** (decisión #14 de CLAUDE.md). En cada ítem: NO añadir la media query ni checks `prefersReducedMotion()`. La columna "Mobile" es la única degradación.
- **Tokens**: colores/duraciones/easings SIEMPRE de `src/styles/tokens.css`. Acento = `var(--color-accent)` (#00dbd5). Nada de valores Tailwind arbitrarios.
- **Easings/duraciones del manifest**: entradas `power3.out` 0.6–0.9s · salidas `power2.in` 0.4s · hover CSS `250ms` · stagger 0.06–0.1s.
- **Scroll programático**: `scrollToTarget()` de `src/scripts/scroll.ts`, nunca `window.scrollTo`.
- **Detección desktop**: `window.matchMedia('(pointer: fine)').matches` (patrón de `heroGlow.ts`). Para breakpoints en GSAP: `gsap.matchMedia()` (patrón de `timeline.ts`).
- **Verificación por ítem**: screenshot 1440 + 390 con `node scripts/screenshot.mjs`, estado hover con Playwright, commit conventional por ítem.

---

## P0 — Bundle de fixes de diseño (≈2h total, máximo ratio impacto/hora)

Correcciones estáticas detectadas en la auditoría. Sin animación nueva. Hacer TODAS antes que cualquier efecto.

### P0.1 — Thumbnails de proyecto ilegibles ⚠️ el mayor problema del sitio
- **Evidencia**: `section-proyectos-1440.png` — la card de Total Muscle es un rectángulo casi negro; Geko es un blob púrpura sin contenido legible. En Linear/Supabase (refs) el media de cada card comunica producto.
- **Fix**: re-capturar los screenshots de `src/assets/projects/` a 1440×900 con la página REAL scrolleada a su hero con contenido visible (no el frame inicial oscuro). Subir exposición: en la card, `filter: brightness(1.15) contrast(1.05)` sobre la imagen + overlay `linear-gradient(180deg, transparent 40%, rgb(10 15 15 / 0.85) 100%)` para que el pie de card siga legible.
- **Mobile**: mismas imágenes (astro:assets ya genera tamaños).

### P0.2 — Densidad vertical de la home
- **Evidencia**: `home-es-1440.png` — huecos de >1 viewport entre hero y Trayectoria. Parte es artefacto del fullPage (reveals en opacity 0), pero el espaciado real entre secciones supera el ritmo de linear.app.
- **Fix**: padding vertical de sección = `clamp(96px, 12vh, 160px)`. Verificar en `src/components/sections/*.astro` que ninguna sección tenga `min-height: 100vh` salvo Hero. Auditar con screenshot scrolleado sección a sección.

### P0.3 — Legibilidad del navbar
- **Evidencia**: `state-navbar-compact-1440.png` — links mono uppercase se leen con esfuerzo a 1440.
- **Fix**: subir links de navbar a `var(--text-xs)` (0.75rem) mínimo con `letter-spacing: 0.08em`. Contraste del estado inactivo: `var(--color-muted)` → hover `var(--color-text)` (transición `color 250ms ease`).

### P0.4 — Mega menu: fondo insuficiente
- **Evidencia**: `state-megamenu-1440.png` — el H1 del hero se lee entero detrás del panel y compite con los links.
- **Fix**: al abrir, añadir clase al `body` que aplique a un backdrop fijo `background: rgb(10 15 15 / 0.72)` + `backdrop-filter: blur(12px)` (permitido: mega menu está en la allowlist de `.glass`). Fade-in del backdrop `opacity 0→1, 0.3s ease-out`; salida `0.25s power2.in`.

### P0.5 — Marker `[PENDIENTE]` visible en case study
- **Evidencia**: `case-geko-1440.png` — "[PENDIENTE]" en el subtítulo del browser frame, visible en producción.
- **Fix**: o rellenar la métrica real o eliminar la línea. NUNCA inventar la cifra (regla dura del proyecto).

---

## P1 — Typed commands en los markers de sección (≈1.5h)

El sitio ya tiene la identidad: cada sección lleva un marker mono (`$ git log --graph --oneline`, `// 03 — sobre_mi`…) pero son texto estático. Animarlos como si se tecleasen convierte cada entrada de sección en un momento de marca. Coste mínimo, cohesión máxima.

| Campo | Spec |
|---|---|
| Elemento | Línea de comando dentro de `SectionHeading.astro` (el `[data-animate-marker]` actual) y las líneas `$ ...` sueltas (Timeline, Contact) |
| Trigger | ScrollTrigger `start: 'top 80%'`, `toggleActions: 'play none play none'` (NO reverse: re-teclear al reentrar marea) |
| Animación | 1) el prompt `$` aparece con el fade actual (0.4s). 2) el resto del comando se teclea **char a char a 24ms/char** (rAF o `gsap.to` con `snap`), máx 1.2s total (si el comando es más largo, acelerar para caber). 3) Caret block `▮` (color `var(--color-accent)`) parpadea `steps(1)` 1s infinito mientras teclea, se desvanece `opacity 0.3s` al terminar |
| Easing | `none` (typing es lineal por definición) |
| Integración | Modificar `initReveals()` en `src/scripts/reveal.ts`: el timeline del heading pasa a ser marker-typing → título. El título mantiene su spec actual (fade+y 24px, 0.7s, power3.out) solapado `-=0.2` |
| Estado sin JS | El texto completo debe estar en el HTML; JS lo vacía y re-teclea (patrón progressive enhancement, igual que hace reveal.ts con los estados iniciales) |
| Mobile | Idéntico (barato, sin layout) |
| Reduced-motion | Ignorar (decisión #14) |
| Verificar | Playwright: scroll a cada sección, screenshot a mitad de typing y al final |

---

## P2 — Scramble/decrypt en los H2 de sección (≈2.5h) 🔧 snippet abajo

Efecto firma para las cabeceras: los caracteres del H2 aparecen "descifrándose" (chars aleatorios del set mono → letra final), en lugar del fade+y genérico. Es EL efecto que separa un portfolio correcto de uno memorable con estética terminal. Referencia mental: los headings de rauno.me tienen siempre un twist tipográfico propio.

| Campo | Spec |
|---|---|
| Elemento | `[data-animate-title]` de cada `SectionHeading` (Proyectos, Cómo trabajo, Trayectoria, Sobre mí, Certificaciones, Contacto) |
| Trigger | El mismo timeline de P1 (después del typing del marker, solapado `-=0.3`) |
| Animación | Cada char: muestra 3–6 chars aleatorios del set `!<>-_\\/[]{}—=+*^?#` antes de fijar el definitivo. Resolución de izquierda a derecha con stagger 35ms/char. Duración total ≤0.9s para un H2 de ~15 chars. El char sin resolver se pinta `color: var(--color-ink-deep)`; al resolverse hereda el color normal |
| Layout | OBLIGATORIO: fijar `min-height` y `min-width` del H2 antes de empezar (medir el texto final) o usar `position: relative` + chars en `<span>` con ancho fijo `ch` — el scramble NO puede mover layout (CLS) |
| Fallback | El H2 real queda en el DOM para SEO/no-JS; el scramble reemplaza `textContent` solo al disparar |
| Mobile | Idéntico |
| Reduced-motion | Ignorar (decisión #14) |
| Verificar | Screenshot a mitad de scramble; comprobar que el ancho del heading no salta (comparar antes/después) |

---

## P3 — Contacto: email gigante tipo wordmark (≈2h)

La sección más pobre del sitio (`section-contact-1440.png`: un heading, una línea y un botón flotando en vacío) siendo la de mayor intención de conversión. Los portfolios SOTD (dennis, lusion) cierran con tipografía masiva.

| Campo | Spec |
|---|---|
| Elemento | `src/components/sections/Contact.astro` — sustituir el botón `( mailto:… )` por el email como display type |
| Layout | Email `mikelrsg@gmail.com` (el real del sitio) en `var(--font-display)`, tamaño `clamp(2rem, 6.5vw, 5.5rem)`, weight 700, `letter-spacing: -0.03em`, una sola línea, color `var(--color-text)`. Encima, la línea actual de copy. Debajo, fila mono `var(--text-xs)` con GitHub · LinkedIn · CV (ya existen) |
| Hover | Sobre el email: 1) underline draw — pseudo `::after` de 2px `var(--color-accent)`, `transform: scaleX(0)→scaleX(1)`, `transform-origin: left`, `250ms var(--ease-out-power3)`; 2) `color` → `var(--color-accent)` 250ms; 3) aplicar el efecto magnetic existente (`src/scripts/magnetic.ts`) con fuerza reducida (traslación máx 6px) |
| Click | `mailto:` + copiar al portapapeles + toast mono `copied ✓` (fade+y 8px, in 0.25s power3.out, out 0.4s power2.in a los 2s) con `role="status" aria-live="polite"` |
| Entrada | Reveal estándar del grupo (fade+y 28, 0.7s, power3.out, stagger 0.08) — ya lo da `data-reveal-group` |
| Mobile | El email rompe a 2 líneas si hace falta (`word-break: break-all` NO — usar `overflow-wrap: anywhere`); tamaño mínimo del clamp lo cubre. Sin magnetic (pointer coarse) |
| Reduced-motion | Ignorar (decisión #14) |

---

## P4 — Hover cinemático en project cards (≈2.5h)

Con P0.1 hecho, las cards necesitan vida al cursor. Referencia: `refs/supabase-bento-hover.png` (el hover comunica interactividad sin mover layout) y linear.app cards.

| Campo | Spec |
|---|---|
| Elemento | `ProjectCard.astro` (imagen + contenido) |
| Hover in (CSS puro, 250ms) | 1) imagen: `transform: scale(1.045)` con `transition: transform 600ms var(--ease-out-power3)` (más lento que el resto: cinemático) dentro de wrapper con `overflow: hidden`; 2) card: lift `translateY(-2px)` + `box-shadow: var(--shadow-card), var(--shadow-glow)` (ya parcialmente presente — verificar); 3) overlay gradiente de la imagen baja a `opacity 0.6`; 4) el link `[case study]` se enciende: `color var(--color-accent)` + flecha `→` que entra `transform: translateX(-4px)→0` + `opacity 0→1`, 250ms |
| Cursor pill (JS, solo pointer fine) | Pill mono `view case →` (fondo `var(--color-surface-2)`, border `var(--color-border-strong)`, radius `var(--radius-md)`, padding 6px 12px, `var(--text-2xs)`) que sigue al cursor DENTRO del área de la imagen con lerp 0.15 (mismo patrón rAF de `heroGlow.ts`). Entra `scale 0.8→1 + opacity 0→1` 0.25s power3.out al `pointerenter`, sale 0.2s power2.in. Ocultar el cursor custom nativo del sitio sobre la imagen para no duplicar (coordinar con `cursor.ts`) |
| Salida | Todo revierte con la misma transition CSS; el pill se desmonta en `pointerleave` |
| Mobile | Solo el lift al `:active` (`transform: translateY(-1px)`); nada de pill ni scale de imagen |
| Reduced-motion | Ignorar (decisión #14) |
| Verificar | `state-project-hover-1440.png` regenerado: pill visible + imagen escalada + glow |

---

## P5 — Hero: campo de puntos ASCII interactivo ✅ HECHO (07-07-2026)

**Implementado**: `src/scripts/heroField.ts` (registrado en `modules.ts`), canvas `[data-hero-field]` en `Hero.astro`. Verificado con `shots/hero-field-hover-1440.png` y `shots/hero-field-crop.png` (repulsión + glifos activos en acento OK). `pnpm astro check` limpio. NO tocar salvo bug. La spec original queda abajo como referencia.

El hero actual (H1 + terminal card + glow que sigue el cursor) está bien pero no tiene el momento de asombro de lusion/rauno. Un canvas de caracteres mono que reaccionan al cursor es la pieza que falta: barata en GPU (un solo canvas 2D), 100% on-brand.

| Campo | Spec |
|---|---|
| Elemento | `<canvas data-hero-field>` posicionado `absolute inset-0` DETRÁS del contenido del hero (`z-index` bajo el H1 y la terminal), `pointer-events: none` |
| Contenido | Grid de glifos mono (`.`, `·`, `:`, `+`) espaciados 28px, color base `var(--color-ink-deep)` (#005855) con alpha 0.35 |
| Interacción | Radio de 140px alrededor del cursor: los glifos dentro 1) se desplazan radialmente alejándose (repulsión, máx 10px, falloff cuadrático), 2) suben alpha hasta 0.9 y cambian a `var(--color-accent)`, 3) mutan a un char "activo" (`+`, `▪`) mientras están excitados. Todo con lerp 0.12 de vuelta al reposo |
| Idle | Sin cursor: drift sinusoidal sutil de alpha (±0.08, periodo ~4s, fase por celda) para que nunca esté muerto |
| Performance | Un solo rAF; pausar el loop cuando el hero sale del viewport (IntersectionObserver) y en `document.hidden`. Canvas a `devicePixelRatio` máx 2. Pre-renderizar los glifos como sprites offscreen si el frame budget se supera (medir primero) |
| Convivencia | Mantener `heroGlow.ts` (el glow queda debajo del canvas, se suman). El canvas NO debe tapar el LCP: se monta desde `modules.ts` (post-idle), el hero renderiza igual sin él |
| Mobile / pointer coarse | NO montar el canvas (return early como `heroGlow.ts`). El hero móvil queda como está |
| Reduced-motion | Ignorar (decisión #14) |
| Verificar | Screenshot con cursor simulado en el centro del hero; DevTools performance: el rAF < 4ms/frame en throttle 4x |

---

## P6 — Bento: spotlight que cruza el grid (≈2h) 🔧 snippet abajo

Las celdas ya despiertan al hover una a una. Falta la capa que las une: un glow radial que sigue al cursor a través de TODO el grid iluminando los bordes cercanos (patrón tailwindcss.com/Supabase, ver `refs/supabase-bento-hover.png`).

| Campo | Spec |
|---|---|
| Elemento | `src/components/sections/Bento.astro` — cada celda gana un `::before` overlay |
| Efecto | `::before` de cada celda: `background: radial-gradient(320px circle at var(--mx) var(--my), rgb(0 219 213 / 0.10), transparent 65%)`, `opacity 0→1` en 300ms al entrar el cursor AL GRID (no a la celda). Además border highlight: segundo pseudo o `border-image` con el mismo radial a `rgb(0 219 213 / 0.35)` limitado al border (técnica: elemento padding-box vs border-box, ver snippet) |
| JS | UN solo listener `pointermove` en el contenedor del grid que escribe `--mx`/`--my` por celda (coordenadas relativas a cada celda). Sin rAF-lerp: el spotlight debe ser 1:1 con el cursor (es luz, no objeto físico) |
| Salida | `pointerleave` del grid: `opacity → 0` 400ms ease |
| Mobile / pointer coarse | No montar (return early). Las celdas conservan su hover/tap actual |
| Reduced-motion | Ignorar (decisión #14) |
| Verificar | Regenerar `state-bento-hover-1440.png` con cursor entre dos celdas: ambas deben iluminarse parcialmente |

---

## P7 — Timeline: pulso de commits + hover de fila (≈2h)

El concepto git-log es de los mejores del sitio pero la ejecución es plana (`section-timeline-1440.png`: filas diminutas, mucho vacío). El branch ya se dibuja con scrub; falta que los commits "lleguen".

| Campo | Spec |
|---|---|
| Commit dots | Al pasar el head del branch por cada nodo (sincronizar con el progress del scrub existente en `src/scripts/timeline.ts`): dot `scale 0→1` 0.4s `back.out(1.7)` + anillo de pulso (`::after`: `scale 1→2.2` + `opacity 0.5→0` 0.6s ease-out, una vez). En mobile (<768, sin scrub): el dot hace pop cuando su fila entra por ScrollTrigger `top 85%` |
| Hash | El hash mono (`a3f19b2`) de cada fila pasa de `var(--color-muted)` a `var(--color-accent)` cuando su commit ya "existe" (transición `color 250ms`) |
| Hover fila (pointer fine) | Fondo `var(--color-surface)` fade 250ms + hash a acento + la fecha derecha desliza `translateX(-4px)` 250ms `var(--ease-out-power3)` |
| Tipografía | Subir el mensaje del commit a `var(--text-sm)`; el tipo de commit (`feat:`, `refactor:`) coloreado: `feat` acento, `refactor` `var(--color-muted)` — igual que un git log real con color |
| Mobile | Lista vertical actual + pop por fila (arriba). Sin hover |
| Reduced-motion | Ignorar (decisión #14) |

---

## P8 — Marquee de stack entre hero y Proyectos (≈1.5h)

Rellena el valle visual hero→Proyectos (P0.2) con densidad de marca. Patrón clásico SOTD bien ejecutado.

| Campo | Spec |
|---|---|
| Elemento | Nueva strip full-width tras el hero: `React · Next.js · Astro · TypeScript · Tailwind · GSAP · Node · pnpm · Arch · fish` en `var(--font-mono)` `var(--text-sm)` uppercase, `color: var(--color-muted)`, separador `·` en `var(--color-ink-deep)` |
| Animación | CSS puro: dos copias del contenido en un track flex, `animation: marquee 40s linear infinite` con `@keyframes marquee { to { transform: translateX(-50%) } }`. El track lleva `will-change: transform` |
| Bordes | Hairline `var(--color-border-soft)` arriba y abajo + fade lateral con `mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent)` |
| Hover | `animation-play-state: paused` + los items suben a `var(--color-text)` 250ms |
| Mobile | Igual (CSS puro, barato). Velocidad 28s (menos recorrido visible) |
| Reduced-motion | Ignorar (decisión #14) |
| Nota | Duplicar contenido con `aria-hidden="true"` en la segunda copia |

---

## P9 — Footer: wordmark masivo (≈1.5h)

El footer actual es una línea de créditos. Los cierres SOTD dejan firma.

| Campo | Spec |
|---|---|
| Elemento | `Footer.astro` — añadir `mkcodev_` en `var(--font-display)` weight 700, tamaño `clamp(4rem, 14vw, 12rem)`, `line-height: 0.9`, color `var(--color-surface-2)` (tone-on-tone, casi invisible), full-width, `overflow: hidden`, el underscore final en `var(--color-accent)` parpadeando `steps(1)` 1.1s infinito |
| Entrada | ScrollTrigger `top 90%`: `y: '35%' → 0` + `opacity 0→1`, 0.9s power3.out (una vez, `play none none none`) |
| Hover (pointer fine) | Por-carácter (`<span>` por letra): la letra bajo el cursor + vecinas ±1 hacen `translateY(-6%)` con transición CSS 250ms escalonada por distancia (delay 40ms por posición). Sin JS: usar `:hover` por span con `transition-delay` no funciona para vecinas — hacerlo con un `pointermove` que setea clase `.near` en ±1 (barato) |
| Mobile | Solo la entrada + caret; sin hover |
| Reduced-motion | Ignorar (decisión #14) |

---

## P10 — Certificaciones: rediseño de jerarquía (≈2h)

`section-certs-1440.png`: 12 cards idénticas sin jerarquía — la sección con menos diseño del sitio.

| Campo | Spec |
|---|---|
| Agrupación | Agrupar por emisor con label mono de grupo (`// platzi`, `// anthropic`, …) en `var(--text-2xs)` uppercase `var(--color-muted)`. Marker de sección muestra el total: `$ ls certs/ | wc -l → 12` |
| Card | Mantener surface sólida + hairline (regla glass). Añadir: fecha alineada derecha en `var(--color-ink-deep)`, y el nombre del cert a `var(--text-sm)` weight 500 |
| Destacado | La cert flagship (Full Stack 360h) ocupa 2 columnas con borde `var(--color-border-strong)` y tag `[flagship]` en acento |
| Hover | Lift `translateY(-2px)` + border a `var(--color-border-strong)` + fecha a `var(--color-muted)`, 250ms ease. (Ya hay patrón de card — reutilizar clases) |
| Entrada | Ya cubierta por `data-reveal-group` (stagger 0.08). Añadir los grupos como grupos de reveal separados |
| Mobile | 1 columna, flagship primero |
| Reduced-motion | Ignorar (decisión #14) |

---

## P11 — Case study: entrada del browser frame + salida del morph (≈2h)

El morph card→case study ya existe. La landing del case study (`case-geko-1440.png`) aterriza estática tras el morph.

| Campo | Spec |
|---|---|
| Browser frame | Al cargar (post `astro:page-load`): frame `y: 32 → 0` + `opacity 0→1` 0.8s power3.out con delay 0.15s (deja respirar al morph del título). El screenshot interior hace reveal con `clip-path: inset(0 0 100% 0) → inset(0)` 0.9s power3.out solapado `-=0.5` — clip-path es composited-adjacent y aceptable aquí (una vez, no scroll-linked); si produce jank en el trace, sustituir por `opacity + scale 1.03→1` |
| Chips de stack | Los chips (`Next.js`, `TypeScript`, …) entran con stagger 0.05, fade+y 12px, 0.4s power3.out, tras el título |
| URL bar | El dominio en la barra del frame se teclea a 20ms/char (reutilizar el helper de typing de P1) |
| Mobile | Idéntico (barato) |
| Reduced-motion | Ignorar (decisión #14) |

---

## P12 — 404: teclear el error (≈45min)

`notfound-1440.png` muestra el chiste (`fzweb: page: command not found`) ya impreso. Teclearlo lo convierte en momento.

- Al cargar: se teclea `fzweb page` a 40ms/char → pausa 300ms → la línea de error aparece de golpe (los errores no se teclean) → `404` y el resto hacen fade+y 16px 0.5s power3.out stagger 0.08. Caret parpadeando al final. Reutilizar el helper de typing de P1. Mobile idéntico. Reduced-motion: ignorar (decisión #14).

---

## P13 — Blog: empty state con intención (≈45min)

`blog-es-1440.png` está casi vacío y parece roto.

- Añadir bajo el copy actual un bloque ASCII art pequeño (usar glifos del subset `jbm-symbols.woff2` ya cargado — no añadir rangos nuevos sin regenerar subset, decisión #11) de un cursor de terminal o un `tail -f posts.log` con caret parpadeando, y una fila de 2–3 "posts fantasma" como skeletons estáticos (surface + hairline, sin shimmer) con títulos `[draft]` en `var(--color-ink-deep)`. Comunica "hay pipeline" en vez de "está roto". Sin animación salvo el caret. Mobile: 1 columna.

---

# Notas de implementación — los 3 efectos difíciles

## A) P5 — Hero ASCII field (canvas)

Módulo nuevo `src/scripts/heroField.ts`, registrado en `modules.ts` con `onPageLoad(initHeroField)`.

```ts
// src/scripts/heroField.ts
const GAP = 28;
const RADIUS = 140;
const MAX_PUSH = 10;
const LERP = 0.12;
const GLYPHS = ['.', '·', ':', '+'];
const ACTIVE_GLYPH = '+';

interface Cell { x: number; y: number; ox: number; oy: number; heat: number; glyph: string; phase: number }

export function initHeroField(): (() => void) | void {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const canvas = document.querySelector<HTMLCanvasElement>('[data-hero-field]');
  if (!hero || !canvas) return;
  const ctx2d = canvas.getContext('2d');
  if (!ctx2d) return;

  const dpr = Math.min(devicePixelRatio, 2);
  let cells: Cell[] = [];
  let mx = -9999, my = -9999;
  let rafId = 0, visible = false;

  const build = () => {
    const { width, height } = hero.getBoundingClientRect();
    canvas.width = width * dpr; canvas.height = height * dpr;
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    ctx2d.scale(dpr, dpr);
    ctx2d.font = '13px "JetBrains Mono Variable", monospace';
    ctx2d.textAlign = 'center'; ctx2d.textBaseline = 'middle';
    cells = [];
    for (let y = GAP; y < height; y += GAP)
      for (let x = GAP; x < width; x += GAP)
        cells.push({ x, y, ox: x, oy: y, heat: 0,
          glyph: GLYPHS[(Math.random() * GLYPHS.length) | 0] ?? '.',
          phase: Math.random() * Math.PI * 2 });
  };

  const frame = (t: number) => {
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    for (const c of cells) {
      const dx = c.ox - mx, dy = c.oy - my;
      const d = Math.hypot(dx, dy);
      let targetHeat = 0, tx = c.ox, ty = c.oy;
      if (d < RADIUS) {
        const f = (1 - d / RADIUS) ** 2;           // falloff cuadrático
        targetHeat = f;
        tx = c.ox + (dx / (d || 1)) * MAX_PUSH * f; // repulsión radial
        ty = c.oy + (dy / (d || 1)) * MAX_PUSH * f;
      }
      c.heat += (targetHeat - c.heat) * LERP;
      c.x += (tx - c.x) * LERP;
      c.y += (ty - c.y) * LERP;
      const idle = 0.35 + Math.sin(t / 640 + c.phase) * 0.08; // drift idle
      const alpha = idle + (0.9 - idle) * c.heat;
      // teal ink → accent según heat (interp simple de canal)
      ctx2d.fillStyle = c.heat > 0.15
        ? `rgb(0 ${Math.round(88 + 131 * c.heat)} ${Math.round(85 + 128 * c.heat)} / ${alpha})`
        : `rgb(0 88 85 / ${alpha})`;
      ctx2d.fillText(c.heat > 0.5 ? ACTIVE_GLYPH : c.glyph, c.x, c.y);
    }
    rafId = requestAnimationFrame(frame);
  };

  const onMove = (e: MouseEvent) => {
    const r = hero.getBoundingClientRect();
    mx = e.clientX - r.left; my = e.clientY - r.top;
  };
  const onLeave = () => { mx = -9999; my = -9999; };

  const io = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    cancelAnimationFrame(rafId);
    if (visible && !document.hidden) rafId = requestAnimationFrame(frame);
  });
  const onVis = () => {
    cancelAnimationFrame(rafId);
    if (visible && !document.hidden) rafId = requestAnimationFrame(frame);
  };

  build();
  hero.addEventListener('mousemove', onMove);
  hero.addEventListener('mouseleave', onLeave);
  document.addEventListener('visibilitychange', onVis);
  io.observe(hero);
  window.addEventListener('resize', build);

  return () => {
    cancelAnimationFrame(rafId);
    io.disconnect();
    hero.removeEventListener('mousemove', onMove);
    hero.removeEventListener('mouseleave', onLeave);
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('resize', build);
  };
}
```

En `Hero.astro`: `<canvas data-hero-field aria-hidden="true" class="hero-field"></canvas>` con `position: absolute; inset: 0; z-index: 0; pointer-events: none` (contenido del hero en `z-index: 1`). Nota: `ctx2d.scale` acumula si `build()` corre en resize — hacer `ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0)` en lugar de `scale`.

## B) P2 — Scramble text (sin plugins de pago)

Helper en `src/scripts/scramble.ts`, consumido desde `reveal.ts`. NO usar ScrambleTextPlugin (Club GSAP, de pago). Implementación propia con rAF:

```ts
const CHARS = '!<>-_\\/[]{}—=+*^?#';

/** Descifra el texto de `el` de izquierda a derecha. Devuelve cancel(). */
export function scramble(el: HTMLElement, opts = { perChar: 35, cycles: 4 }): () => void {
  const target = el.dataset.scrambleText ?? el.textContent ?? '';
  el.dataset.scrambleText = target;              // idempotente entre re-inits
  const start = performance.now();
  let rafId = 0;

  const tick = (now: number) => {
    const elapsed = now - start;
    let out = '';
    let done = true;
    for (let i = 0; i < target.length; i++) {
      const charStart = i * opts.perChar;
      const charEnd = charStart + opts.perChar * opts.cycles;
      if (elapsed >= charEnd || target[i] === ' ') out += target[i];
      else {
        done = false;
        out += elapsed < charStart ? ' '
          : CHARS[(Math.random() * CHARS.length) | 0];
      }
    }
    el.textContent = out;
    if (!done) rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(rafId); el.textContent = target; };
}
```

Claves anti-CLS: antes de arrancar, fijar `el.style.minWidth = el.offsetWidth + 'px'` y `minHeight = el.offsetHeight + 'px'` (el texto final ya está renderizado en SSR), y usar ` ` para chars aún no empezados. En `reveal.ts`, dentro del timeline del heading: `tl.call(() => { cleanupFns.push(scramble(title)) })`. El cancel devuelto debe entrar en el cleanup del módulo (si llega un swap a mitad, restaurar el texto).

## C) P6 — Bento spotlight (CSS vars + un listener)

CSS en `Bento.astro` (o global.css):

```css
.bento-cell { position: relative; }
.bento-cell::before {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  background: radial-gradient(320px circle at var(--mx, -200px) var(--my, -200px),
    rgb(0 219 213 / 0.10), transparent 65%);
  opacity: 0;
  transition: opacity 300ms ease;
  pointer-events: none;
}
/* Border highlight: capa que solo pinta el borde con el mismo radial */
.bento-cell::after {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: radial-gradient(280px circle at var(--mx, -200px) var(--my, -200px),
    rgb(0 219 213 / 0.35), transparent 60%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 300ms ease;
  pointer-events: none;
}
.bento-grid.is-lit .bento-cell::before,
.bento-grid.is-lit .bento-cell::after { opacity: 1; }
```

JS (añadir a `src/scripts/bento.ts`, dentro del init existente):

```ts
if (window.matchMedia('(pointer: fine)').matches) {
  const grid = document.querySelector<HTMLElement>('.bento-grid');
  const cellList = [...document.querySelectorAll<HTMLElement>('.bento-cell')];
  if (grid) {
    const onMove = (e: PointerEvent) => {
      for (const cell of cellList) {
        const r = cell.getBoundingClientRect();
        cell.style.setProperty('--mx', `${e.clientX - r.left}px`);
        cell.style.setProperty('--my', `${e.clientY - r.top}px`);
      }
    };
    const enter = () => grid.classList.add('is-lit');
    const leave = () => grid.classList.remove('is-lit');
    grid.addEventListener('pointermove', onMove);
    grid.addEventListener('pointerenter', enter);
    grid.addEventListener('pointerleave', leave);
    // añadir los removeEventListener al cleanup existente del módulo
  }
}
```

`getBoundingClientRect` por celda y frame es aceptable (6 celdas); si el trace muestra layout thrashing, cachear los rects y recalcular solo en `resize`/`scroll` (throttled).

---

# HANDOFF — orden de ejecución recomendado

Estado: **P5 ya está implementado y verificado** (ver arriba). Ejecutar el resto EN ESTE ORDEN, un commit conventional por ítem, verificando cada uno con screenshots 1440+390 y `pnpm astro check` antes de pasar al siguiente:

1. **P0** completo (los 5 fixes, commits separados `fix:`)
2. **P1** typed commands → 3. **P2** scramble (comparten helper de typing/timeline en `reveal.ts` — hacer seguidos)
4. **P3** contacto → 5. **P4** cards hover
6. **P6** bento spotlight → 7. **P7** timeline
8. **P8–P13** en orden

Reglas de oro para el ejecutor (además de las globales de arriba):
- Leer `src/scripts/heroField.ts` como patrón de referencia: así se estructura un módulo nuevo (matchMedia pointer fine, cleanup completo, IntersectionObserver para pausar rAF).
- Ante cualquier duda de spec: elegir la opción MÁS SOBRIA. Nada de improvisar efectos no especificados.
- Si un efecto produce jank en el trace de Performance (frame >8ms en throttle 4x): degradarlo según la alternativa indicada en su spec, no optimizar por libre.
- No tocar: `lifecycle.ts`, el orden de `onPageLoad` en `modules.ts` (los reveals ANTES del pin del timeline — comentario in situ), ni nada de P5.

# Resumen de prioridades

| # | Ítem | Est. | Impacto |
|---|---|---|---|
| P0 | Bundle fixes (thumbnails ⚠️, densidad, navbar, megamenu, [PENDIENTE]) | 2h | ★★★★★ |
| P1 | Typed commands en markers | 1.5h | ★★★★ |
| P2 | Scramble en H2 | 2.5h | ★★★★ |
| P3 | Contacto email gigante | 2h | ★★★★ |
| P4 | Hover cinemático project cards | 2.5h | ★★★★ |
| P5 | Hero ASCII field ✅ HECHO | — | ★★★★★ |
| P6 | Bento spotlight | 2h | ★★★ |
| P7 | Timeline commit pulse | 2h | ★★★ |
| P8 | Marquee stack | 1.5h | ★★ |
| P9 | Footer wordmark | 1.5h | ★★ |
| P10 | Certs rediseño | 2h | ★★ |
| P11 | Case study entrada | 2h | ★★ |
| P12 | 404 typing | 45m | ★ |
| P13 | Blog empty state | 45m | ★ |

Después de cada ítem: `pnpm astro check` + screenshots 1440/390 + estados interactivos + commit conventional (CLAUDE.md §Verificación).

---

# Continuación (08-07-2026) — P14–P17 + efectos ya implementados

**Implementados y verificados** (además de P5): `glyphTunnel.ts` (columnas laterales de glifos a velocidad de scroll), `scrollSkew.ts` (skewY ±3deg por velocity, timeline excluido del skew — su pin rompería), `cursorTrail.ts` (estela de glifos). NO tocar salvo bug.

## P14 — Split-word H2 con clip-path (2h) ★★★★
Sobre `[data-animate-title]`: cada palabra en `<span>` dentro de wrapper `overflow:hidden`. Trigger actual del heading. `y: 100% → 0` + `clip-path: inset(100% 0 0 0) → inset(0)`, `power4.out 0.9s`, stagger 0.08s. Mantener marker antes. Anti-CLS: los spans no cambian el flujo (inline-block, sin padding).

## P15 — Bio blur reveal (1.5h) ★★★
`hero-tagline` + párrafos de About. Partir en líneas visuales con `Range` + `getClientRects()` (SIN dependencia externa). Por línea: `filter: blur(10px) → 0` + `y: 14 → 0`, `power3.out 0.7s`, stagger 0.09s, ScrollTrigger `top 82%`. Cleanup: restaurar texto original (el splitter muta el DOM).

## P16 — Parallax 3D case study frame (2h) ★★★
`.browser-frame` de `CaseStudy.astro`: contenedor con `perspective: 1200px`; frame `rotateY/rotateX` máx 5deg siguiendo cursor con lerp 0.1 (patrón rAF de `heroGlow.ts`). Highlight radial interno que sigue al cursor (CSS vars --mx/--my como el bento spotlight P6). Solo pointer fine; return early mobile.

## P17 — Constellation graph (3h) ★★★
Sección nueva 60vh entre hero y `#proyectos`: 6 nodos SVG (1 por proyecto de `src/data/projects.ts`, coordenadas fijas). Líneas `stroke-dashoffset` dibujadas con ScrollTrigger scrub. Nodo: glow accent, hover tooltip mono (nombre+stack), click `scrollToTarget('#proyectos')`. Cierra el hueco de P0.2 con contenido.

Orden para Opus: **P0 → P14 → P16 → P15 → P17**, luego P1–P13 según tabla original.
