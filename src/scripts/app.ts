import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onPageLoad, startLifecycle } from './lifecycle';
import { initScroll } from './scroll';
import { initNavbar } from './navbar';
import { initCursor } from './cursor';
import { initHeroGlow } from './heroGlow';
import { initReveals } from './reveal';
import { initBento } from './bento';
import { initTimeline } from './timeline';
import { initAsciiPhoto } from './ascii';
import { initMagnetic } from './magnetic';

onPageLoad(initScroll);
onPageLoad(initNavbar);
onPageLoad(initCursor);
onPageLoad(initHeroGlow);
onPageLoad(initReveals);
onPageLoad(initBento);
onPageLoad(initTimeline);
onPageLoad(initAsciiPhoto);
onPageLoad(initMagnetic);

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
