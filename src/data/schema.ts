// Builders de JSON-LD (schema.org). Un único @graph por página con nodos
// conectados por @id: Person ←→ ProfessionalService ←→ WebSite ← WebPage.
// Base.astro incluye los tres nodos base y cada página aporta los suyos
// vía el prop `schema` (webPage, breadcrumbs, service, faq, blogPosting…).
import { SITE, SITE_URL, type Lang } from './site';
import { certs } from './certs';

export type SchemaNode = Record<string, unknown>;

export const PERSON_ID = `${SITE_URL}/#person`;
export const BUSINESS_ID = `${SITE_URL}/#business`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

const postalAddress = {
  '@type': 'PostalAddress',
  addressLocality: SITE.addressLocality,
  addressRegion: SITE.addressRegion,
  addressCountry: 'ES',
};

export function personNode(): SchemaNode {
  const credentials = certs
    .filter((c) => !c.inProgress)
    .map((c) => ({
      '@type': 'EducationalOccupationalCredential',
      name: c.name,
      recognizedBy: { '@type': 'Organization', name: c.issuer },
      ...(c.verifyUrl ? { url: c.verifyUrl } : {}),
    }));

  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: SITE.author,
    alternateName: SITE.name,
    jobTitle: 'Full Stack Developer',
    email: `mailto:${SITE.email}`,
    telephone: SITE.phone,
    url: SITE_URL,
    sameAs: [SITE.github, SITE.linkedin],
    address: postalAddress,
    worksFor: { '@id': BUSINESS_ID },
    hasCredential: credentials,
    knowsAbout: [
      'React',
      'Next.js',
      'Astro',
      'TypeScript',
      'SEO',
      'SEO local',
      'Web Performance',
      'Diseño web',
      'E-commerce',
      'Automatización con IA',
      'Python',
      'Flask',
    ],
  };
}

export function professionalServiceNode(): SchemaNode {
  return {
    '@type': ['ProfessionalService', 'LocalBusiness'],
    '@id': BUSINESS_ID,
    name: SITE.name,
    description:
      'Diseño y desarrollo web, tiendas online, SEO, mantenimiento, soluciones de IA y marca personal para negocios de Bilbao, el Gran Bilbao y Zamora.',
    url: SITE_URL,
    telephone: SITE.phone,
    email: SITE.email,
    image: `${SITE_URL}/favicon.png`,
    priceRange: '€€',
    address: postalAddress,
    areaServed: SITE.areaServed.map((name) => ({ '@type': 'City', name })),
    founder: { '@id': PERSON_ID },
  };
}

export function websiteNode(lang: Lang): SchemaNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE.name,
    url: SITE_URL,
    inLanguage: lang === 'es' ? 'es-ES' : 'en-US',
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
  };
}

interface WebPageOpts {
  url: string;
  title: string;
  description: string;
  lang: Lang;
  /** Marca la página como "sobre el negocio" (ubicaciones, servicios). */
  aboutBusiness?: boolean;
}

export function webPageNode(opts: WebPageOpts): SchemaNode {
  return {
    '@type': 'WebPage',
    '@id': `${opts.url}#webpage`,
    url: opts.url,
    name: opts.title,
    description: opts.description,
    inLanguage: opts.lang === 'es' ? 'es-ES' : 'en-US',
    isPartOf: { '@id': WEBSITE_ID },
    ...(opts.aboutBusiness ? { about: { '@id': BUSINESS_ID } } : {}),
  };
}

export function breadcrumbList(items: ReadonlyArray<{ name: string; url: string }>): SchemaNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqPageNode(faqs: ReadonlyArray<{ q: string; a: string }>): SchemaNode {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };
}

interface BlogPostingOpts {
  url: string;
  headline: string;
  description: string;
  datePublished: Date;
  dateModified?: Date;
  image?: string;
}

export function blogPostingNode(opts: BlogPostingOpts): SchemaNode {
  return {
    '@type': 'BlogPosting',
    '@id': `${opts.url}#article`,
    headline: opts.headline,
    description: opts.description,
    url: opts.url,
    datePublished: opts.datePublished.toISOString(),
    dateModified: (opts.dateModified ?? opts.datePublished).toISOString(),
    inLanguage: 'es-ES',
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
    mainEntityOfPage: { '@id': `${opts.url}#webpage` },
    ...(opts.image ? { image: opts.image } : {}),
  };
}
