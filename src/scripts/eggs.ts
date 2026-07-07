const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

let bannerShown = false;

function showBanner(): void {
  if (bannerShown) return;
  bannerShown = true;
  const art = [
    '.___  ___.  __  ___',
    '|   \\/   | |  |/  /',
    "|  \\  /  | |  '  /",
    '|  |\\/|  | |    <',
    '|  |  |  | |  .  \\',
    '|__|  |__| |__|\\__\\  mkcodev',
  ].join('\n');
  // Easter egg intencional — única excepción a "sin console.log"
  console.log(`%c${art}`, 'color:#00DBD5;font-family:monospace');
  console.log(
    '%c¿Curioseando? Eso es buena señal → https://github.com/mkcodev\nPrueba el código Konami: ↑↑↓↓←→←→ba',
    'color:#8AA09E;font-family:monospace',
  );
}

function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  );
}

/** Konami code → modo CRT (clase en <html>) + banner ASCII en consola. */
export function initEggs(): () => void {
  showBanner();
  let i = 0;

  const onKeydown = (e: KeyboardEvent): void => {
    if (isEditable(e.target)) return;
    if (e.key === KONAMI[i]) {
      i += 1;
      if (i === KONAMI.length) {
        i = 0;
        document.documentElement.classList.toggle('crt');
      }
    } else {
      i = e.key === KONAMI[0] ? 1 : 0;
    }
  };

  document.addEventListener('keydown', onKeydown);
  return () => document.removeEventListener('keydown', onKeydown);
}
