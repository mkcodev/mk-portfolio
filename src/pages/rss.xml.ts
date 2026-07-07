import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE, SITE_URL } from '../data/site';

export const GET: APIRoute = async (context) => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime(),
  );

  return rss({
    title: `${SITE.name} — blog`,
    description: SITE.tagline.es,
    site: context.site ?? SITE_URL,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `${post.data.lang === 'es' ? '' : '/en'}/blog/${post.id}`,
    })),
    customData: '<language>es-ES</language>',
  });
};
