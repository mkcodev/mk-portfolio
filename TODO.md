# TODO — backlog post-v1

## Infraestructura (requieren decisión/dashboard)

- [ ] **Reasignar `mkcodev.vercel.app`** al proyecto `mk-portfolio`. El subdominio lo ocupa el
      proyecto viejo "mkcodev" (Next.js, misma cuenta maikcodexs-projects). Opciones:
      quitar el dominio del proyecto viejo y añadirlo al nuevo, o eliminar/renombrar el
      proyecto viejo. **Requiere confirmación de Mikel** (desconecta la web antigua).
      Mientras tanto producción vive en `mk-portfolio-beige-sigma.vercel.app`.
- [ ] **Conectar integración GitHub↔Vercel** en el dashboard (`vercel git connect` falló por CLI).
      Hasta entonces, deploy manual: `vercel --prod --yes`.
- [ ] Dominio custom definitivo (cambiar `SITE_URL` en `src/data/site.ts` — 1 línea).

## Contenido

- [ ] Métricas Lighthouse reales de sitios cliente en case studies (sustituir `[PENDIENTE]`).
- [ ] Screenshots reales de los 6 proyectos (sustituir placeholders 1440×900).
- [ ] Hardware en `/uses` (campo `[PENDIENTE]` en `src/data/uses.ts`).
- [ ] Primeros posts del blog (scaffold + RSS ya existen, sin link en navbar).
      Al publicar: quitar `noIndex` de `/blog` y `/en/blog`, crear página de post y añadir link.
- [ ] Testimonios de clientes.

## Mejoras

- [ ] Light theme (dark only en v1).
- [ ] Vercel Analytics / Speed Insights.

## Performance mobile (gap conocido, medido en auditoría v1)

Lighthouse v1: **mobile 61 · desktop 85** en perf (resto 100/100/100 en ambos; CLS 0, LCP desktop 0.6s).

- El TBT mobile (~2s bajo throttle simulado 4x) es **layout/text-shaping del DOM SSR completo**, no JS:
  el grafo de módulos ya se difiere a idle, los inits hacen yield entre tareas y los recursos son
  mínimos (CSS 13 KB, JS ~130 KB). Probado y descartado: `content-visibility: auto` (empeora).
- [ ] El boot overlay cuesta ~8 pts en desktop (85 → 93 sin él, mobile igual). Decidir si en una
      iteración se acorta más o se elimina (hoy es decisión de diseño aprobada).
- [ ] Reducir el DOM inicial del home (p. ej. diferir secciones bajo el fold a islands/fragmentos)
      si se quiere perseguir ≥90 mobile.
