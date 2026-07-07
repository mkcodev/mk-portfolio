import type { Lang } from './site';

export interface UsesItem {
  name: string;
  detail?: Record<Lang, string>;
  url?: string;
}

export interface UsesCategory {
  id: string;
  title: Record<Lang, string>;
  items: UsesItem[];
}

export const uses: UsesCategory[] = [
  {
    id: 'os',
    title: { es: 'Sistema', en: 'System' },
    items: [
      {
        name: 'Arch Linux',
        detail: {
          es: 'daily driver desde hace años; también Ubuntu, Manjaro, Void, Gentoo, Parrot, Kali',
          en: 'daily driver for years; also Ubuntu, Manjaro, Void, Gentoo, Parrot, Kali',
        },
      },
      {
        name: 'bspwm · Hyprland · newm',
        detail: {
          es: 'window managers a medida, entorno 100% automatizado',
          en: 'custom window managers, fully automated environment',
        },
      },
    ],
  },
  {
    id: 'terminal',
    title: { es: 'Terminal y CLI', en: 'Terminal & CLI' },
    items: [
      {
        name: 'Dotfiles propios',
        detail: {
          es: 'configuración versionada: shell, WM, editor, scripts',
          en: 'versioned config: shell, WM, editor, scripts',
        },
        url: 'https://github.com/mkcodev',
      },
      {
        name: 'Atajos estilo vim',
        detail: {
          es: 'vim motions en todo: editor, navegador, WM',
          en: 'vim motions everywhere: editor, browser, WM',
        },
      },
      {
        name: 'Herramientas CLI a medida',
        detail: {
          es: 'scripts propios para automatizar el flujo diario',
          en: 'own scripts automating the daily workflow',
        },
      },
    ],
  },
  {
    id: 'editor',
    title: { es: 'Editor', en: 'Editor' },
    items: [
      {
        name: 'VS Code + vim keybindings',
        detail: {
          es: 'con Claude Code integrado en el flujo diario',
          en: 'with Claude Code integrated into the daily flow',
        },
      },
    ],
  },
  {
    id: 'ai',
    title: { es: 'IA', en: 'AI' },
    items: [
      {
        name: 'Claude Code',
        detail: {
          es: 'desarrollo asistido por IA; certificaciones de Anthropic',
          en: 'AI-assisted development; Anthropic certifications',
        },
      },
      {
        name: 'Early adopter',
        detail: {
          es: 'ChatGPT desde la beta, Midjourney desde Discord',
          en: 'ChatGPT since beta, Midjourney since Discord',
        },
      },
    ],
  },
  {
    id: 'design',
    title: { es: 'Diseño', en: 'Design' },
    items: [{ name: 'Figma' }, { name: 'Photoshop · Illustrator · After Effects' }],
  },
  {
    id: 'hardware',
    title: { es: 'Hardware', en: 'Hardware' },
    items: [
      {
        name: '[PENDIENTE]',
        detail: {
          es: 'lista de hardware por completar',
          en: 'hardware list to be completed',
        },
      },
    ],
  },
];
