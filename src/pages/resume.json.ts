import type { APIRoute } from 'astro';
import { SITE, SITE_URL } from '../data/site';
import { projects } from '../data/projects';
import { certs } from '../data/certs';
import { timeline } from '../data/timeline';

// Formato JSON Resume — https://jsonresume.org/schema
export const GET: APIRoute = () => {
  const resume = {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: {
      name: SITE.author,
      label: SITE.role.es,
      email: SITE.email,
      url: SITE_URL,
      summary: SITE.tagline.es,
      location: { city: 'Bilbao', countryCode: 'ES' },
      profiles: [
        { network: 'GitHub', username: 'mkcodev', url: SITE.github },
        { network: 'LinkedIn', username: 'mkcodev', url: SITE.linkedin },
      ],
    },
    projects: projects.map((p) => ({
      name: p.title,
      description: p.description.es,
      keywords: [...p.stack],
      startDate: p.year.slice(0, 4),
      ...(p.url ? { url: p.url } : {}),
    })),
    certificates: certs
      .filter((c) => !c.inProgress)
      .map((c) => ({
        name: c.name,
        issuer: c.issuer,
        ...(c.year ? { date: c.year } : {}),
        ...(c.verifyUrl ? { url: c.verifyUrl } : {}),
      })),
    skills: [
      { name: 'Frontend', keywords: ['React', 'Next.js', 'Astro', 'TypeScript', 'Tailwind CSS'] },
      { name: 'Animación', keywords: ['GSAP', 'Framer Motion', 'Lenis', 'View Transitions'] },
      { name: 'Backend', keywords: ['Python', 'Flask', 'Node.js', 'SQL'] },
      { name: 'SEO y Performance', keywords: ['SEO técnico', 'Core Web Vitals', 'Lighthouse'] },
      { name: 'Diseño', keywords: ['Figma', 'Adobe', 'Design systems'] },
    ],
    languages: [
      { language: 'Español', fluency: 'Nativo' },
      { language: 'Inglés', fluency: 'Profesional' },
    ],
    // Trayectoria como git log — misma fuente que la sección timeline
    meta: {
      canonical: `${SITE_URL}/resume.json`,
      timeline: timeline.map((c) => `${c.year} · ${c.message.es}`),
    },
  };

  return new Response(JSON.stringify(resume, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
