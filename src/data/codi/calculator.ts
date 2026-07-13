export type AnimationTier = 'none' | 'basic' | 'premium' | 'cinematic';

export interface CalcFeature {
  id: string;
  label: { es: string; en: string };
  priceAdd: number;
  weeksAdd: number;
}

export interface CalcSeed {
  base: 'landing' | 'corporate' | 'ecommerce' | 'fullstack';
  features: string[];
  animations: AnimationTier;
}

export interface CalcResult {
  minPrice: number;
  maxPrice: number;
  minWeeks: number;
  maxWeeks: number;
}

export const BASE_PRICES: Record<CalcSeed['base'], { min: number; max: number; minW: number; maxW: number }> = {
  landing:   { min: 800,  max: 1200, minW: 1, maxW: 2 },
  corporate: { min: 1500, max: 2500, minW: 3, maxW: 5 },
  ecommerce: { min: 2500, max: 4000, minW: 4, maxW: 7 },
  fullstack: { min: 4000, max: 8000, minW: 6, maxW: 12 },
};

export const ANIMATION_MODIFIERS: Record<AnimationTier, { price: number; weeks: number }> = {
  none:      { price: 0,    weeks: 0 },
  basic:     { price: 200,  weeks: 0.5 },
  premium:   { price: 800,  weeks: 1.5 },
  cinematic: { price: 2000, weeks: 3 },
};

export const FEATURES: CalcFeature[] = [
  {
    id: 'blog',
    label: { es: 'Blog', en: 'Blog' },
    priceAdd: 400,
    weeksAdd: 1,
  },
  {
    id: 'i18n',
    label: { es: 'Multiidioma (i18n)', en: 'Multilingual (i18n)' },
    priceAdd: 500,
    weeksAdd: 1,
  },
  {
    id: 'admin',
    label: { es: 'Panel de administración', en: 'Admin panel' },
    priceAdd: 800,
    weeksAdd: 1.5,
  },
  {
    id: 'seo',
    label: { es: 'SEO técnico avanzado', en: 'Advanced technical SEO' },
    priceAdd: 300,
    weeksAdd: 0.5,
  },
  {
    id: 'analytics',
    label: { es: 'Analytics / GA4', en: 'Analytics / GA4' },
    priceAdd: 150,
    weeksAdd: 0.25,
  },
  {
    id: 'contact',
    label: { es: 'Formulario de contacto', en: 'Contact form' },
    priceAdd: 100,
    weeksAdd: 0.25,
  },
];

export function calculate(seed: CalcSeed): CalcResult {
  const base = BASE_PRICES[seed.base];
  const animMod = ANIMATION_MODIFIERS[seed.animations];

  const featurePrice = seed.features.reduce((acc, id) => {
    const f = FEATURES.find((x) => x.id === id);
    return acc + (f?.priceAdd ?? 0);
  }, 0);

  const featureWeeks = seed.features.reduce((acc, id) => {
    const f = FEATURES.find((x) => x.id === id);
    return acc + (f?.weeksAdd ?? 0);
  }, 0);

  return {
    minPrice: base.min + animMod.price + featurePrice,
    maxPrice: base.max + animMod.price + featurePrice,
    minWeeks: Math.ceil(base.minW + animMod.weeks + featureWeeks),
    maxWeeks: Math.ceil(base.maxW + animMod.weeks + featureWeeks),
  };
}
