import { menuScrollStyler } from './utils/menuScrollStyler';
import { menuVisibilityController } from './utils/menuVisibilityController';
import { anyVisualBeforeAfter } from './utils/anyVisualBeforeAfter';
import { popupSwipers } from './utils/popupSwipers';
import { currentYearUpdater } from './utils/currentYearUpdater';

window.Webflow ||= [];
window.Webflow.push(() => {
  menuScrollStyler();
  menuVisibilityController();
  anyVisualBeforeAfter();
  popupSwipers();
  currentYearUpdater();
});
