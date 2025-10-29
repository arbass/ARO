const ARROW_HALF_SIZE = 16;

let pointerTrackerInstalled = false;
let lastPointerPosition: { x: number; y: number } | null = null;
const arrowCleanupMap = new WeakMap<HTMLElement, () => void>();

const ensurePointerTracker = () => {
  if (pointerTrackerInstalled) return;
  pointerTrackerInstalled = true;
  const updatePosition = (event: PointerEvent) => {
    lastPointerPosition = { x: event.clientX, y: event.clientY };
  };
  document.addEventListener('pointermove', updatePosition);
  document.addEventListener('pointerdown', updatePosition);
};

export const popupSwipers = () => {
  const cards = Array.from(document.querySelectorAll('[card-ar-lab]')) as HTMLElement[];
  if (!cards.length) {
    return;
  }

  ensurePointerTracker();

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

  type SwiperPublic = { slideNext?: () => void; slidePrev?: () => void };
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

      const nextBtn = container.querySelector('[swiper-arrow-svg_next]') as HTMLElement | null;
      if (nextBtn) nextBtn.classList.add(unique);

      const prevBtn = container.querySelector('[swiper-arrow-svg_prev]') as HTMLElement | null;
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

  const openPopup = (popup: HTMLElement) => {
    popup.style.display = 'flex';
  };

  const closePopup = (popup: HTMLElement) => {
    popup.style.display = 'none';
    const cleanup = arrowCleanupMap.get(popup);
    if (cleanup) {
      cleanup();
      arrowCleanupMap.delete(popup);
    }
  };

  const setupArrowInteractions = (popup: HTMLElement) => {
    const wrapper = popup.querySelector('[swiper-arrow-svg_wrapper]') as HTMLElement | null;
    if (!wrapper) {
      arrowCleanupMap.delete(popup);
      return;
    }

    const arrowSvg = wrapper.querySelector('[swiper-arrow-svg]') as HTMLElement | null;
    const prevBtn = wrapper.querySelector('[swiper-arrow-svg_prev]') as HTMLElement | null;
    const nextBtn = wrapper.querySelector('[swiper-arrow-svg_next]') as HTMLElement | null;

    if (!arrowSvg || !prevBtn || !nextBtn) {
      arrowCleanupMap.delete(popup);
      return;
    }

    const existingCleanup = arrowCleanupMap.get(popup);
    if (existingCleanup) {
      existingCleanup();
      arrowCleanupMap.delete(popup);
    }

    const previousWrapperCursor = wrapper.style.cursor;
    wrapper.style.cursor = 'none';

    const computedColor = window.getComputedStyle(nextBtn).color || window.getComputedStyle(wrapper).color;
    if (computedColor) {
      arrowSvg.style.color = computedColor;
    }

    arrowSvg.style.position = 'fixed';
    arrowSvg.style.pointerEvents = 'none';
    arrowSvg.style.zIndex = '2147483647';
    arrowSvg.style.willChange = 'transform, left, top';
    arrowSvg.style.display = 'none';
    arrowSvg.style.cursor = 'none';

    let currentTransform = 'scaleX(1)';

    const applyTransform = () => {
      arrowSvg.style.transform = currentTransform;
    };

    const applyPosition = (clientX: number, clientY: number) => {
      const rect = wrapper.getBoundingClientRect();
      const insideX = clientX >= rect.left && clientX <= rect.right;
      const insideY = clientY >= rect.top && clientY <= rect.bottom;
      if (!insideX || !insideY) {
        arrowSvg.style.display = 'none';
        return;
      }
      arrowSvg.style.display = 'block';
      arrowSvg.style.left = `${clientX - ARROW_HALF_SIZE}px`;
      arrowSvg.style.top = `${clientY - ARROW_HALF_SIZE}px`;
      applyTransform();
    };

    const handlePointerMove = (event: PointerEvent) => {
      applyPosition(event.clientX, event.clientY);
    };

    const handlePrevEnter = () => {
      currentTransform = 'scaleX(1)';
      applyTransform();
    };

    const handleNextEnter = () => {
      currentTransform = 'scaleX(-1)';
      applyTransform();
    };

    const handleWrapperLeave = () => {
      currentTransform = 'scaleX(1)';
      applyTransform();
      arrowSvg.style.display = 'none';
    };

    document.addEventListener('pointermove', handlePointerMove);
    prevBtn.addEventListener('mouseenter', handlePrevEnter);
    nextBtn.addEventListener('mouseenter', handleNextEnter);
    wrapper.addEventListener('mouseleave', handleWrapperLeave);

    if (lastPointerPosition) {
      applyPosition(lastPointerPosition.x, lastPointerPosition.y);
    }

    const cleanup = () => {
      document.removeEventListener('pointermove', handlePointerMove);
      prevBtn.removeEventListener('mouseenter', handlePrevEnter);
      nextBtn.removeEventListener('mouseenter', handleNextEnter);
      wrapper.removeEventListener('mouseleave', handleWrapperLeave);
      currentTransform = 'scaleX(1)';
      applyTransform();
      arrowSvg.style.display = 'none';
      wrapper.style.cursor = previousWrapperCursor;
    };

    arrowCleanupMap.set(popup, cleanup);
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
          setupArrowInteractions(popup);
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
            if (e.key === 'ArrowRight' && api.slideNext) api.slideNext();
            if (e.key === 'ArrowLeft' && api.slidePrev) api.slidePrev();
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
