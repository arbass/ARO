export const menuVisibilityController = () => {
  const mainMenu = document.querySelector('[main-menu]');
  const scrollTrigger = document.querySelector('[scroll-menu-trigger]');

  if (mainMenu && scrollTrigger) {
    let lastScrollY = window.scrollY;
    let isScrollingUp = false;

    const updateMenuVisibility = () => {
      // Get trigger position and dimensions
      const triggerRect = scrollTrigger.getBoundingClientRect();
      const triggerTop = triggerRect.top + window.scrollY;
      const triggerBottom = triggerTop + triggerRect.height;

      // Get current scroll position
      const currentScrollY = window.scrollY;

      // Detect scroll direction
      isScrollingUp = currentScrollY < lastScrollY;
      lastScrollY = currentScrollY;

      // Check if we're within the trigger zone
      const isInTriggerZone = currentScrollY >= triggerTop && currentScrollY <= triggerBottom;

      // Menu should be visible if:
      // 1. We're in trigger zone
      // 2. User is scrolling up
      const shouldBeVisible = isInTriggerZone || isScrollingUp;

      // Update menu visibility
      if (shouldBeVisible) {
        // Menu should be visible - remove hidden class
        mainMenu.classList.remove('is-hidden');
        if (isScrollingUp) {
          // console.log('MenuVisibilityController: Menu visible (scrolling up)');
        } else {
          // console.log('MenuVisibilityController: Menu visible (in trigger zone)');
        }
      } else {
        // Menu should be hidden - add hidden class only if not scrolling up and outside trigger
        if (!isInTriggerZone && !isScrollingUp) {
          mainMenu.classList.add('is-hidden');
          // console.log('MenuVisibilityController: Menu hidden (scrolling down, outside trigger zone)');
        }
      }
    };

    // Initial check
    updateMenuVisibility();

    // Listen for scroll events
    window.addEventListener('scroll', updateMenuVisibility);

    // Listen for resize events to handle responsive changes
    window.addEventListener('resize', updateMenuVisibility);

    return () => {
      window.removeEventListener('scroll', updateMenuVisibility);
      window.removeEventListener('resize', updateMenuVisibility);
    };
  }
};
