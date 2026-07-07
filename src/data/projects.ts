import type { Lang } from './site';

type Localized = Record<Lang, string>;

export interface CaseStudySection {
  problema: Localized;
  stack: Localized;
  decisiones: Localized[];
  resultado: Localized;
  /** Métricas REALES únicamente. '[PENDIENTE]' hasta tener el dato. */
  metricas: { label: Localized; value: string }[];
}

export interface Project {
  slug: string;
  slugEn: string;
  title: string;
  year: string;
  description: Localized;
  stack: string[];
  url?: string;
  repo?: string;
  flagship: boolean;
  caseStudy?: CaseStudySection;
}

export const projects: Project[] = [
  {
    slug: 'geko-marketing',
    slugEn: 'geko-marketing',
    title: 'Geko Marketing',
    year: '2026 — presente',
    description: {
      es: 'Web de agencia de marketing con blog con comentarios, pagos con Stripe, landings y animaciones a medida.',
      en: 'Marketing agency site with commented blog, Stripe payments, landing pages and custom animations.',
    },
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'GSAP', 'Stripe'],
    url: 'https://geko-marketing.com',
    flagship: true,
    caseStudy: {
      problema: {
        es: 'Una agencia de marketing necesitaba una web que vendiera por sí misma: rápida, animada con gusto y con blog, pagos y landings gestionables sin CMS pesado.',
        en: 'A marketing agency needed a site that sells on its own: fast, tastefully animated, with a blog, payments and landing pages — without a heavy CMS.',
      },
      stack: {
        es: 'Next.js (App Router, static export) + TypeScript strict + Tailwind CSS v4 + Framer Motion/GSAP + Lenis + Stripe.',
        en: 'Next.js (App Router, static export) + strict TypeScript + Tailwind CSS v4 + Framer Motion/GSAP + Lenis + Stripe.',
      },
      decisiones: [
        {
          es: 'Static export para hosting barato y TTFB mínimo; toda la interactividad en islas client bien delimitadas.',
          en: 'Static export for cheap hosting and minimal TTFB; all interactivity in well-scoped client islands.',
        },
        {
          es: 'Sistema de animación centralizado (lib/animations.ts): easings y duraciones compartidas, useReducedMotion en todos los componentes animados.',
          en: 'Centralized animation system (lib/animations.ts): shared easings and durations, useReducedMotion in every animated component.',
        },
        {
          es: 'RSC/Client split estricto: metadata y contenido en Server Components, interacción en leafs client.',
          en: 'Strict RSC/Client split: metadata and content in Server Components, interaction in client leaves.',
        },
      ],
      resultado: {
        es: 'Web en producción para captación de clientes de la agencia, con blog activo y pasarela de pago operativa.',
        en: 'Site in production driving the agency’s client acquisition, with an active blog and a working payment flow.',
      },
      metricas: [
        {
          label: { es: 'Lighthouse Performance', en: 'Lighthouse Performance' },
          value: '[PENDIENTE]',
        },
        { label: { es: 'Lighthouse SEO', en: 'Lighthouse SEO' }, value: '[PENDIENTE]' },
      ],
    },
  },
  {
    slug: 'total-muscle',
    slugEn: 'total-muscle',
    title: 'Total Muscle',
    year: '2026',
    description: {
      es: 'App de gestión de gimnasio: API REST propia con Flask + SQLAlchemy y frontend React. Proyecto final de 4Geeks.',
      en: 'Gym management app: own REST API with Flask + SQLAlchemy and a React frontend. 4Geeks final project.',
    },
    stack: ['React', 'Flask', 'Python', 'SQLAlchemy', 'REST API'],
    repo: 'https://github.com/mkcodev',
    flagship: true,
    caseStudy: {
      problema: {
        es: 'Digitalizar la operativa de un gimnasio: usuarios, clases y reservas, integrando además datos de una API externa.',
        en: 'Digitize a gym’s operations: users, classes and bookings, also integrating data from an external API.',
      },
      stack: {
        es: 'React + Context en el frontend; Flask + SQLAlchemy en el backend con API REST propia y consumo de API externa.',
        en: 'React + Context on the frontend; Flask + SQLAlchemy on the backend with an own REST API plus an external API.',
      },
      decisiones: [
        {
          es: 'Modelado relacional con SQLAlchemy: entidades y relaciones definidas antes de escribir endpoints.',
          en: 'Relational modeling with SQLAlchemy: entities and relations defined before writing endpoints.',
        },
        {
          es: 'API REST propia versionada y separada del consumo de la API externa, para poder evolucionar cada lado por separado.',
          en: 'Own versioned REST API kept separate from the external API integration so each side can evolve independently.',
        },
      ],
      resultado: {
        es: 'Proyecto final del bootcamp Full Stack de 4Geeks Academy (360h): stack completo demostrado de base de datos a UI.',
        en: 'Final project of the 4Geeks Academy Full Stack bootcamp (360h): full stack demonstrated from database to UI.',
      },
      metricas: [],
    },
  },
  {
    slug: 'discobar-zulu',
    slugEn: 'discobar-zulu',
    title: 'Discobar Zulu',
    year: '2023',
    description: {
      es: 'Web de sala de fiestas con design system propio en Figma, animaciones GSAP/Framer Motion y SEO técnico.',
      en: 'Nightclub website with its own Figma design system, GSAP/Framer Motion animations and technical SEO.',
    },
    stack: ['Astro', 'Figma', 'GSAP', 'Framer Motion', 'SEO'],
    url: 'https://discobarzulu.com',
    flagship: false,
  },
  {
    slug: 'duchas-infin',
    slugEn: 'duchas-infin',
    title: 'Duchas Infin',
    year: '2023',
    description: {
      es: 'Web corporativa para cliente del sector del baño, construida con Astro.',
      en: 'Corporate site for a bathroom-industry client, built with Astro.',
    },
    stack: ['Astro', 'TypeScript'],
    url: 'https://duchasinfin.com',
    flagship: false,
  },
  {
    slug: 'sumilleres-zamora',
    slugEn: 'sumilleres-zamora',
    title: 'Sumilleres Zamora',
    year: '2024',
    description: {
      es: 'Web para la asociación de sumilleres de Zamora, desarrollada con WordPress.',
      en: 'Website for the Zamora sommelier association, built with WordPress.',
    },
    stack: ['WordPress', 'SEO'],
    url: 'https://sumillereszamora.es',
    flagship: false,
  },
  {
    slug: 'electricidad-diego',
    slugEn: 'electricidad-diego',
    title: 'Electricidad Diego',
    year: '2024',
    description: {
      es: 'Web de servicios para electricista local: captación con foco en carga rápida y SEO local.',
      en: 'Services site for a local electrician: lead generation focused on fast loading and local SEO.',
    },
    stack: ['Next.js', 'Vercel'],
    url: 'https://electricidad-diego-velicias.vercel.app',
    flagship: false,
  },
];

export const flagships = projects.filter((p) => p.flagship);
