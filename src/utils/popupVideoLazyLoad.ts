/**
 * Popup Video Lazy Load
 *
 * Activates videos only in the active swiper slide when popup opens.
 * Handles slide changes to load videos on demand.
 *
 * IMPORTANT: protectVideosFromAutoload() runs immediately on module import
 * to prevent Webflow Background Video from auto-loading all videos.
 */

/**
 * Protect videos from Webflow auto-loading by moving lazy-video-smart-url
 * to a safe attribute that Webflow won't read.
 * This MUST run before Webflow Background Video script initializes.
 */
const protectVideosFromAutoload = () => {
  // Only protect videos inside popups (ar-lab_popup)
  const popupSmartContainers = document.querySelectorAll(
    '[ar-lab_popup] [lazy-video-smart-url]'
  ) as NodeListOf<HTMLElement>;

  popupSmartContainers.forEach((container) => {
    const videoUrl = container.getAttribute('lazy-video-smart-url');
    const posterUrl = container.getAttribute('lazy-video-smart-url-image-placeholder');

    if (videoUrl) {
      // Save URL to our own protected attribute
      container.setAttribute('data-protected-video-url', videoUrl);
      // Remove the attribute that Webflow reads
      container.removeAttribute('lazy-video-smart-url');
    }

    if (posterUrl) {
      // Save poster URL
      container.setAttribute('data-protected-poster-url', posterUrl);
      container.removeAttribute('lazy-video-smart-url-image-placeholder');
    }

    // Also prevent video element from loading by removing preload and source src
    const wfContainer = container.querySelector('.w-background-video') as HTMLElement | null;
    if (wfContainer) {
      const video = wfContainer.querySelector('video') as HTMLVideoElement | null;
      const source = wfContainer.querySelector('source') as HTMLSourceElement | null;

      if (video) {
        // Set preload to none to prevent any loading
        video.preload = 'none';
        // Remove autoplay temporarily (will restore on popup open)
        if (video.hasAttribute('autoplay')) {
          video.removeAttribute('autoplay');
          video.setAttribute('data-was-autoplay', 'true');
        }
      }

      if (source) {
        // Remove src if it was set, save to lazy-src
        const src = source.getAttribute('src');
        if (src) {
          source.setAttribute('lazy-src', src);
          source.removeAttribute('src');
        }
      }
    }
  });
};

// Run protection immediately when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', protectVideosFromAutoload);
} else {
  // DOM already loaded, run immediately
  protectVideosFromAutoload();
}

export const popupVideoLazyLoad = () => {
  const cards = Array.from(document.querySelectorAll('[card-ar-lab]')) as HTMLElement[];
  if (!cards.length) {
    return;
  }

  /**
   * Activate video in a specific slide by renaming lazy-* attributes to normal ones
   */
  const activateVideoInSlide = (slide: HTMLElement) => {
    // Handle protected video containers (videos protected from Webflow autoload)
    const protectedContainers = slide.querySelectorAll(
      '[data-protected-video-url]'
    ) as NodeListOf<HTMLElement>;
    protectedContainers.forEach((container) => {
      const videoUrl = container.getAttribute('data-protected-video-url');
      const posterUrl = container.getAttribute('data-protected-poster-url');

      if (videoUrl) {
        // Find the Webflow background video container inside
        const wfContainer = container.querySelector(
          '.w-background-video'
        ) as HTMLElement | null;
        if (wfContainer) {
          // Set video URLs on the container
          wfContainer.setAttribute('data-video-urls', videoUrl);

          // Set poster URL if present
          if (posterUrl) {
            wfContainer.setAttribute('data-poster-url', posterUrl);
          }

          // Find source element and set src
          const source = wfContainer.querySelector('source') as HTMLSourceElement | null;
          if (source) {
            source.setAttribute('src', videoUrl);
          }

          // Find video element and configure
          const video = wfContainer.querySelector('video') as HTMLVideoElement | null;
          if (video) {
            if (posterUrl) {
              video.style.backgroundImage = `url('${posterUrl}')`;
            }
            // Restore autoplay if it was removed
            if (video.getAttribute('data-was-autoplay') === 'true') {
              video.setAttribute('autoplay', '');
              video.removeAttribute('data-was-autoplay');
            }
            // Enable loading now
            video.preload = 'auto';
          }
        }

        // Remove protected attributes after processing
        container.removeAttribute('data-protected-video-url');
        container.removeAttribute('data-protected-poster-url');
      }
    });

    // LEGACY: Handle smart lazy video containers (v2 structure) - for non-popup videos
    const smartContainers = slide.querySelectorAll(
      '[lazy-video-smart-url]'
    ) as NodeListOf<HTMLElement>;
    smartContainers.forEach((smartContainer) => {
      const videoUrl = smartContainer.getAttribute('lazy-video-smart-url');
      const posterUrl = smartContainer.getAttribute('lazy-video-smart-url-image-placeholder');

      if (videoUrl) {
        // Find the Webflow background video container inside
        const wfContainer = smartContainer.querySelector(
          '.w-background-video'
        ) as HTMLElement | null;
        if (wfContainer) {
          // Set video URLs on the container
          wfContainer.setAttribute('data-video-urls', videoUrl);

          // Set poster URL if present
          if (posterUrl) {
            wfContainer.setAttribute('data-poster-url', posterUrl);
          }

          // Find source element and set src
          const source = wfContainer.querySelector('source') as HTMLSourceElement | null;
          if (source) {
            source.setAttribute('src', videoUrl);
          }

          // Find video element and set background image
          const video = wfContainer.querySelector('video') as HTMLVideoElement | null;
          if (video && posterUrl) {
            video.style.backgroundImage = `url('${posterUrl}')`;
          }
        }

        // Remove smart attributes after processing
        smartContainer.removeAttribute('lazy-video-smart-url');
        smartContainer.removeAttribute('lazy-video-smart-url-image-placeholder');
      }
    });

    // OLD: Find all video sources with lazy-src (legacy structure)
    const sources = slide.querySelectorAll('source[lazy-src]') as NodeListOf<HTMLSourceElement>;
    sources.forEach((source) => {
      const lazySrc = source.getAttribute('lazy-src');
      if (lazySrc) {
        source.setAttribute('src', lazySrc);
        source.removeAttribute('lazy-src');
      }
    });

    // OLD: Find Webflow background video containers with lazy-data-video-urls (legacy structure)
    const wfContainers = slide.querySelectorAll(
      '[lazy-data-video-urls]'
    ) as NodeListOf<HTMLElement>;
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
