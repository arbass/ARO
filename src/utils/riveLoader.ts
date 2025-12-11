export const riveLoader = () => {
  const rivePlaceholders = document.querySelectorAll<HTMLElement>('[rive-file-link]');

  if (!rivePlaceholders.length) {
    return;
  }

  const RIVE_SCRIPT_URL = 'https://unpkg.com/@rive-app/canvas@2.24.0';
  const RIVE_SCRIPT_ID = 'rive-app-canvas-script';
  const DEFAULT_ASPECT_RATIO = '1 / 0.5';

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

  const normalizeAspectRatioString = (value: string | null): string | null => {
    if (!value) {
      return null;
    }

    const parts = value.split('/');
    if (parts.length !== 2) {
      return null;
    }

    const width = Number(parts[0].trim());
    const height = Number(parts[1].trim());
    return formatNormalizedAspectRatio(width, height);
  };

  const loadRiveScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.getElementById(RIVE_SCRIPT_ID)) {
        if (typeof window !== 'undefined' && (window as any).rive?.Rive) {
          resolve();
          return;
        }

        const checkRive = () => {
          if (typeof window !== 'undefined' && (window as any).rive?.Rive) {
            resolve();
          } else {
            requestAnimationFrame(checkRive);
          }
        };
        checkRive();
        return;
      }

      const script = document.createElement('script');
      script.id = RIVE_SCRIPT_ID;
      script.src = RIVE_SCRIPT_URL;
      script.async = true;
      script.onload = () => {
        const checkRive = () => {
          if (typeof window !== 'undefined' && (window as any).rive?.Rive) {
            resolve();
          } else {
            requestAnimationFrame(checkRive);
          }
        };
        checkRive();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Rive script'));
      };
      document.head.appendChild(script);
    });
  };

  const decodeHtmlEntities = (str: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
  };

  const sanitizeAspectRatio = (value: string | null): string | null => {
    if (!value) {
      return null;
    }

    const cleaned = value.replace(/[^0-9:/.\s]/g, '').trim();
    if (!cleaned) {
      return null;
    }

    if (cleaned.includes('/')) {
      return cleaned;
    }

    if (cleaned.includes(':')) {
      return cleaned.replace(':', ' / ');
    }

    const numbers = cleaned.split(/\s+/).map(Number).filter((n) => !Number.isNaN(n));
    if (numbers.length === 2) {
      return `${numbers[0]} / ${numbers[1]}`;
    }

    return null;
  };

  const applyAspectRatio = (placeholder: HTMLElement) => {
    const ratioFromAttr = (() => {
      const sanitizedRatio = sanitizeAspectRatio(placeholder.getAttribute('rive-aspect-ratio'));
      const normalizedFromRatio = normalizeAspectRatioString(sanitizedRatio);
      if (normalizedFromRatio) {
        return normalizedFromRatio;
      }

      const widthAttr = placeholder.getAttribute('rive-aspect-width');
      const heightAttr = placeholder.getAttribute('rive-aspect-height');
      if (!widthAttr || !heightAttr) {
        return null;
      }

      const width = Number(widthAttr);
      const height = Number(heightAttr);
      return formatNormalizedAspectRatio(width, height);
    })();

    if (ratioFromAttr) {
      placeholder.style.aspectRatio = ratioFromAttr;
      return;
    }

    if (!placeholder.style.aspectRatio) {
      placeholder.style.aspectRatio = DEFAULT_ASPECT_RATIO;
    }
  };

  const initRive = async (placeholder: HTMLElement) => {
    const riveFileUrlRaw = placeholder.getAttribute('rive-file-link');

    if (!riveFileUrlRaw) {
      // console.error('rive-file-link attribute is missing');
      return;
    }

    const riveFileUrl = decodeHtmlEntities(riveFileUrlRaw);

    if (!riveFileUrl || riveFileUrl.indexOf('{{') !== -1) {
      // console.error('Rive file URL is not set or contains placeholder');
      return;
    }

    if (placeholder.querySelector('canvas')) {
      return;
    }

    applyAspectRatio(placeholder);

    const canvas = document.createElement('canvas');
    canvas.classList.add('rive-canvas');

    placeholder.replaceChildren(canvas);

    try {
      await loadRiveScript();

      const rive = (window as any).rive;
      if (!rive?.Rive) {
        // console.error('Rive library is not available');
        return;
      }

      const r = new rive.Rive({
        src: riveFileUrl,
        canvas,
        autoplay: true,
        stateMachines: 'bumpy',
        fit: rive.Fit.Cover,
        alignment: rive.Alignment.Center,
        onLoad: () => {
          // Get Rive file dimensions and update aspect ratio if not set via attributes
          try {
            // Try to get dimensions from artboard
            const artboard = r.artboard;
            if (artboard) {
              const riveWidth = artboard.width;
              const riveHeight = artboard.height;
              
              if (riveWidth > 0 && riveHeight > 0) {
                const normalizedRatio = formatNormalizedAspectRatio(riveWidth, riveHeight);
                if (normalizedRatio) {
                  // Only update if aspect ratio wasn't set via attributes
                  const hasAttrRatio = placeholder.getAttribute('rive-aspect-ratio') || 
                                      (placeholder.getAttribute('rive-aspect-width') && placeholder.getAttribute('rive-aspect-height'));
                  
                  if (!hasAttrRatio) {
                    placeholder.style.aspectRatio = normalizedRatio;
                  }
                }
              }
            } else {
              // Fallback: try to get from bounds
              const bounds = r.bounds;
              if (bounds && bounds.minX !== undefined && bounds.minY !== undefined && bounds.maxX !== undefined && bounds.maxY !== undefined) {
                const riveWidth = bounds.maxX - bounds.minX;
                const riveHeight = bounds.maxY - bounds.minY;
                
                if (riveWidth > 0 && riveHeight > 0) {
                  const normalizedRatio = formatNormalizedAspectRatio(riveWidth, riveHeight);
                  if (normalizedRatio) {
                    const hasAttrRatio = placeholder.getAttribute('rive-aspect-ratio') || 
                                        (placeholder.getAttribute('rive-aspect-width') && placeholder.getAttribute('rive-aspect-height'));
                    
                    if (!hasAttrRatio) {
                      placeholder.style.aspectRatio = normalizedRatio;
                    }
                  }
                }
              }
            }
          } catch (error) {
            // If dimensions are not available, continue with existing aspect ratio
            // console.warn('Could not get Rive dimensions for aspect ratio calculation', error);
          }
          
          r.resizeDrawingSurfaceToCanvas();
        },
        onError: (err: Error) => {
          // console.error('Rive error:', err);
        },
      });
    } catch (error) {
      // console.error('Failed to initialize Rive:', error);
    }
  };

  rivePlaceholders.forEach((placeholder) => {
    initRive(placeholder);
  });

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (node.hasAttribute('rive-file-link')) {
            initRive(node);
          }
          const nestedPlaceholders = node.querySelectorAll<HTMLElement>('[rive-file-link]');
          nestedPlaceholders.forEach((placeholder) => {
            initRive(placeholder);
          });
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

