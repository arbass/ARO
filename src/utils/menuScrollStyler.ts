export const menuScrollStyler = () => {
  const mainMenu = document.querySelector('[main-menu]');

  if (mainMenu) {
    let currentMenuState: 'navy' | 'white' | null = null;
    let mobileMenuOpen = false;
    let scrollLocked = false;
    let scrollY = 0;
    let lenisWasRunning = false;

    const lockScroll = () => {
      if (scrollLocked) return;

      scrollY = window.scrollY;

      const lenisCandidate = (
        window as unknown as {
          lenis?: { stop?: () => void; start?: () => void; isStopped?: boolean };
        }
      ).lenis;
      if (lenisCandidate && typeof lenisCandidate.stop === 'function') {
        lenisWasRunning = !(lenisCandidate as { isStopped?: boolean }).isStopped;
        lenisCandidate.stop();
      } else {
        lenisWasRunning = false;
      }

      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      scrollLocked = true;
    };

    const unlockScroll = () => {
      if (!scrollLocked) return;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);

      if (lenisWasRunning) {
        const lenisCandidate = (
          window as unknown as {
            lenis?: { stop?: () => void; start?: () => void };
          }
        ).lenis;
        if (lenisCandidate && typeof lenisCandidate.start === 'function') {
          lenisCandidate.start();
        }
      }

      lenisWasRunning = false;
      scrollLocked = false;
    };

    const updateMenuColors = () => {
      const menuWhiteSections = document.querySelectorAll('[menu-white]');
      const menuNavySections = document.querySelectorAll('[menu-navy]');

      // Get menu position and dimensions
      const menuRect = mainMenu.getBoundingClientRect();
      const menuTop = menuRect.top + window.scrollY;
      const menuBottom = menuTop + menuRect.height;

      let newSection: 'navy' | 'white' | null = null;

      // Check all navy sections first (higher priority)
      for (const navySection of menuNavySections) {
        const navyRect = navySection.getBoundingClientRect();
        const navyTop = navyRect.top + window.scrollY;
        const navyBottom = navyTop + navyRect.height;

        // Check if menu intersects with this navy section
        if (menuTop < navyBottom && menuBottom > navyTop) {
          newSection = 'navy';
          break; // Stop checking once we find a navy intersection
        }
      }

      // Check all white sections if navy is not active
      if (!newSection) {
        for (const whiteSection of menuWhiteSections) {
          const whiteRect = whiteSection.getBoundingClientRect();
          const whiteTop = whiteRect.top + window.scrollY;
          const whiteBottom = whiteTop + whiteRect.height;

          // Check if menu intersects with this white section
          if (menuTop < whiteBottom && menuBottom > whiteTop) {
            newSection = 'white';
            break; // Stop checking once we find a white intersection
          }
        }
      }

      // Check if menu-nav is flex (mobile menu open)
      const menuNav = document.querySelector('[menu-nav]');
      const isMenuNavFlex = menuNav && window.getComputedStyle(menuNav).display === 'flex';

      // Add/remove mobile menu class and lock/unlock scroll
      if (isMenuNavFlex) {
        mainMenu.classList.add('mobile-menu-open');
        if (!mobileMenuOpen) {
          mobileMenuOpen = true;
          lockScroll();
        }
      } else {
        mainMenu.classList.remove('mobile-menu-open');
        if (mobileMenuOpen) {
          mobileMenuOpen = false;
          unlockScroll();
        }
      }

      // Only update if state changed
      if (newSection !== currentMenuState) {
        currentMenuState = newSection;

        // Get all circles
        const circles = mainMenu.querySelectorAll('.footer_link-svg-circle');
        // Check if we're on desktop (992px+)
        const isDesktop = window.innerWidth >= 992;

        // Apply classes based on current section
        if (currentMenuState === 'navy') {
          mainMenu.classList.add('menu-navy');
          mainMenu.classList.remove('menu-white');
          // Remove is-white from circles (only on desktop)
          if (isDesktop) {
            circles.forEach((circle) => circle.classList.remove('is-white'));
          }
        } else if (currentMenuState === 'white') {
          mainMenu.classList.add('menu-white');
          mainMenu.classList.remove('menu-navy');
          // Add is-white to circles
          circles.forEach((circle) => circle.classList.add('is-white'));
        } else {
          mainMenu.classList.add('menu-white');
          mainMenu.classList.remove('menu-navy');
          // Add is-white to circles (default is white)
          circles.forEach((circle) => circle.classList.add('is-white'));
        }
      }
    };

    // Initial check
    updateMenuColors();

    // Listen for scroll events
    window.addEventListener('scroll', updateMenuColors);

    // Listen for resize events to handle responsive changes
    window.addEventListener('resize', updateMenuColors);

    // Listen for mobile menu state changes
    const menuNav = document.querySelector('[menu-nav]');
    if (menuNav) {
      const observer = new MutationObserver(() => {
        updateMenuColors();
      });

      observer.observe(menuNav, {
        attributes: true,
        attributeFilter: ['style', 'class'],
      });

      return () => {
        window.removeEventListener('scroll', updateMenuColors);
        window.removeEventListener('resize', updateMenuColors);
        observer.disconnect();
      };
    }

    return () => {
      window.removeEventListener('scroll', updateMenuColors);
      window.removeEventListener('resize', updateMenuColors);
    };
  }
};
