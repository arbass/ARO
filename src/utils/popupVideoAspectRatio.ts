export const popupVideoAspectRatio = () => {
  const videoContainers = document.querySelectorAll('.popup-video-new');

  if (!videoContainers.length) {
    return;
  }

  const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = url;
    });
  };

  const adjustContainerSize = (container: HTMLElement, videoAspectRatio: number) => {
    const parent = container.parentElement;
    if (!parent) return;

    const parentWidth = parent.clientWidth;
    const parentHeight = parent.clientHeight;
    
    if (!parentWidth || !parentHeight) return;

    const parentAspectRatio = parentWidth / parentHeight;

    // Determine which dimension constrains the video
    if (videoAspectRatio > parentAspectRatio) {
      // Video is wider - constrained by width
      container.style.width = '100%';
      container.style.height = 'auto';
    } else {
      // Video is taller - constrained by height
      container.style.width = 'auto';
      container.style.height = '100%';
    }
  };

  const adjustContainerSizeWithRetry = (container: HTMLElement, videoAspectRatio: number, retries = 3) => {
    const parent = container.parentElement;
    if (!parent) return;

    // Check if parent has valid dimensions
    const parentWidth = parent.clientWidth;
    const parentHeight = parent.clientHeight;
    
    if ((!parentWidth || !parentHeight) && retries > 0) {
      // Parent not yet rendered, retry after next frame
      requestAnimationFrame(() => {
        adjustContainerSizeWithRetry(container, videoAspectRatio, retries - 1);
      });
      return;
    }

    // Apply the adjustment
    adjustContainerSize(container, videoAspectRatio);
  };

  const applyAspectRatio = async (container: HTMLElement) => {
    const videoElement = container.querySelector('video') as HTMLVideoElement | null;
    
    if (!videoElement) {
      return;
    }

    const setRatioFromVideo = () => {
      const width = videoElement.videoWidth;
      const height = videoElement.videoHeight;

      if (width && height && width > 0 && height > 0) {
        const aspectRatio = width / height;
        container.style.aspectRatio = `${aspectRatio}`;
        container.setAttribute('data-aspect-ratio', String(aspectRatio));
        
        // Adjust size to fit within parent with retry logic
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            adjustContainerSizeWithRetry(container, aspectRatio);
          });
        });
        
        return true;
      }
      return false;
    };

    // Try to get dimensions from video metadata
    if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
      if (setRatioFromVideo()) {
        return;
      }
    }

    // Listen for metadata load
    const handleLoadedMetadata = () => {
      setRatioFromVideo();
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Fallback: try to get dimensions from poster image
    const posterUrl = videoElement.poster || videoElement.style.backgroundImage?.match(/url\(['"]?([^'"]+)['"]?\)/)?.[1];
    
    if (posterUrl) {
      try {
        const dimensions = await getImageDimensions(posterUrl);
        if (dimensions.width && dimensions.height) {
          const aspectRatio = dimensions.width / dimensions.height;
          container.style.aspectRatio = `${aspectRatio}`;
          container.setAttribute('data-aspect-ratio', String(aspectRatio));
          
          // Adjust size with retry logic
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              adjustContainerSizeWithRetry(container, aspectRatio);
            });
          });
        }
      } catch (e) {
        // If poster loading fails, keep default aspect ratio from CSS
        // console.warn('Could not load poster dimensions for aspect ratio calculation', e);
      }
    }
  };

  // Recalculate on window resize
  const handleResize = () => {
    videoContainers.forEach((containerElement) => {
      const container = containerElement as HTMLElement;
      const aspectRatioStr = container.getAttribute('data-aspect-ratio');
      if (aspectRatioStr) {
        const aspectRatio = parseFloat(aspectRatioStr);
        adjustContainerSize(container, aspectRatio);
      }
    });
  };

  // Apply to existing containers
  videoContainers.forEach((containerElement) => {
    const container = containerElement as HTMLElement;
    applyAspectRatio(container);
  });

  // Listen for resize events
  window.addEventListener('resize', handleResize);

  // Observer for dynamically added containers (e.g., in Swiper)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          // Check if the added node itself is a video container
          if (node.classList.contains('popup-video-new')) {
            applyAspectRatio(node);
          }
          // Check for video containers within the added node
          const nestedContainers = node.querySelectorAll('.popup-video-new');
          nestedContainers.forEach((container) => {
            applyAspectRatio(container as HTMLElement);
          });
        }
      });
    });
  });

  // Observe the entire document for dynamic additions
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Export function to recalculate video proportions (useful when popup opens)
  (window as Window & { recalculatePopupVideoAspectRatios?: () => void }).recalculatePopupVideoAspectRatios = () => {
    const allContainers = document.querySelectorAll('.popup-video-new');
    allContainers.forEach((containerElement) => {
      const container = containerElement as HTMLElement;
      const aspectRatioStr = container.getAttribute('data-aspect-ratio');
      if (aspectRatioStr) {
        const aspectRatio = parseFloat(aspectRatioStr);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            adjustContainerSizeWithRetry(container, aspectRatio);
          });
        });
      }
    });
  };
};

