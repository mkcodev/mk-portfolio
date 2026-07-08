import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onPageLoad, startLifecycle } from './lifecycle';
import { initScroll } from './scroll';
import { initNavbar } from './navbar';
import { initCursor } from './cursor';
import { initHeroGlow } from './heroGlow';
import { initHeroField } from './heroField';
import { initGlyphTunnel } from './glyphTunnel';
import { initScrollSkew } from './scrollSkew';
import { initCursorTrail } from './cursorTrail';
import { initReveals } from './reveal';
import { initBento } from './bento';
import { initTimeline } from './timeline';
import { initAsciiPhoto } from './ascii';
import { initMagnetic } from './magnetic';
import { initKeys } from './keys';
import { initEggs } from './eggs';

onPageLoad(initScroll);
onPageLoad(initNavbar);
onPageLoad(initCursor);
onPageLoad(initHeroGlow);
onPageLoad(initHeroField);
onPageLoad(initGlyphTunnel);
onPageLoad(initScrollSkew);
onPageLoad(initCursorTrail);
onPageLoad(initReveals);
onPageLoad(initBento);
onPageLoad(initTimeline);
onPageLoad(initAsciiPhoto);
onPageLoad(initMagnetic);
onPageLoad(initKeys);
onPageLoad(initEggs);

// Los reveals se crean ANTES que el pin del timeline y se refrescan en orden
// de creación: sin sort() el offset del pin no se propaga a los triggers
// posteriores y quedan ~170vh cortos (opacity 0 permanente tras el pin).
gsap.registerPlugin(ScrollTrigger);
onPageLoad(() => {
  const id = requestAnimationFrame(() => {
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  });
  return () => cancelAnimationFrame(id);
});

startLifecycle();
