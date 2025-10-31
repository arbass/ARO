export const studioSwipers = () => {
  // Check if studio page swiper containers exist
  const studioSwipers = document.querySelectorAll('.swiper.is-studio-page');
  if (!studioSwipers.length) {
    return;
  }

  let assetsLoaded = false;
  let loadingPromise: Promise<void> | null = null;

  // Ensure Swiper CSS and JS are loaded
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

  // Initialize all studio swipers
  const initStudioSwipers = () => {
    type SwiperConstructor = new (
      elementOrSelector: HTMLElement | string,
      options: Record<string, unknown>
    ) => unknown;
    const SwiperCtor = (window as unknown as { Swiper?: unknown }).Swiper as
      | SwiperConstructor
      | undefined;
    if (typeof SwiperCtor !== 'function') return;

    const swiperContainers = Array.from(
      document.querySelectorAll('.swiper.is-studio-page')
    ) as HTMLElement[];

    swiperContainers.forEach((container, index) => {
      if (container.getAttribute('data-swiper-initialized') === 'true') return;

      // Add unique class to avoid selector collisions
      const uniqueClass = `is-studio-swiper-${index + 1}`;
      container.classList.add(uniqueClass);

      // Find pagination element and add unique class
      const pagination = container.querySelector(
        '.swiper-pagination.is-studio-page'
      ) as HTMLElement | null;
      if (pagination) {
        pagination.classList.add(uniqueClass);
      }

      // Initialize Swiper with pagination
      const options: Record<string, unknown> = {
        direction: 'horizontal',
        loop: false,
        slidesPerView: 1,
        pagination: pagination
          ? {
              el: pagination,
              clickable: true,
            }
          : { enabled: false },
      };

      new SwiperCtor(container, options);
      container.setAttribute('data-swiper-initialized', 'true');
    });
  };

  // Load Swiper assets and initialize
  ensureSwiperAssets().then(() => {
    // Wait for layout to update so Swiper can measure sizes correctly
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        initStudioSwipers();
      });
    });
  });
};

