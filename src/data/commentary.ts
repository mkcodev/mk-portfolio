/** Anotaciones del Commentary Mode — meta-portfolio autoguiado. */
export type CommentaryAnchor = 'tl' | 'tr' | 'bl' | 'br';

export interface Annotation {
  selector: string;
  name: string;
  desc: string;
  file: string;
  libs: string[];
  anchor: CommentaryAnchor;
  /** Ancla al selector pero fija en esa esquina del viewport (para efectos globales). */
  pinToViewport?: boolean;
}

export const commentary: Annotation[] = [
  {
    selector: '[data-hero-field]',
    name: 'Hero ASCII field',
    desc: 'Canvas de glifos monospace que reacciona al cursor: cada carácter cambia según el gradiente radial desde el puntero, con lerp de la posición para dar peso.',
    file: 'src/scripts/heroField.ts',
    libs: ['Canvas 2D', 'requestAnimationFrame'],
    anchor: 'tl',
  },
  {
    selector: '[data-glyph-tunnel="right"]',
    name: 'Glyph tunnel',
    desc: 'Dos canvases fijados a los bordes del viewport que emiten glifos hacia arriba/abajo según la dirección y velocidad del scroll. Consulta `lenis.velocity` cada frame.',
    file: 'src/scripts/glyphTunnel.ts',
    libs: ['Canvas 2D', 'Lenis', 'rAF'],
    anchor: 'br',
    pinToViewport: true,
  },
  {
    selector: '#main-content',
    name: 'Scroll velocity skew',
    desc: 'Skew Y sutil aplicado a cada sección del main proporcional a `lenis.velocity`. Excluye pin de timeline y cinema porque un transform en ancestor rompe `position: fixed`.',
    file: 'src/scripts/scrollSkew.ts',
    libs: ['Lenis', 'rAF'],
    anchor: 'bl',
    pinToViewport: true,
  },
  {
    selector: '[data-proj-cinema]',
    name: 'Projects horizontal cinema',
    desc: 'Timeline GSAP con `pin: true` + `scrub` que desplaza el track de flagships horizontalmente mientras el scroll vertical avanza. Parallax ±4 xPercent en las imágenes y progress bar accent.',
    file: 'src/scripts/projectsCinema.ts',
    libs: ['GSAP', 'ScrollTrigger'],
    anchor: 'tr',
  },
  {
    selector: '[data-bento]',
    name: 'Bento grid interactivo',
    desc: 'Reveal staggered al entrar la sección + hover con radial glow siguiendo al cursor vía CSS vars `--mx/--my`. Contadores GSAP y SVG drawing (stroke-dashoffset) en las tarjetas técnicas.',
    file: 'src/scripts/bento.ts',
    libs: ['GSAP', 'ScrollTrigger', 'SVG'],
    anchor: 'tr',
  },
  {
    selector: '[data-timeline]',
    name: 'Timeline pinneado',
    desc: 'Sección pin+scrub en desktop (`gsap.matchMedia` ≥768px): la rama SVG se dibuja mientras el scroll avanza dentro del pin. En mobile fallback a lista vertical con reveal staggered.',
    file: 'src/scripts/timeline.ts',
    libs: ['GSAP', 'ScrollTrigger', 'SVG'],
    anchor: 'tr',
  },
  {
    selector: '[data-ascii]',
    name: 'ASCII photo crossfade',
    desc: 'Al hacer hover sobre la foto de About, un canvas superpone el retrato como matriz de caracteres. Se genera en un OffscreenCanvas al primer hover y se cachea para reusarse.',
    file: 'src/scripts/ascii.ts',
    libs: ['Canvas 2D', 'OffscreenCanvas'],
    anchor: 'tr',
  },
  {
    selector: '[data-magnetic]',
    name: 'Magnetic links',
    desc: 'CTAs terminal que atraen al cursor con lerp cuando entra en un radio de 80px alrededor del elemento. Vuelven al origen con easing suave al salir del radio.',
    file: 'src/scripts/magnetic.ts',
    libs: ['pointer events', 'rAF'],
    anchor: 'tr',
  },
];
