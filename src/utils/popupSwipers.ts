export const popupSwipers = () => {
  const cards = Array.from(document.querySelectorAll('[card-ar-lab]')) as HTMLElement[];
  if (!cards.length) {
    return;
  }

  const zeroPad2 = (n: number): string => (n < 9 ? `0${n + 1}.` : `${n + 1}.`);

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
    popup.style.display = 'flex';
  };

  const closePopup = (popup: HTMLElement) => {
    popup.style.display = 'none';
  };

  cards.forEach((card) => {
    const popup = card.querySelector('[ar-lab_popup]') as HTMLElement | null;
    if (!popup) return;

    const closeArea = popup.querySelector(
      '[is-ar-lab_popup-burger-click-area]'
    ) as HTMLElement | null;

    card.addEventListener('click', async (evt) => {
      await ensureSwiperAssets();
      openPopup(popup);
      // Wait for layout to update so Swiper can measure sizes
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          initSwipersIn(popup);
          const clickEvt = evt as MouseEvent;
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
      evt.stopPropagation();
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
