/**
 * Popup Video Lazy Load
 * 
 * Activates videos only in the active swiper slide when popup opens.
 * Handles slide changes to load videos on demand.
 */

export const popupVideoLazyLoad = () => {
  const cards = Array.from(document.querySelectorAll('[card-ar-lab]')) as HTMLElement[];
  if (!cards.length) {
    return;
  }

  /**
   * Activate video in a specific slide by renaming lazy-* attributes to normal ones
   */
  const activateVideoInSlide = (slide: HTMLElement) => {
    // Find all video sources with lazy-src
    const sources = slide.querySelectorAll('source[lazy-src]') as NodeListOf<HTMLSourceElement>;
    sources.forEach((source) => {
      const lazySrc = source.getAttribute('lazy-src');
      if (lazySrc) {
        source.setAttribute('src', lazySrc);
        source.removeAttribute('lazy-src');
      }
    });

    // Find Webflow background video containers with lazy-data-video-urls
    const wfContainers = slide.querySelectorAll('[lazy-data-video-urls]') as NodeListOf<HTMLElement>;
    wfContainers.forEach((container) => {
      const lazyUrls = container.getAttribute('lazy-data-video-urls');
      if (lazyUrls) {
        container.setAttribute('data-video-urls', lazyUrls);
        container.removeAttribute('lazy-data-video-urls');
      }

      // Also restore poster URL if present
      const lazyPoster = container.getAttribute('lazy-data-poster-url');
      if (lazyPoster) {
        container.setAttribute('data-poster-url', lazyPoster);
        container.removeAttribute('lazy-data-poster-url');
      }
    });

    // Find and load all video elements
    const videos = slide.querySelectorAll('video') as NodeListOf<HTMLVideoElement>;
    videos.forEach((video) => {
      // Trigger load
      video.load();

      // Play if autoplay is set
      if (video.hasAttribute('autoplay')) {
        video.play().catch(() => {
          // Autoplay might be blocked, that's ok
        });
      }
    });
  };

  /**
   * Pause all videos in a slide
   */
  const pauseVideosInSlide = (slide: HTMLElement) => {
    const videos = slide.querySelectorAll('video') as NodeListOf<HTMLVideoElement>;
    videos.forEach((video) => {
      if (!video.paused) {
        video.pause();
      }
    });
  };

  /**
   * Handle popup open - activate video in active slide
   */
  const handlePopupOpen = (popup: HTMLElement) => {
    // Find swiper container
    const swiperContainer = popup.querySelector('.swiper.is-ar-lab_popup') as HTMLElement | null;
    if (!swiperContainer) {
      return;
    }

    // Find active slide
    const activeSlide = swiperContainer.querySelector('.swiper-slide-active') as HTMLElement | null;
    if (activeSlide) {
      activateVideoInSlide(activeSlide);
    }

    // Setup swiper slide change observer
    setupSwiperObserver(swiperContainer);
  };

  /**
   * Setup observer for swiper slide changes
   */
  const setupSwiperObserver = (swiperContainer: HTMLElement) => {
    // Check if already initialized
    if (swiperContainer.hasAttribute('data-video-lazy-initialized')) {
      return;
    }
    swiperContainer.setAttribute('data-video-lazy-initialized', 'true');

    // Create observer to watch for active slide changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const slide = mutation.target as HTMLElement;

          // Check if this slide just became active
          if (slide.classList.contains('swiper-slide-active')) {
            activateVideoInSlide(slide);
          }
          // Check if this slide is no longer active
          else if (mutation.oldValue?.includes('swiper-slide-active')) {
            pauseVideosInSlide(slide);
          }
        }
      });
    });

    // Observe all slides
    const slides = swiperContainer.querySelectorAll('.swiper-slide') as NodeListOf<HTMLElement>;
    slides.forEach((slide) => {
      observer.observe(slide, {
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ['class'],
      });
    });
  };

  /**
   * Watch for popup visibility changes
   */
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-popup-visible') {
        const popup = mutation.target as HTMLElement;
        const isVisible = popup.getAttribute('data-popup-visible') === 'true';

        if (isVisible) {
          // Small delay to ensure swiper is initialized
          setTimeout(() => {
            handlePopupOpen(popup);
          }, 100);
        }
      }
    });
  });

  // Observe all popups
  cards.forEach((card) => {
    const popup = card.querySelector('[ar-lab_popup]') as HTMLElement | null;
    if (popup) {
      observer.observe(popup, {
        attributes: true,
        attributeFilter: ['data-popup-visible'],
      });
    }
  });
};

