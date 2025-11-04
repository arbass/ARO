import { menuScrollStyler } from './utils/menuScrollStyler';
import { menuVisibilityController } from './utils/menuVisibilityController';
import { anyVisualBeforeAfter } from './utils/anyVisualBeforeAfter';
import { popupSwipers } from './utils/popupSwipers';
import { currentYearUpdater } from './utils/currentYearUpdater';
import { cardCounterUpdater } from './utils/cardCounterUpdater';
import { arLabFilters } from './utils/arLabFilters';
import { studioSwipers } from './utils/studioSwipers';
import { dvhTrickFixer } from './utils/dvhTrickFixer';

window.Webflow ||= [];
window.Webflow.push(() => {
  menuScrollStyler();
  menuVisibilityController();
  anyVisualBeforeAfter();
  popupSwipers();
  currentYearUpdater();
  cardCounterUpdater();
  arLabFilters();
  studioSwipers();
  dvhTrickFixer();
});
