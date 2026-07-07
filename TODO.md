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
- [ ] Testimonios de clientes.

## Mejoras

- [ ] Light theme (dark only en v1).
- [ ] Vercel Analytics / Speed Insights.
