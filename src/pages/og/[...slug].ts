import { OGImageRoute } from 'astro-og-canvas';
import { SITE } from '../../data/site';
import { flagships } from '../../data/projects';

interface OGPage {
  title: string;
  description: string;
}

const pages: Record<string, OGPage> = {
  home: { title: SITE.author, description: SITE.tagline.es },
  'home-en': { title: SITE.author, description: SITE.tagline.en },
  uses: { title: '~/uses', description: `Setup y herramientas de ${SITE.author}` },
  'uses-en': { title: '~/uses', description: `${SITE.author}'s setup and tools` },
  ...Object.fromEntries(
    flagships.flatMap((p) => [
      [p.slug, { title: `${p.title} — case study`, description: p.description.es }],
      [`${p.slugEn}-en`, { title: `${p.title} — case study`, description: p.description.en }],
    ]),
  ),
};

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getSlug: (path) => `${path}.png`,
  getImageOptions: (_path, page: OGPage) => ({
    title: page.title,
    description: page.description,
    bgGradient: [
      [10, 15, 15],
      [7, 11, 11],
    ],
    border: { color: [0, 219, 213], width: 10, side: 'block-end' },
    padding: 72,
    logo: { path: './src/assets/logo-mkcodev.png', size: [96] },
    font: {
      title: {
        families: ['Space Grotesk'],
        weight: 'Bold',
        size: 72,
        color: [230, 241, 240],
      },
      description: {
        families: ['JetBrains Mono'],
        size: 32,
        lineHeight: 1.5,
        color: [138, 160, 158],
      },
    },
    fonts: [
      'https://api.fontsource.org/v1/fonts/space-grotesk/latin-700-normal.ttf',
      'https://api.fontsource.org/v1/fonts/jetbrains-mono/latin-400-normal.ttf',
    ],
  }),
});
