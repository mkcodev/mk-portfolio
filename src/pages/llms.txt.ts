import type { APIRoute } from 'astro';
import { SITE, SITE_URL } from '../data/site';
import { projects } from '../data/projects';
import { certs } from '../data/certs';

export const GET: APIRoute = () => {
  const projectLines = projects.map((p) => {
    const link = p.caseStudy ? `${SITE_URL}/proyectos/${p.slug}` : (p.url ?? '');
    const label = link ? `[${p.title}](${link})` : p.title;
    return `- ${label} (${p.year}): ${p.description.es} Stack: ${p.stack.join(', ')}.`;
  });

  const certLines = certs
    .filter((c) => !c.inProgress)
    .map((c) => `- ${c.name} — ${c.issuer}${c.year ? ` (${c.year})` : ''}`);

  const body = `# ${SITE.name} — ${SITE.author}

> ${SITE.role.es}. ${SITE.tagline.es} Basado en ${SITE.location}. Abierto a nuevas oportunidades.

Portfolio personal construido con Astro, TypeScript, Tailwind CSS v4, GSAP y Lenis.
Bilingüe: español (por defecto) e inglés bajo /en.

## Proyectos

${projectLines.join('\n')}

## Formación

${certLines.join('\n')}

## Páginas

- [Home](${SITE_URL}/): presentación, proyectos, trayectoria y contacto
- [~/uses](${SITE_URL}/uses): setup y herramientas
- [CV en PDF](${SITE_URL}${SITE.cvPath})
- [resume.json](${SITE_URL}/resume.json): CV en formato JSON Resume

## Contacto

- Email: ${SITE.email}
- GitHub: ${SITE.github}
- LinkedIn: ${SITE.linkedin}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
