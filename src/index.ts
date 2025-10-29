import { menuScrollStyler } from './utils/menuScrollStyler';
import { menuVisibilityController } from './utils/menuVisibilityController';
import { anyVisualBeforeAfter } from './utils/anyVisualBeforeAfter';

window.Webflow ||= [];
window.Webflow.push(() => {
  menuScrollStyler();
  menuVisibilityController();
  anyVisualBeforeAfter();
});
