// Consent Mode v2, patrón "basic" (AEPD): gtag.js NO se descarga hasta que
// el usuario acepta. El default 'denied' vive inline en el head de Base.astro.
const GA_ID = import.meta.env.PUBLIC_GA_ID as string | undefined;
const STORAGE_KEY = 'mk-consent';

let gtagLoaded = false;
let listenerBound = false;

type ConsentWindow = Window & typeof globalThis & { gtag?: (...args: unknown[]) => void };

function gtagCall(...args: unknown[]): void {
  (window as ConsentWindow).gtag?.(...args);
}

function readDecision(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function loadGtag(): void {
  if (gtagLoaded || !GA_ID) return;
  gtagLoaded = true;
  gtagCall('consent', 'update', { analytics_storage: 'granted' });
  gtagCall('js', new Date());
  // send_page_view: false — ClientRouter no recarga la página, el page_view
  // se emite manualmente en cada onPageLoad (ver initConsent).
  gtagCall('config', GA_ID, { send_page_view: false });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

function sendPageView(): void {
  if (!gtagLoaded) return;
  gtagCall('event', 'page_view', {
    page_location: window.location.href,
    page_title: document.title,
  });
}

function setBanner(visible: boolean): void {
  const banner = document.querySelector<HTMLElement>('[data-cookie-banner]');
  if (banner) banner.hidden = !visible;
}

function decide(value: 'granted' | 'denied'): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Modo privado sin storage: la decisión no persiste, pero se respeta ahora
  }
  setBanner(false);
  if (value === 'granted') {
    loadGtag();
    sendPageView();
  }
}

/** Banner de cookies + carga condicional de GA4. Sin PUBLIC_GA_ID es no-op silencioso de analítica (el banner sigue funcionando). */
export function initConsent(): void {
  if (!listenerBound) {
    listenerBound = true;
    // Delegación a document: sobrevive a los swaps de View Transitions
    document.addEventListener('click', (e) => {
      const target = e.target as Element;
      if (target.closest('[data-consent-accept]')) decide('granted');
      else if (target.closest('[data-consent-reject]')) decide('denied');
    });
  }

  const decision = readDecision();
  if (decision === 'granted') {
    loadGtag();
    sendPageView();
  } else if (decision === null) {
    setBanner(true);
  }
}
