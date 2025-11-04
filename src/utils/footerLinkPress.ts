import './footerLinkPress.css';

export const footerLinkPress = () => {
  const footerLinks = document.querySelectorAll('.footer_link');
  console.log('FooterLinkPress: Found links:', footerLinks.length);

  const findInnerCircle = (root: Element | Document): HTMLElement | null => {
    return (root.querySelector('.inner-circle') as HTMLElement) || (root.querySelector('[inner-circle]') as HTMLElement);
  };

  // Track pending removal timers per link
  const removeTimers = new WeakMap<Element, number>();

  const addPressed = (link: Element) => {
    console.log('FooterLinkPress: addPressed called');
    const innerCircle = findInnerCircle(link);
    console.log('FooterLinkPress: innerCircle found:', innerCircle);
    if (!innerCircle) {
      console.log('FooterLinkPress: innerCircle NOT found!');
      return;
    }

    // Cancel any pending removal
    const existing = removeTimers.get(link);
    if (existing) {
      window.clearTimeout(existing);
      removeTimers.delete(link);
    }

    innerCircle.classList.add('is-pressed');
    console.log('FooterLinkPress: Added is-pressed class, classes now:', innerCircle.className);
    console.log('FooterLinkPress: Computed opacity:', window.getComputedStyle(innerCircle).opacity);
  };

  const scheduleRemovePressed = (link: Element) => {
    const innerCircle = findInnerCircle(link);
    if (!innerCircle) return;

    const existing = removeTimers.get(link);
    if (existing) {
      window.clearTimeout(existing);
    }

    const timer = window.setTimeout(() => {
      innerCircle.classList.remove('is-pressed');
      removeTimers.delete(link);
    }, 100);

    removeTimers.set(link, timer);
  };

  if (footerLinks.length) {
    footerLinks.forEach((link, index) => {
      console.log(`FooterLinkPress: Setting up listeners for link ${index}`);
      
      // Pointer events (covers mouse + touch)
      link.addEventListener('pointerdown', (e) => {
        console.log('FooterLinkPress: pointerdown event');
        e.preventDefault();
        addPressed(link);
      });
      link.addEventListener('pointerup', () => {
        console.log('FooterLinkPress: pointerup event');
        scheduleRemovePressed(link);
      });
      link.addEventListener('pointerleave', () => scheduleRemovePressed(link));
      link.addEventListener('pointercancel', () => scheduleRemovePressed(link));

      // Mouse fallbacks
      link.addEventListener('mousedown', (e) => {
        console.log('FooterLinkPress: mousedown event');
        e.preventDefault();
        addPressed(link);
      });
      link.addEventListener('mouseup', () => {
        console.log('FooterLinkPress: mouseup event');
        scheduleRemovePressed(link);
      });
      link.addEventListener('mouseleave', () => scheduleRemovePressed(link));
      link.addEventListener('dragstart', () => scheduleRemovePressed(link));

      // Touch fallbacks
      link.addEventListener('touchstart', (e) => {
        console.log('FooterLinkPress: touchstart event');
        addPressed(link);
      }, { passive: true });
      link.addEventListener('touchend', () => scheduleRemovePressed(link));
      link.addEventListener('touchcancel', () => scheduleRemovePressed(link));
    });

    // Safety: remove pressed on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') {
        footerLinks.forEach((link) => scheduleRemovePressed(link));
      }
    });
  }
};

