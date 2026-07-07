import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type SubmitEvent,
} from 'react';
import { projects } from '../../data/projects';
import { SITE, type Lang } from '../../data/site';
import './Terminal.css';

interface Props {
  lang: Lang;
}

interface TermLine {
  id: number;
  node: ReactNode;
}

const ASCII_M = String.raw`███╗   ███╗██╗  ██╗
████╗ ████║██║ ██╔╝
██╔████╔██║█████╔╝
██║╚██╔╝██║██╔═██╗
██║ ╚═╝ ██║██║  ██╗
╚═╝     ╚═╝╚═╝  ╚═╝`;

const STRINGS = {
  es: {
    title: 'mkcodev@arch — fish',
    inputLabel: 'Entrada de terminal',
    hint: "escribe 'help' para ver los comandos",
    helpRows: [
      ['help', 'esta ayuda'],
      ['ls projects', 'lista de proyectos'],
      ['cat about.txt', 'sobre mí'],
      ['neofetch', 'info del sistema'],
      ['sudo hire-me', 'contratar'],
      ['clear', 'limpiar terminal'],
    ],
    about: [
      'Full Stack Developer en Bilbao.',
      'Del diseño en Figma al deploy: React, Next.js, Astro y TypeScript.',
      'Antes: e-commerce, SEO técnico y diseño. Este portfolio es la demo.',
    ],
    lsFoot: '2 case studies en la sección proyectos ↓',
    sudoPass: '[sudo] password de mikel: ********',
    sudoOk: 'permiso concedido — canales abiertos:',
    sudoCv: 'descargar_cv.pdf',
    notFound: (cmd: string) => `fish: Unknown command: '${cmd}' — prueba 'help'`,
    statusRow: 'open to work',
  },
  en: {
    title: 'mkcodev@arch — fish',
    inputLabel: 'Terminal input',
    hint: "type 'help' to list commands",
    helpRows: [
      ['help', 'this help'],
      ['ls projects', 'project list'],
      ['cat about.txt', 'about me'],
      ['neofetch', 'system info'],
      ['sudo hire-me', 'hire me'],
      ['clear', 'clear terminal'],
    ],
    about: [
      'Full Stack Developer in Bilbao.',
      'From Figma design to deploy: React, Next.js, Astro and TypeScript.',
      'Background: e-commerce, technical SEO and design. This portfolio is the demo.',
    ],
    lsFoot: '2 case studies in the projects section ↓',
    sudoPass: '[sudo] password for mikel: ********',
    sudoOk: 'permission granted — open channels:',
    sudoCv: 'download_cv.pdf',
    notFound: (cmd: string) => `fish: Unknown command: '${cmd}' — try 'help'`,
    statusRow: 'open to work',
  },
} as const;

function Prompt({ cmd }: { cmd?: string }) {
  return (
    <span className="term-prompt-line">
      <span className="term-accent">mkcodev@arch</span>
      <span className="term-dim">&nbsp;~&gt;&nbsp;</span>
      {cmd !== undefined && <span>{cmd}</span>}
    </span>
  );
}

function Neofetch({ lang }: { lang: Lang }) {
  const s = STRINGS[lang];
  const rows: ReadonlyArray<readonly [string, string]> = [
    ['OS', 'Arch Linux (btw)'],
    ['Shell', 'fish'],
    ['Editor', 'nvim'],
    ['Stack', 'React · Next.js · Astro · TS'],
    ['Location', 'Bilbao, ES'],
    ['Status', s.statusRow],
  ];
  return (
    <div className="term-neofetch">
      <pre className="term-ascii" aria-hidden="true">
        {ASCII_M}
      </pre>
      <div className="term-sysinfo">
        <p className="term-sysinfo-head">
          <span className="term-accent">mikel</span>
          <span className="term-dim">@</span>
          <span className="term-accent">mkcodev</span>
        </p>
        {rows.map(([k, v]) => (
          <p key={k}>
            <span className="term-accent term-sysinfo-key">{k}</span>
            <span className="term-dim">:&nbsp;</span>
            {v}
          </p>
        ))}
      </div>
    </div>
  );
}

function Help({ lang }: { lang: Lang }) {
  return (
    <div className="term-help">
      {STRINGS[lang].helpRows.map(([cmd, desc]) => (
        <p key={cmd}>
          <span className="term-accent term-help-cmd">{cmd}</span>
          <span className="term-dim">{desc}</span>
        </p>
      ))}
    </div>
  );
}

function LsProjects({ lang }: { lang: Lang }) {
  return (
    <div>
      <div className="term-ls">
        {projects.map((p) => (
          <span key={p.slug} className={p.caseStudy ? 'term-accent' : undefined}>
            {p.slug}
            {p.caseStudy ? '/' : ''}
          </span>
        ))}
      </div>
      <p className="term-dim">{STRINGS[lang].lsFoot}</p>
    </div>
  );
}

function SudoHireMe({ lang }: { lang: Lang }) {
  const s = STRINGS[lang];
  return (
    <div>
      <p className="term-dim">{s.sudoPass}</p>
      <p>
        <span className="term-accent">ok</span> — {s.sudoOk}
      </p>
      <p>
        <span className="term-dim">→&nbsp;</span>
        <a className="term-link" href={`mailto:${SITE.email}`}>
          {SITE.email}
        </a>
      </p>
      <p>
        <span className="term-dim">→&nbsp;</span>
        <a className="term-link" href={SITE.cvPath} download>
          {s.sudoCv}
        </a>
      </p>
    </div>
  );
}

function runCommand(raw: string, lang: Lang): ReactNode | 'clear' | null {
  const cmd = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  if (cmd === '') return null;
  if (cmd === 'clear') return 'clear';
  if (cmd === 'help') return <Help lang={lang} />;
  if (cmd === 'ls' || cmd === 'ls projects') return <LsProjects lang={lang} />;
  if (cmd === 'cat about.txt' || cmd === 'about') {
    return (
      <div>
        {STRINGS[lang].about.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    );
  }
  if (cmd === 'neofetch') return <Neofetch lang={lang} />;
  if (cmd === 'sudo hire-me' || cmd === 'hire-me') return <SudoHireMe lang={lang} />;
  if (cmd === 'whoami') return <p>{SITE.author}</p>;
  return <p className="term-error">{STRINGS[lang].notFound(raw.trim())}</p>;
}

const INTRO_CMD = 'neofetch';
const TYPE_MS = 35;

export default function Terminal({ lang }: Props) {
  const s = STRINGS[lang];
  const [lines, setLines] = useState<TermLine[]>([]);
  const [typed, setTyped] = useState('');
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState('');
  const [histIdx, setHistIdx] = useState(-1);
  const history = useRef<string[]>([]);
  const nextId = useRef(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pushLines = (nodes: ReactNode[]) => {
    setLines((prev) => [
      ...prev.slice(-60),
      ...nodes.map((node) => ({ id: nextId.current++, node })),
    ]);
  };

  useEffect(() => {
    const finishIntro = () => {
      setTyped('');
      pushLines([
        <Prompt cmd={INTRO_CMD} />,
        <Neofetch lang={lang} />,
        <p className="term-dim term-hint">{s.hint}</p>,
      ]);
      setReady(true);
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finishIntro();
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(INTRO_CMD.slice(0, i));
      if (i >= INTRO_CMD.length) {
        window.clearInterval(id);
        window.setTimeout(finishIntro, 260);
      }
    }, TYPE_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [lines]);

  const onSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = runCommand(input, lang);
    if (result === 'clear') {
      setLines([]);
    } else {
      const out: ReactNode[] = [<Prompt cmd={input} />];
      if (result !== null) out.push(result);
      pushLines(out);
    }
    if (input.trim() !== '') history.current = [...history.current.slice(-30), input];
    setHistIdx(-1);
    setInput('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const hist = history.current;
    if (e.key === 'ArrowUp' && hist.length > 0) {
      e.preventDefault();
      const idx = histIdx === -1 ? hist.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(idx);
      setInput(hist[idx] ?? '');
    }
    if (e.key === 'ArrowDown' && histIdx !== -1) {
      e.preventDefault();
      const idx = histIdx + 1;
      if (idx >= hist.length) {
        setHistIdx(-1);
        setInput('');
      } else {
        setHistIdx(idx);
        setInput(hist[idx] ?? '');
      }
    }
  };

  return (
    <div className="term" data-terminal>
      <div className="term-chrome" aria-hidden="true">
        <span className="term-dot term-dot--r"></span>
        <span className="term-dot term-dot--y"></span>
        <span className="term-dot term-dot--g"></span>
        <span className="term-title">{s.title}</span>
      </div>
      {/* click en cualquier parte del cuerpo enfoca el input, como una terminal real */}
      <div
        className="term-body"
        ref={bodyRef}
        onClick={() => inputRef.current?.focus()}
        role="presentation"
      >
        <div role="log" aria-live="polite">
          {lines.map((line) => (
            <div key={line.id} className="term-line">
              {line.node}
            </div>
          ))}
        </div>
        {ready ? (
          <form className="term-input-row" onSubmit={onSubmit}>
            <Prompt />
            <input
              ref={inputRef}
              className="term-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              aria-label={s.inputLabel}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </form>
        ) : (
          <p className="term-line">
            <Prompt cmd={typed} />
            <span className="term-caret" aria-hidden="true"></span>
          </p>
        )}
      </div>
    </div>
  );
}
