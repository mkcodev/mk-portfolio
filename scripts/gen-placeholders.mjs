// Placeholders estilizados 1440×900 para cards de proyecto (hasta tener screenshots reales).
// Uso: node scripts/gen-placeholders.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = 'src/assets/projects';
mkdirSync(OUT, { recursive: true });

const projects = [
  { slug: 'geko-marketing', title: 'Geko Marketing', domain: 'geko-marketing.com', year: '2026' },
  { slug: 'total-muscle', title: 'Total Muscle', domain: 'total-muscle.app', year: '2026' },
  { slug: 'discobar-zulu', title: 'Discobar Zulu', domain: 'discobarzulu.com', year: '2023' },
  { slug: 'duchas-infin', title: 'Duchas Infin', domain: 'duchasinfin.com', year: '2023' },
  {
    slug: 'sumilleres-zamora',
    title: 'Sumilleres Zamora',
    domain: 'sumillereszamora.es',
    year: '2024',
  },
  {
    slug: 'electricidad-diego',
    title: 'Electricidad Diego',
    domain: 'electricidad-diego.dev',
    year: '2024',
  },
];

const W = 1440;
const H = 900;

function svg({ title, domain, year }, i) {
  const glowX = [280, 1160, 720, 280, 1160, 720][i % 6];
  const glowY = [220, 640, 180, 680, 240, 700][i % 6];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#00DBD5" stop-opacity="0.10"/>
      <stop offset="1" stop-color="#00DBD5" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#00DBD5" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="#0E1515"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <circle cx="${glowX}" cy="${glowY}" r="420" fill="url(#g)"/>
  <!-- chrome -->
  <rect width="${W}" height="64" fill="#131C1C"/>
  <circle cx="36" cy="32" r="7" fill="#ffffff" fill-opacity="0.18"/>
  <circle cx="62" cy="32" r="7" fill="#ffffff" fill-opacity="0.12"/>
  <circle cx="88" cy="32" r="7" fill="#ffffff" fill-opacity="0.12"/>
  <rect x="420" y="16" width="600" height="32" rx="8" fill="#0A0F0F"/>
  <text x="720" y="37" text-anchor="middle" font-family="monospace" font-size="16" fill="#9B9B9B">https://${domain}</text>
  <!-- contenido -->
  <text x="120" y="400" font-family="monospace" font-size="22" fill="#00DBD5">&gt; open ${domain}</text>
  <text x="116" y="480" font-family="Arial, sans-serif" font-size="64" font-weight="700" fill="#FFFFFF" letter-spacing="-1">${title}</text>
  <text x="120" y="540" font-family="monospace" font-size="20" fill="#9B9B9B">${year} · screenshot [PENDIENTE]</text>
  <rect x="120" y="580" width="56" height="4" fill="#00DBD5"/>
  <text x="${W - 48}" y="${H - 40}" text-anchor="end" font-family="monospace" font-size="16" fill="#005855">mkcodev</text>
</svg>
`;
}

projects.forEach((p, i) => {
  writeFileSync(`${OUT}/${p.slug}.svg`, svg(p, i));
  console.log(`ok → ${OUT}/${p.slug}.svg`);
});
