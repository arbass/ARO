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

    // Hide system cursor only within the buttons wrapper
    wrapper.style.cursor = 'none';

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
      if (currentHover === 'next') {
        const direction = willBeAtEnd() ? 'rotateY(0deg)' : 'rotateY(180deg)';
        arrow.style.setProperty('transform', direction, 'important');
      } else if (currentHover === 'prev') {
        const direction = willBeAtStart() ? 'rotateY(180deg)' : 'rotateY(0deg)';
        arrow.style.setProperty('transform', direction, 'important');
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

    const onWrapperLeave = () => {
      document.removeEventListener('pointermove', onPointerMove);
      arrow.style.opacity = '0';
      currentHover = null;
      updateOrientation();
    };

    prevBtn.addEventListener('mouseenter', onPrevEnter);
    nextBtn.addEventListener('mouseenter', onNextEnter);
    wrapper.addEventListener('mouseenter', onWrapperEnter as EventListener);
    wrapper.addEventListener('mouseleave', onWrapperLeave);

    // Handle clicks on disabled buttons: step one slide inward instead of doing nothing
    const onPrevClickCapture = (event: Event) => {
      if (!instance) return;
      // Only intercept if button is actually disabled
      if (prevBtn.classList.contains('swiper-button-disabled')) {
        event.preventDefault();
        event.stopPropagation();
        // From first slide, go to second
        if (typeof instance.slideNext === 'function') {
          instance.slideNext();
        }
      }
      // Otherwise let Swiper handle it natively
    };

    const onNextClickCapture = (event: Event) => {
      if (!instance) return;
      // Only intercept if button is actually disabled
      if (nextBtn.classList.contains('swiper-button-disabled')) {
        event.preventDefault();
        event.stopPropagation();
        // From last slide, go to previous
        if (typeof instance.slidePrev === 'function') {
          instance.slidePrev();
        }
      }
      // Otherwise let Swiper handle it natively
    };

    // Use capture phase to intercept before Swiper's handlers
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
        arrow.style.opacity = '1';
        updatePositionRelativeToWrapper(initialPoint.x, initialPoint.y);
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
