import { useEffect, useMemo, useRef, useState } from 'react';
import { navigate } from 'astro:transitions/client';
import { SITE, type Lang } from '../../data/site';
import { alternatePath } from '../../i18n/routes';
import { projects } from '../../data/projects';
import './CommandPalette.css';

interface Props {
  lang: Lang;
}

interface Cmd {
  id: string;
  group: string;
  label: string;
  kbd?: string;
  keywords?: string;
  run: () => void | Promise<void>;
}

const STRINGS = {
  es: {
    placeholder: 'escribe un comando o busca…',
    label: 'Paleta de comandos',
    empty: 'nada por aquí — prueba otra cosa',
    nav: 'ir a',
    pages: 'páginas',
    actions: 'acciones',
    copied: '✓ copiado al portapapeles',
    footer: ['↑↓ navegar', '↵ ejecutar', 'esc cerrar'],
  },
  en: {
    placeholder: 'type a command or search…',
    label: 'Command palette',
    empty: 'nothing here — try something else',
    nav: 'go to',
    pages: 'pages',
    actions: 'actions',
    copied: '✓ copied to clipboard',
    footer: ['↑↓ navigate', '↵ run', 'esc close'],
  },
} as const;

/** Subsecuencia fuzzy simple: todas las letras de q aparecen en orden en text. */
function fuzzyMatch(q: string, text: string): boolean {
  const query = q.toLowerCase();
  const target = text.toLowerCase();
  let i = 0;
  for (const ch of target) {
    if (ch === query[i]) i += 1;
    if (i >= query.length) return true;
  }
  return query.length === 0;
}

function goTo(href: string, home: string): void {
  const [path, hash] = href.split('#');
  const current = window.location.pathname.replace(/\/+$/, '') || '/';
  if (hash && (path === '' || path === home || (home === '/' && path === '/'))) {
    if (current === (home === '/' ? '/' : home)) {
      window.dispatchEvent(new CustomEvent('mk:scrollto', { detail: `#${hash}` }));
      return;
    }
  }
  void navigate(href);
}

function buildCommands(lang: Lang, onCopy: () => void): Cmd[] {
  const s = STRINGS[lang];
  const home = lang === 'es' ? '/' : '/en';
  const homePrefix = lang === 'es' ? '' : '/en';

  const sections: Array<[string, string, string]> = [
    ['proyectos', lang === 'es' ? 'proyectos' : 'projects', 'g p'],
    ['como-trabajo', lang === 'es' ? 'cómo trabajo' : 'how I work', 'g w'],
    ['trayectoria', 'git log', 'g t'],
    ['sobre-mi', lang === 'es' ? 'sobre mí' : 'about', 'g a'],
    ['contacto', lang === 'es' ? 'contacto' : 'contact', 'g c'],
  ];

  const caseStudies = projects.filter((p) => p.caseStudy);

  return [
    ...sections.map(
      ([id, label, kbd]): Cmd => ({
        id: `nav-${id}`,
        group: s.nav,
        label,
        kbd,
        run: () => goTo(`${home}#${id}`, home),
      }),
    ),
    ...caseStudies.map(
      (p): Cmd => ({
        id: `page-${p.slug}`,
        group: s.pages,
        label: `${p.title} — case study`,
        run: () =>
          void navigate(
            lang === 'es' ? `/proyectos/${p.slug}` : `/en/projects/${p.slugEn}`,
          ),
      }),
    ),
    {
      id: 'page-uses',
      group: s.pages,
      label: '~/uses',
      kbd: 'g u',
      keywords: 'setup tools herramientas',
      run: () => void navigate(`${homePrefix}/uses`),
    },
    {
      id: 'act-lang',
      group: s.actions,
      label: lang === 'es' ? 'switch to English' : 'cambiar a español',
      keywords: 'language idioma toggle',
      run: () => window.location.assign(alternatePath(window.location.pathname)),
    },
    {
      id: 'act-email',
      group: s.actions,
      label: lang === 'es' ? `copiar email — ${SITE.email}` : `copy email — ${SITE.email}`,
      keywords: 'mail contacto contact',
      run: async () => {
        await navigator.clipboard.writeText(SITE.email);
        onCopy();
      },
    },
    {
      id: 'act-cv',
      group: s.actions,
      label: lang === 'es' ? 'descargar CV.pdf' : 'download resume.pdf',
      keywords: 'resume curriculum',
      run: () => window.location.assign(SITE.cvPath),
    },
    {
      id: 'act-github',
      group: s.actions,
      label: 'GitHub ↗',
      run: () => {
        window.open(SITE.github, '_blank', 'noopener');
      },
    },
    {
      id: 'act-linkedin',
      group: s.actions,
      label: 'LinkedIn ↗',
      run: () => {
        window.open(SITE.linkedin, '_blank', 'noopener');
      },
    },
  ];
}

export default function CommandPalette({ lang }: Props) {
  const s = STRINGS[lang];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const close = () => {
    setOpen(false);
    setQuery('');
    setSelected(0);
    setCopied(false);
  };

  const commands = useMemo(
    () =>
      buildCommands(lang, () => {
        setCopied(true);
        window.setTimeout(() => {
          setCopied(false);
          setOpen(false);
          setQuery('');
          setSelected(0);
        }, 900);
      }),
    [lang],
  );

  const filtered = useMemo(
    () => commands.filter((c) => fuzzyMatch(query, `${c.label} ${c.keywords ?? ''}`)),
    [commands, query],
  );

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('mk:palette', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mk:palette', onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector('[aria-selected="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  if (!open) return null;

  const runCmd = (cmd: Cmd) => {
    void cmd.run();
    if (cmd.id !== 'act-email') close();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filtered[selected];
      if (cmd) runCmd(cmd);
    } else if (e.key === 'Tab') {
      e.preventDefault();
    }
  };

  let lastGroup = '';

  return (
    <div className="cp-backdrop" onClick={close} role="presentation">
      <div
        className="cp glass"
        role="dialog"
        aria-modal="true"
        aria-label={s.label}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cp-input-row">
          <span className="cp-prompt" aria-hidden="true">
            &gt;
          </span>
          <input
            ref={inputRef}
            className="cp-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={s.placeholder}
            aria-label={s.label}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <kbd className="cp-kbd">esc</kbd>
        </div>

        {copied ? (
          <p className="cp-copied" role="status">
            {s.copied}
          </p>
        ) : (
          <ul className="cp-list" ref={listRef} role="listbox" aria-label={s.label}>
            {filtered.length === 0 && <li className="cp-empty">{s.empty}</li>}
            {filtered.map((cmd, i) => {
              const showGroup = cmd.group !== lastGroup;
              lastGroup = cmd.group;
              return (
                <li key={cmd.id}>
                  {showGroup && (
                    <p className="cp-group" aria-hidden="true">
                      // {cmd.group}
                    </p>
                  )}
                  <button
                    type="button"
                    className="cp-item"
                    role="option"
                    aria-selected={i === selected}
                    onMouseEnter={() => setSelected(i)}
                    onClick={() => runCmd(cmd)}
                  >
                    <span className="cp-item-label">{cmd.label}</span>
                    {cmd.kbd && <kbd className="cp-kbd">{cmd.kbd}</kbd>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="cp-footer" aria-hidden="true">
          {s.footer.map((hint) => (
            <span key={hint}>{hint}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
