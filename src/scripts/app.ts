import { onPageLoad, startLifecycle } from './lifecycle';
import { initScroll } from './scroll';
import { initNavbar } from './navbar';
import { initCursor } from './cursor';
import { initHeroGlow } from './heroGlow';

onPageLoad(initScroll);
onPageLoad(initNavbar);
onPageLoad(initCursor);
onPageLoad(initHeroGlow);

startLifecycle();
