import type { Lang } from '../site';

export interface Service {
  id: string;
  name: Record<Lang, string>;
  description: Record<Lang, string>;
  priceRange: string;
  weeks: string;
  tags: string[];
}

export interface FAQ {
  keywords: string[];
  answer: Record<Lang, string>;
}

export const KNOWLEDGE = {
  owner: {
    name: 'Mikel Salvador García',
    handle: 'mkcodev',
    role: { es: 'Full Stack Developer', en: 'Full Stack Developer' },
    location: 'Bilbao, Spain',
    email: 'info@mkcodev.com',
    whatsapp: '[PENDIENTE: confirmar si es público]',
    linkedin: 'https://www.linkedin.com/in/mkcodev',
    github: 'https://github.com/mkcodev',
    education: {
      es: 'Bootcamp Full Stack en 4Geeks Academy (360h)',
      en: 'Full Stack Bootcamp at 4Geeks Academy (360h)',
    },
    stack: ['Next.js', 'Astro', 'TypeScript', 'React', 'Tailwind CSS', 'GSAP', 'Framer Motion', 'Python', 'Flask'],
    availability: '[PENDIENTE: semanas hasta poder arrancar]',
    calendlyUrl: '[PENDIENTE: URL de Calendly]',
  },

  services: [
    {
      id: 'landing',
      name: { es: 'Landing page', en: 'Landing page' },
      description: {
        es: 'Página de aterrizaje de alta conversión, estática, carga ultrarrápida y SEO técnico incluido.',
        en: 'High-conversion landing page, static, ultra-fast load and technical SEO included.',
      },
      priceRange: '[PENDIENTE: confirmar rango]',
      weeks: '1-2',
      tags: ['astro', 'next.js', 'seo', 'performance'],
    },
    {
      id: 'corporate',
      name: { es: 'Web corporativa', en: 'Corporate website' },
      description: {
        es: 'Web completa para empresa o profesional, diseño a medida, multiidioma opcional.',
        en: 'Full website for a business or professional, custom design, optional multilingual.',
      },
      priceRange: '[PENDIENTE: confirmar rango]',
      weeks: '3-5',
      tags: ['astro', 'next.js', 'design', 'seo'],
    },
    {
      id: 'animated',
      name: { es: 'Web con animaciones custom', en: 'Website with custom animations' },
      description: {
        es: 'Web corporativa o landing con animaciones GSAP/Framer Motion de nivel Awwwards.',
        en: 'Corporate site or landing with Awwwards-level GSAP/Framer Motion animations.',
      },
      priceRange: '[PENDIENTE: confirmar rango]',
      weeks: '4-7',
      tags: ['gsap', 'framer-motion', 'premium', 'design'],
    },
    {
      id: 'ecommerce',
      name: { es: 'E-commerce', en: 'E-commerce' },
      description: {
        es: 'Tienda online con Next.js + Stripe. Carrito, pagos, gestión de productos.',
        en: 'Online store with Next.js + Stripe. Cart, payments, product management.',
      },
      priceRange: '[PENDIENTE: confirmar rango]',
      weeks: '5-8',
      tags: ['next.js', 'stripe', 'ecommerce'],
    },
    {
      id: 'fullstack',
      name: { es: 'App full stack', en: 'Full stack app' },
      description: {
        es: 'Aplicación web completa con backend propio (Node/Flask + API REST + DB).',
        en: 'Full web application with own backend (Node/Flask + REST API + DB).',
      },
      priceRange: '[PENDIENTE: confirmar rango]',
      weeks: '6-12',
      tags: ['next.js', 'flask', 'python', 'database', 'api'],
    },
    {
      id: 'maintenance',
      name: { es: 'Mantenimiento web', en: 'Web maintenance' },
      description: {
        es: 'Retención mensual: actualizaciones, mejoras, velocidad y soporte técnico.',
        en: 'Monthly retainer: updates, improvements, speed and technical support.',
      },
      priceRange: '[PENDIENTE: confirmar tarifas mensuales]',
      weeks: 'mensual/monthly',
      tags: ['support', 'updates', 'maintenance'],
    },
    {
      id: 'redesign',
      name: { es: 'Rediseño / rebranding', en: 'Redesign / rebranding' },
      description: {
        es: 'Rediseño completo de una web existente con nuevo diseño visual y stack moderno.',
        en: 'Full redesign of an existing website with new visual design and modern stack.',
      },
      priceRange: '[PENDIENTE: confirmar rango]',
      weeks: '3-6',
      tags: ['redesign', 'branding', 'ux'],
    },
    {
      id: 'seo',
      name: { es: 'SEO técnico', en: 'Technical SEO' },
      description: {
        es: 'Auditoría y optimización: Core Web Vitals, structured data, indexación, velocidad.',
        en: 'Audit and optimization: Core Web Vitals, structured data, indexing, speed.',
      },
      priceRange: '[PENDIENTE: confirmar tarifas]',
      weeks: '1-3',
      tags: ['seo', 'performance', 'analytics'],
    },
  ] satisfies Service[],

  pricing: {
    hourlyRate: '[PENDIENTE: confirmar €/hora]',
    paymentTerms: {
      es: '40% al firmar + 60% al entregar',
      en: '40% upfront + 60% on delivery',
    },
  },

  projects: [
    {
      slug: 'geko-marketing',
      comment: {
        es: 'Geko fue un reto interesante: agencia de marketing que necesitaba que la web vendiera por sí misma. Stack moderno, blog activo y pasarela de pago funcionando.',
        en: 'Geko was an interesting challenge: a marketing agency that needed their site to sell on its own. Modern stack, active blog and working payment flow.',
      },
    },
    {
      slug: 'total-muscle',
      comment: {
        es: 'Total Muscle fue el proyecto final del bootcamp — stack completo de base de datos a UI, con API REST propia y consumo de API externa.',
        en: 'Total Muscle was the bootcamp final project — full stack from database to UI, with its own REST API and external API integration.',
      },
    },
    {
      slug: 'discobar-zulu',
      comment: {
        es: 'Discobar Zulu: design system propio en Figma, animaciones GSAP/Framer Motion y SEO técnico para una sala de fiestas.',
        en: 'Discobar Zulu: custom design system in Figma, GSAP/Framer Motion animations and technical SEO for a nightclub.',
      },
    },
    {
      slug: 'duchas-infin',
      comment: {
        es: 'Web corporativa para el sector del baño, construida con Astro para máxima velocidad.',
        en: 'Corporate site for the bathroom industry, built with Astro for maximum speed.',
      },
    },
    {
      slug: 'sumilleres-zamora',
      comment: {
        es: 'Web para la asociación de sumilleres de Zamora, con WordPress y SEO local.',
        en: 'Website for the Zamora sommelier association, with WordPress and local SEO.',
      },
    },
    {
      slug: 'electricidad-diego',
      comment: {
        es: 'Web de servicios para electricista local: captación con foco en carga rápida y SEO local en Bilbao.',
        en: 'Services site for a local electrician: lead generation focused on fast loading and local SEO.',
      },
    },
  ],

  faqs: [
    {
      keywords: ['precio', 'price', 'cuánto', 'coste', 'cost', 'cuanto cuesta', 'how much'],
      answer: {
        es: 'Depende del proyecto. Una landing parte desde [PENDIENTE]€, una web corporativa entre [PENDIENTE]€, y proyectos con animaciones custom o full stack desde más. Cuéntame qué necesitas y te doy un rango real.',
        en: 'Depends on the project. A landing starts from [PENDIENTE]€, a corporate site between [PENDIENTE]€, and projects with custom animations or full stack from more. Tell me what you need and I\'ll give you a real range.',
      },
    },
    {
      keywords: ['tiempo', 'plazo', 'tiempo', 'cuánto tarda', 'how long', 'timeline', 'weeks'],
      answer: {
        es: 'Un landing se puede tener en 1-2 semanas. Una web corporativa 3-5. Un proyecto más complejo 6-12. Siempre doy rangos, nunca prometo fechas exactas hasta tener el brief completo.',
        en: 'A landing can be done in 1-2 weeks. A corporate site 3-5. A more complex project 6-12. I always give ranges, never promise exact dates until I have the full brief.',
      },
    },
    {
      keywords: ['wordpress', 'cms', 'contentful', 'sanity'],
      answer: {
        es: 'WordPress sirve para blogs simples. Para lo que probablemente describes, Astro o Next.js van a rendir 10x mejor: más rápido, más seguro, y sin plugins que romper. ¿Quieres que te lo explique?',
        en: 'WordPress works for simple blogs. For what you probably need, Astro or Next.js will perform 10x better: faster, more secure, and no plugins to break. Want me to explain?',
      },
    },
    {
      keywords: ['react', 'next', 'astro', 'vue', 'angular', 'framework', 'mejor framework'],
      answer: {
        es: 'Depende del caso. Astro para sites con poco JS, máxima velocidad. Next.js para apps con estado, SSR, o e-commerce. React solo cuando necesitas SPA pura. Angular solo si te lo imponen. ¿Qué estás construyendo?',
        en: 'Depends on the case. Astro for sites with minimal JS, max speed. Next.js for apps with state, SSR, or e-commerce. React only for pure SPAs. Angular only if imposed. What are you building?',
      },
    },
    {
      keywords: ['disponible', 'libre', 'cuando empieza', 'available', 'when can you start'],
      answer: {
        es: 'La disponibilidad varía. Escríbeme y te confirmo en cuánto podemos arrancar.',
        en: 'Availability varies. Drop me a message and I\'ll confirm how soon we can start.',
      },
    },
    {
      keywords: ['contrato', 'factura', 'invoice', 'contract', 'pago', 'payment'],
      answer: {
        es: 'Trabajo con contrato, presupuesto firmado y factura. El modelo es 40% al firmar + 60% al entregar. Para extras fuera de alcance, por hora.',
        en: 'I work with a contract, signed quote and invoice. The model is 40% upfront + 60% on delivery. For out-of-scope extras, hourly.',
      },
    },
    {
      keywords: ['bilbao', 'remoto', 'spain', 'españa', 'donde', 'where', 'location'],
      answer: {
        es: 'Estoy en Bilbao pero trabajo 100% remoto. He trabajado con clientes de toda España y fuera.',
        en: 'I\'m based in Bilbao but work 100% remotely. I\'ve worked with clients all over Spain and beyond.',
      },
    },
    {
      keywords: ['diseño', 'design', 'figma', 'ux', 'ui', 'mockup'],
      answer: {
        es: 'Sí, incluyo diseño. Trabajo con Figma para wireframes y prototipos antes de entrar en código. Si tienes diseño propio también lo implemento.',
        en: 'Yes, I include design. I work with Figma for wireframes and prototypes before coding. If you have your own design I can implement it too.',
      },
    },
  ] satisfies FAQ[],
} as const;

export type Knowledge = typeof KNOWLEDGE;
