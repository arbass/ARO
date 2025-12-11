export const embedVideoAspectRatio = () => {
  // Support both old .embed_video and new .w-background-video containers
  const oldContainers = document.querySelectorAll('.embed_video');
  const newContainers = document.querySelectorAll('.w-background-video');

  // Combine both types of containers
  const embedVideoContainers = [...Array.from(oldContainers), ...Array.from(newContainers)];

  if (!embedVideoContainers.length) {
    return;
  }

  const formatNormalizedAspectRatio = (width: number, height: number): string | null => {
    if (!width || !height || width <= 0 || height <= 0) {
      return null;
    }

    const normalizedHeight = height / width;
    if (!Number.isFinite(normalizedHeight) || normalizedHeight <= 0) {
      return null;
    }

    const rounded = Number(normalizedHeight.toFixed(4));
    return `1 / ${rounded}`;
  };

  const setNormalizedAspectRatio = (
    target: HTMLElement,
    width: number,
    height: number
  ): boolean => {
    const normalizedRatio = formatNormalizedAspectRatio(width, height);
    if (!normalizedRatio) {
      return false;
    }

    target.style.aspectRatio = normalizedRatio;
    return true;
  };

  const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = url;
    });
  };

  const getVideoDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve({ width: video.videoWidth, height: video.videoHeight });
        video.src = '';
        video.load();
      };
      video.onerror = reject;
      video.src = url;
    });
  };

  const decodeHtmlEntities = (str: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
  };

  const setupEmbedVideo = (container: HTMLElement) => {
    let imageCoverUrlRaw: string | null = null;
    let videoFileUrlRaw: string | null = null;

    // Handle different container types
    if (container.classList.contains('embed_video')) {
      // Old embed_video container - attributes are directly on this element
      imageCoverUrlRaw = container.getAttribute('embed_video-image-cover');
      videoFileUrlRaw = container.getAttribute('embed_video-file');
    } else if (container.classList.contains('w-background-video')) {
      // New w-background-video container - check various sources for attributes
      imageCoverUrlRaw = container.getAttribute('embed_video-image-cover');
      videoFileUrlRaw = container.getAttribute('embed_video-file');

      // Check for embed_video parent element (legacy support)
      if (!imageCoverUrlRaw && !videoFileUrlRaw) {
        const embedVideoParent = container.closest('[embed_video]') as HTMLElement | null;
        if (embedVideoParent) {
          imageCoverUrlRaw = embedVideoParent.getAttribute('embed_video-image-cover');
          videoFileUrlRaw = embedVideoParent.getAttribute('embed_video-file');
        }
      }

      // Check for new attributes on container or parent for backward compatibility
      if (!imageCoverUrlRaw && !videoFileUrlRaw) {
        const parentPopup = container.closest('.popup-video-new') as HTMLElement | null;
        if (parentPopup) {
          imageCoverUrlRaw = parentPopup.getAttribute('lazy-video-smart-url-image-placeholder');
          videoFileUrlRaw = parentPopup.getAttribute('lazy-video-smart-url');
        }
      }

      // Also check on container itself for new attributes
      if (!imageCoverUrlRaw) {
        imageCoverUrlRaw = container.getAttribute('lazy-video-smart-url-image-placeholder');
      }
      if (!videoFileUrlRaw) {
        videoFileUrlRaw = container.getAttribute('lazy-video-smart-url');
      }
    }

    if (!imageCoverUrlRaw && !videoFileUrlRaw) {
      return;
    }

    const imageCoverUrl = imageCoverUrlRaw ? decodeHtmlEntities(imageCoverUrlRaw) : null;
    const videoFileUrl = videoFileUrlRaw ? decodeHtmlEntities(videoFileUrlRaw) : null;

    const videoElement = container.querySelector('video') as HTMLVideoElement | null;
    const parentDiv = videoElement?.closest('.w-background-video') as HTMLElement | null;
    const sourceElement = videoElement?.querySelector('source') as HTMLSourceElement | null;

    // Set image cover (poster)
    if (imageCoverUrl && parentDiv && videoElement) {
      parentDiv.setAttribute('data-poster-url', imageCoverUrl);
      videoElement.style.backgroundImage = `url('${imageCoverUrl.replace(/'/g, "\\'")}')`;
      videoElement.poster = imageCoverUrl;
    }

    // Set video file
    if (videoFileUrl && parentDiv && sourceElement) {
      parentDiv.setAttribute('data-video-urls', videoFileUrl);
      sourceElement.src = videoFileUrl;
      sourceElement.setAttribute('src', videoFileUrl);
      if (videoElement) {
        videoElement.src = videoFileUrl;
        // Initialize video element
        videoElement.load();
        // Auto-play if specified
        if (videoElement.hasAttribute('autoplay')) {
          videoElement.play().catch(() => {
            // Autoplay might be blocked, that's ok
          });
        }
      }
    }
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
        return setNormalizedAspectRatio(container, width, height);
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

    // Fallback 1: try to get dimensions from poster image
    const posterUrl =
      videoElement.poster ||
      videoElement.style.backgroundImage?.match(/url\(['"]?([^'"]+)['"]?\)/)?.[1];

    if (posterUrl) {
      try {
        const dimensions = await getImageDimensions(posterUrl);
        if (dimensions.width && dimensions.height) {
          if (setNormalizedAspectRatio(container, dimensions.width, dimensions.height)) {
            return;
          }
        }
      } catch {
        // Continue to next fallback
      }
    }

    // Fallback 2: try to get dimensions from data-poster-url attribute on parent
    const parentDiv = videoElement.closest('.w-background-video');
    if (parentDiv instanceof HTMLElement) {
      const dataPosterUrl = parentDiv.getAttribute('data-poster-url');
      if (dataPosterUrl) {
        try {
          const dimensions = await getImageDimensions(dataPosterUrl);
          if (dimensions.width && dimensions.height) {
            if (setNormalizedAspectRatio(container, dimensions.width, dimensions.height)) {
              return;
            }
          }
        } catch {
          // Continue to next fallback
        }
      }
    }

    // Fallback 3: try to get dimensions from video source URL
    const sourceElement = videoElement.querySelector('source');
    if (sourceElement) {
      const videoUrl = sourceElement.src || sourceElement.getAttribute('src');
      if (videoUrl) {
        try {
          const dimensions = await getVideoDimensions(videoUrl);
          if (dimensions.width && dimensions.height) {
            if (setNormalizedAspectRatio(container, dimensions.width, dimensions.height)) {
              return;
            }
          }
        } catch {
          // If all fallbacks fail, keep default aspect ratio from CSS
        }
      }
    }

    // Fallback 4: try to get dimensions from data-video-urls attribute on parent
    if (parentDiv instanceof HTMLElement) {
      const dataVideoUrls = parentDiv.getAttribute('data-video-urls');
      if (dataVideoUrls) {
        try {
          const dimensions = await getVideoDimensions(dataVideoUrls);
          if (dimensions.width && dimensions.height) {
            if (setNormalizedAspectRatio(container, dimensions.width, dimensions.height)) {
              return;
            }
          }
        } catch {
          // Could not determine video aspect ratio from data-video-urls
        }
      }
    }
  };

  // Apply to existing containers
  embedVideoContainers.forEach((containerElement) => {
    const container = containerElement as HTMLElement;
    setupEmbedVideo(container);
    applyAspectRatio(container);
  });

  // Observer for dynamically added containers
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          // Check if the added node itself is an embed_video or w-background-video container
          if (
            node.classList.contains('embed_video') ||
            node.classList.contains('w-background-video')
          ) {
            setupEmbedVideo(node);
            applyAspectRatio(node);
          }
          // Check for embed_video or w-background-video containers within the added node
          const nestedOldContainers = node.querySelectorAll('.embed_video');
          const nestedNewContainers = node.querySelectorAll('.w-background-video');
          const nestedContainers = [
            ...Array.from(nestedOldContainers),
            ...Array.from(nestedNewContainers),
          ];

          nestedContainers.forEach((container) => {
            setupEmbedVideo(container as HTMLElement);
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
};
