/**
 * Entry mínimo. El grafo de animación completo (GSAP, Lenis, módulos) se
 * carga con import dinámico en idle: su evaluación (~1s en móvil lento) no
 * compite con el render inicial ni bloquea la ventana FCP→TTI (TBT).
 * El lifecycle compensa el astro:page-load inicial ya emitido (lifecycle.ts).
 */
function boot(): void {
  void import('./modules');
}

if ('requestIdleCallback' in window) {
  requestIdleCallback(boot, { timeout: 1500 });
} else {
  setTimeout(boot, 300);
}
