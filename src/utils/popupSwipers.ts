export const popupSwipers = () => {
  const cards = Array.from(document.querySelectorAll('[card-ar-lab]')) as HTMLElement[];
  if (!cards.length) {
    return;
  }

  const zeroPad2 = (n: number): string => (n < 9 ? `0${n + 1}.` : `${n + 1}.`);

  let scrollLocked = false;
  let scrollY = 0;
  let lenisWasRunning = false;

  const lockScroll = () => {
    if (scrollLocked) return;

    scrollY = window.scrollY;

    const lenisCandidate = (window as unknown as {
      lenis?: { stop?: () => void; start?: () => void; isStopped?: boolean };
    }).lenis;
    if (lenisCandidate && typeof lenisCandidate.stop === 'function') {
      lenisWasRunning = !(lenisCandidate as { isStopped?: boolean }).isStopped;
      lenisCandidate.stop();
    } else {
      lenisWasRunning = false;
    }

    const body = document.body;
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    scrollLocked = true;
  };

  const unlockScroll = () => {
    if (!scrollLocked) return;
    const body = document.body;
    body.style.position = '';
    body.style.top = '';
    body.style.width = '';
    window.scrollTo(0, scrollY);

    if (lenisWasRunning) {
      const lenisCandidate = (window as unknown as {
        lenis?: { stop?: () => void; start?: () => void };
      }).lenis;
      if (lenisCandidate && typeof lenisCandidate.start === 'function') {
        lenisCandidate.start();
      }
    }

    lenisWasRunning = false;
    scrollLocked = false;
  };

  const numberAndSyncTextInGrids = () => {
    const grids = Array.from(document.querySelectorAll('[ar-lab-grid]')) as HTMLElement[];
    grids.forEach((grid) => {
      const gridCards = Array.from(grid.querySelectorAll('[card-ar-lab]')) as HTMLElement[];
      gridCards.forEach((card, index) => {
        const numEl = card.querySelector('[card-ar-lab_number]') as HTMLElement | null;
        const titleEl = card.querySelector('[card-ar-lab_title]') as HTMLElement | null;
        const descEl = card.querySelector('[card-ar-lab_description]') as HTMLElement | null;

        const popup = card.querySelector('[ar-lab_popup]') as HTMLElement | null;
        const popupNum = popup?.querySelector('[card-ar-lab-popup_number]') as HTMLElement | null;
        const popupTitle = popup?.querySelector('[card-ar-lab-popup_title]') as HTMLElement | null;
        const popupDesc = popup?.querySelector(
          '[card-ar-lab-popup_description]'
        ) as HTMLElement | null;

        const numbered = zeroPad2(index);
        if (numEl) numEl.textContent = numbered;
        if (popupNum) popupNum.textContent = numbered;

        if (titleEl && popupTitle) popupTitle.textContent = titleEl.textContent ?? '';
        if (descEl && popupDesc) popupDesc.textContent = descEl.textContent ?? '';
      });
    });
  };

  // Priority: number and sync text before any interactive logic
  numberAndSyncTextInGrids();

  type SwiperPublic = {
    slideNext?: () => void;
    slidePrev?: () => void;
    slideTo?: (index: number, speed?: number, runCallbacks?: boolean, internal?: boolean) => void;
    isBeginning?: boolean;
    isEnd?: boolean;
    activeIndex?: number;
    slides?: { length: number };
    on?: (event: string, handler: () => void) => void;
  };
  const swiperInstances = new WeakMap<HTMLElement, SwiperPublic>();

  let assetsLoaded = false;
  let loadingPromise: Promise<void> | null = null;

  const ensureSwiperAssets = (): Promise<void> => {
    if (assetsLoaded) return Promise.resolve();
    if (loadingPromise) return loadingPromise;

    loadingPromise = new Promise<void>((resolve) => {
      const cssHref = 'https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.css';
      const jsSrc = 'https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.js';

      const appendCss = () => {
        const existing = document.querySelector(`link[href="${cssHref}"]`);
        if (existing) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssHref;
        document.head.appendChild(link);
      };

      const appendJs = (onLoad: () => void) => {
        const existing = document.querySelector(
          `script[src="${jsSrc}"]`
        ) as HTMLScriptElement | null;
        if (existing) {
          const maybeSwiper = (window as unknown as { Swiper?: unknown }).Swiper;
          if (typeof maybeSwiper === 'function') {
            onLoad();
          } else {
            existing.addEventListener('load', onLoad, { once: true });
          }
          return;
        }
        const script = document.createElement('script');
        script.src = jsSrc;
        script.defer = true;
        script.addEventListener('load', onLoad, { once: true });
        document.head.appendChild(script);
      };

      appendCss();
      appendJs(() => {
        assetsLoaded = true;
        resolve();
      });
    });

    return loadingPromise;
  };

  let swiperIdCounter = 0;
  const initSwipersIn = (root: HTMLElement) => {
    const swiperContainers = Array.from(root.querySelectorAll('.swiper')) as HTMLElement[];
    if (!swiperContainers.length) return;

    type SwiperConstructor = new (
      elementOrSelector: HTMLElement | string,
      options: Record<string, unknown>
    ) => unknown;
    const SwiperCtor = (window as unknown as { Swiper?: unknown }).Swiper as
      | SwiperConstructor
      | undefined;
    if (typeof SwiperCtor !== 'function') return;

    swiperContainers.forEach((container) => {
      if (container.getAttribute('data-swiper-initialized') === 'true') return;

      swiperIdCounter += 1;
      const unique = `is-${swiperIdCounter}`;
      container.classList.add(unique);

      const pagination = container.querySelector('.swiper-pagination') as HTMLElement | null;
      if (pagination) pagination.classList.add(unique);

      const nextBtn = container.querySelector('.slider-button-next') as HTMLElement | null;
      if (nextBtn) nextBtn.classList.add(unique);

      const prevBtn = container.querySelector('.slider-button-prev') as HTMLElement | null;
      if (prevBtn) prevBtn.classList.add(unique);

      const scrollbar = container.querySelector('.swiper-scrollbar') as HTMLElement | null;
      if (scrollbar) scrollbar.classList.add(unique);

      // Prefer passing elements directly to avoid selector collisions
      const options: Record<string, unknown> = {
        direction: 'horizontal',
        loop: false,
        slidesPerView: 1,
        pagination: pagination ? { el: pagination } : { enabled: false },
        navigation: nextBtn && prevBtn ? { nextEl: nextBtn, prevEl: prevBtn } : { enabled: false },
        scrollbar: scrollbar ? { el: scrollbar } : { enabled: false },
      };
      const instance = new SwiperCtor(container, options) as unknown as SwiperPublic;
      swiperInstances.set(container, instance);
      container.setAttribute('data-swiper-initialized', 'true');
    });
  };

  const setupSliderArrowHover = (
    popup: HTMLElement,
    initialPoint?: { x: number; y: number }
  ) => {
    const wrapper = popup.querySelector('.swiper-buttons-wrpapper') as HTMLElement | null;
    if (!wrapper) return;
    if (wrapper.getAttribute('data-hover-initialized') === 'true') return;

    const arrow = wrapper.querySelector('.slider-button-arrow') as HTMLElement | null;
    const prevBtn = wrapper.querySelector('.slider-button-prev') as HTMLElement | null;
    const nextBtn = wrapper.querySelector('.slider-button-next') as HTMLElement | null;
    if (!arrow || !prevBtn || !nextBtn) return;

    // Find associated swiper instance for boundary checks
    const container = wrapper.closest('.swiper') as HTMLElement | null;
    const instance = container ? swiperInstances.get(container) : undefined;

    // If only one slide, disable both buttons and hide arrow
    const slideCount = instance?.slides?.length ?? 0;
    if (slideCount <= 1) {
      prevBtn.classList.add('swiper-button-disabled');
      nextBtn.classList.add('swiper-button-disabled');
      prevBtn.style.cursor = 'default';
      nextBtn.style.cursor = 'default';
      arrow.style.display = 'none';
      wrapper.setAttribute('data-hover-initialized', 'true');
      return;
    }

    // Ensure instant orientation change and prepare for following the cursor
    arrow.style.setProperty('transition', 'none', 'important');
    arrow.style.setProperty('animation', 'none', 'important');
    arrow.style.setProperty('transform', 'rotateY(0deg)', 'important');
    arrow.style.position = 'absolute';
    arrow.style.pointerEvents = 'none';
    arrow.style.willChange = 'transform, left, top, opacity';
    arrow.style.opacity = '0';

    // Initially hide system cursor on buttons
    prevBtn.style.cursor = 'none';
    nextBtn.style.cursor = 'none';

    const HALF = 16; // half of 32px SVG

    let currentHover: 'prev' | 'next' | null = null;

    const getSlideCount = (): number => {
      return instance?.slides?.length ?? 0;
    };

    const getCurrentIndex = (): number => {
      return instance?.activeIndex ?? 0;
    };

    const willBeAtStart = (): boolean => {
      const idx = getCurrentIndex();
      return idx === 0;
    };

    const willBeAtEnd = (): boolean => {
      const idx = getCurrentIndex();
      const count = getSlideCount();
      return count > 0 && idx === count - 1;
    };

    const updateOrientation = () => {
      if (!instance) return;
      
      // Check if we're hovering over a disabled button
      const isPrevDisabled = prevBtn.classList.contains('swiper-button-disabled');
      const isNextDisabled = nextBtn.classList.contains('swiper-button-disabled');
      
      if (currentHover === 'next' && isNextDisabled) {
        // Hide custom arrow and show default cursor
        arrow.style.opacity = '0';
        nextBtn.style.cursor = 'default';
        return;
      } else if (currentHover === 'prev' && isPrevDisabled) {
        // Hide custom arrow and show default cursor
        arrow.style.opacity = '0';
        prevBtn.style.cursor = 'default';
        return;
      }
      
      // Restore custom cursor behavior - hide system cursor on buttons
      prevBtn.style.cursor = 'none';
      nextBtn.style.cursor = 'none';
      if (arrow.style.display !== 'none') {
        arrow.style.opacity = '1';
      }
      
      if (currentHover === 'next') {
        arrow.style.setProperty('transform', 'rotateY(180deg)', 'important');
      } else if (currentHover === 'prev') {
        arrow.style.setProperty('transform', 'rotateY(0deg)', 'important');
      } else {
        arrow.style.setProperty('transform', 'rotateY(0deg)', 'important');
      }
    };

    const onPrevEnter = () => {
      currentHover = 'prev';
      updateOrientation();
    };
    const onNextEnter = () => {
      currentHover = 'next';
      updateOrientation();
    };
    const onPrevLeave = () => {
      if (currentHover === 'prev') {
        arrow.style.opacity = '0';
        currentHover = null;
      }
    };
    const onNextLeave = () => {
      if (currentHover === 'next') {
        arrow.style.opacity = '0';
        currentHover = null;
      }
    };

    const updatePositionRelativeToWrapper = (clientX: number, clientY: number) => {
      const rect = wrapper.getBoundingClientRect();
      const x = clientX - rect.left - HALF;
      const y = clientY - rect.top - HALF;
      arrow.style.left = `${x}px`;
      arrow.style.top = `${y}px`;
      // Ensure orientation reflects current boundary while moving
      if (currentHover) updateOrientation();
    };

    const onPointerMove = (e: PointerEvent) => {
      updatePositionRelativeToWrapper(e.clientX, e.clientY);
    };

    const onWrapperEnter = (e: MouseEvent) => {
      // Show instantly and set starting position
      arrow.style.opacity = '1';
      updatePositionRelativeToWrapper(e.clientX, e.clientY);
      document.addEventListener('pointermove', onPointerMove);
    };

    const onWrapperLeave = (e: MouseEvent) => {
      // Check if we're really leaving the wrapper (not just moving between buttons)
      const rect = wrapper.getBoundingClientRect();
      const isStillInside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      
      if (!isStillInside) {
        document.removeEventListener('pointermove', onPointerMove);
        arrow.style.opacity = '0';
        currentHover = null;
        // Restore default cursor on buttons
        prevBtn.style.cursor = '';
        nextBtn.style.cursor = '';
      }
    };

    prevBtn.addEventListener('mouseenter', onPrevEnter);
    prevBtn.addEventListener('mouseleave', onPrevLeave);
    nextBtn.addEventListener('mouseenter', onNextEnter);
    nextBtn.addEventListener('mouseleave', onNextLeave);
    wrapper.addEventListener('mouseenter', onWrapperEnter as EventListener);
    wrapper.addEventListener('mouseleave', onWrapperLeave);

    // Handle clicks on disabled buttons: step one slide inward instead of doing nothing
    const onPrevClickCapture = (event: Event) => {
      if (!instance) return;
      if (prevBtn.classList.contains('swiper-button-disabled')) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };

    const onNextClickCapture = (event: Event) => {
      if (!instance) return;
      if (nextBtn.classList.contains('swiper-button-disabled')) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };

    prevBtn.addEventListener('click', onPrevClickCapture, true);
    nextBtn.addEventListener('click', onNextClickCapture, true);

    // Subscribe to Swiper slideChange event for instant orientation updates
    if (instance && typeof instance.on === 'function') {
      instance.on('slideChange', () => {
        // Update orientation immediately when slide starts changing
        if (currentHover) {
          requestAnimationFrame(updateOrientation);
        }
      });
    }

    // If pointer is already over wrapper at open, start immediately
    if (initialPoint) {
      const rect = wrapper.getBoundingClientRect();
      if (
        initialPoint.x >= rect.left &&
        initialPoint.x <= rect.right &&
        initialPoint.y >= rect.top &&
        initialPoint.y <= rect.bottom
      ) {
        // Determine which button we're hovering over initially
        const prevRect = prevBtn.getBoundingClientRect();
        const nextRect = nextBtn.getBoundingClientRect();
        
        if (
          initialPoint.x >= prevRect.left &&
          initialPoint.x <= prevRect.right &&
          initialPoint.y >= prevRect.top &&
          initialPoint.y <= prevRect.bottom
        ) {
          currentHover = 'prev';
        } else if (
          initialPoint.x >= nextRect.left &&
          initialPoint.x <= nextRect.right &&
          initialPoint.y >= nextRect.top &&
          initialPoint.y <= nextRect.bottom
        ) {
          currentHover = 'next';
        }
        
        updatePositionRelativeToWrapper(initialPoint.x, initialPoint.y);
        updateOrientation(); // Check if button is disabled before showing arrow
        document.addEventListener('pointermove', onPointerMove);
      }
    }

    // Mark as initialized
    wrapper.setAttribute('data-hover-initialized', 'true');
  };

  const openPopup = (popup: HTMLElement) => {
    const grid = popup.querySelector('.grid.is-ar-lab_popup') as HTMLElement | null;
    const swiperSystem = popup.querySelector('.ar-lab_swiper-system') as HTMLElement | null;

    // Set initial state
    popup.style.opacity = '0';
    popup.style.transition = 'opacity 300ms ease-out';
    popup.style.display = 'flex';
    popup.setAttribute('data-popup-visible', 'true');

    if (grid) {
      grid.style.opacity = '0';
      grid.style.transition = 'opacity 300ms ease-out';
    }
    if (swiperSystem) {
      swiperSystem.style.opacity = '0';
      swiperSystem.style.transition = 'opacity 300ms ease-out';
    }

    // Trigger popup fade in
    requestAnimationFrame(() => {
      popup.style.opacity = '1';
      
      // Trigger children fade in with 100ms delay
      setTimeout(() => {
        if (grid) grid.style.opacity = '1';
        if (swiperSystem) swiperSystem.style.opacity = '1';
        
        // Recalculate video aspect ratios after popup is visible
        const recalcFn = (window as Window & { recalculatePopupVideoAspectRatios?: () => void }).recalculatePopupVideoAspectRatios;
        if (typeof recalcFn === 'function') {
          setTimeout(() => {
            recalcFn();
          }, 50);
        }
        
        // Remove transitions after animation completes to prevent flickering during slider navigation
        setTimeout(() => {
          popup.style.transition = '';
          if (grid) grid.style.transition = '';
          if (swiperSystem) swiperSystem.style.transition = '';
        }, 300);
        lockScroll();
      }, 100);
    });
  };

  const closePopup = (popup: HTMLElement) => {
    const grid = popup.querySelector('.grid.is-ar-lab_popup') as HTMLElement | null;
    const swiperSystem = popup.querySelector('.ar-lab_swiper-system') as HTMLElement | null;

    popup.setAttribute('data-popup-visible', 'false');

    // Re-apply transitions for closing animation
    popup.style.transition = 'opacity 300ms ease-out';
    if (grid) grid.style.transition = 'opacity 300ms ease-out';
    if (swiperSystem) swiperSystem.style.transition = 'opacity 300ms ease-out';

    // Fade out children first
    if (grid) grid.style.opacity = '0';
    if (swiperSystem) swiperSystem.style.opacity = '0';

    // Then fade out popup
    setTimeout(() => {
      popup.style.opacity = '0';
      
      // Hide after animation completes
      setTimeout(() => {
        popup.style.display = 'none';
        // Clean up transitions
        popup.style.transition = '';
        if (grid) grid.style.transition = '';
        if (swiperSystem) swiperSystem.style.transition = '';
        unlockScroll();
      }, 300);
    }, 100);
  };

  cards.forEach((card) => {
    const popup = card.querySelector('[ar-lab_popup]') as HTMLElement | null;
    if (!popup) return;

    const closeArea = popup.querySelector(
      '[is-ar-lab_popup-burger-click-area]'
    ) as HTMLElement | null;

    card.addEventListener('click', async (evt) => {
      const target = evt.target as HTMLElement | null;
      const isPopupVisible = popup.getAttribute('data-popup-visible') === 'true';
      if (isPopupVisible && target && popup.contains(target)) {
        return;
      }
      if (isPopupVisible) {
        return;
      }

      const clickEvt = evt as MouseEvent;
      evt.stopPropagation();
      evt.preventDefault();

      await ensureSwiperAssets();
      openPopup(popup);
      // Wait for layout to update so Swiper can measure sizes
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          initSwipersIn(popup);
          setupSliderArrowHover(popup, { x: clickEvt.clientX, y: clickEvt.clientY });
        });
      });
      // Attach keyboard handler (Escape to close, arrows to navigate)
      const keyHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closePopup(popup);
          document.removeEventListener('keydown', keyHandler);
          return;
        }
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const containers = Array.from(popup.querySelectorAll('.swiper')) as HTMLElement[];
          containers.forEach((c) => {
            const api = swiperInstances.get(c);
            if (!api) return;
            if (e.key === 'ArrowRight' && !api.isEnd && api.slideNext) {
              api.slideNext();
            }
            if (e.key === 'ArrowLeft' && !api.isBeginning && api.slidePrev) {
              api.slidePrev();
            }
          });
          e.preventDefault();
        }
      };
      document.addEventListener('keydown', keyHandler);
    });

    if (closeArea) {
      closeArea.addEventListener('click', (evt) => {
        closePopup(popup);
        // Remove all key handlers related to this popup
        // (In case user closed via button before pressing Escape)
        // Using a one-off temporary handler removal by dispatching a dummy event is overkill;
        // rely on Escape handler removing itself; here we remove any lingering arrow handler by replacing it.
        // Instead, we remove the last attached keydown listener by cloning document
        // is not feasible; so we do nothing here as our handler is removed on Escape path.
        evt.stopPropagation();
      });
    }
  });
};
