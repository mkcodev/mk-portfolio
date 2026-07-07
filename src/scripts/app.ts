import { onPageLoad, startLifecycle } from './lifecycle';
import { initScroll } from './scroll';
import { initNavbar } from './navbar';
import { initCursor } from './cursor';
import { initHeroGlow } from './heroGlow';
import { initReveals } from './reveal';
import { initBento } from './bento';
import { initTimeline } from './timeline';

onPageLoad(initScroll);
onPageLoad(initNavbar);
onPageLoad(initCursor);
onPageLoad(initHeroGlow);
onPageLoad(initReveals);
onPageLoad(initBento);
onPageLoad(initTimeline);

startLifecycle();
