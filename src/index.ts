import { anyVisualBeforeAfter } from './utils/anyVisualBeforeAfter';
import { arLabFilters } from './utils/arLabFilters';
import { cardCounterUpdater } from './utils/cardCounterUpdater';
import { currentYearUpdater } from './utils/currentYearUpdater';
import { dvhTrickFixer } from './utils/dvhTrickFixer';
import { footerLinkPress } from './utils/footerLinkPress';
import { looknigListsAggregator } from './utils/looknigListsAggregator';
import { menuScrollStyler } from './utils/menuScrollStyler';
import { menuVisibilityController } from './utils/menuVisibilityController';
import { parentLinkWrapper } from './utils/parentLinkWrapper';
import { popupSwipers } from './utils/popupSwipers';
import { studioSwipers } from './utils/studioSwipers';

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
  footerLinkPress();
  looknigListsAggregator();
  parentLinkWrapper();
});
