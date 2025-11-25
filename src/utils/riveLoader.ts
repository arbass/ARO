export const riveLoader = () => {
  const rivePlaceholders = document.querySelectorAll<HTMLElement>('[rive-file-link]');

  if (!rivePlaceholders.length) {
    return;
  }

  const RIVE_SCRIPT_URL = 'https://unpkg.com/@rive-app/canvas@2.24.0';
  const RIVE_SCRIPT_ID = 'rive-app-canvas-script';
  const DEFAULT_ASPECT_RATIO = '2 / 1';

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
    const ratioFromAttr =
      sanitizeAspectRatio(placeholder.getAttribute('rive-aspect-ratio')) ||
      (() => {
        const width = Number(placeholder.getAttribute('rive-aspect-width'));
        const height = Number(placeholder.getAttribute('rive-aspect-height'));
        if (!width || !height) {
          return null;
        }
        return `${width} / ${height}`;
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
      console.error('rive-file-link attribute is missing');
      return;
    }

    const riveFileUrl = decodeHtmlEntities(riveFileUrlRaw);

    if (!riveFileUrl || riveFileUrl.indexOf('{{') !== -1) {
      console.error('Rive file URL is not set or contains placeholder');
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
        console.error('Rive library is not available');
        return;
      }

      const r = new rive.Rive({
        src: riveFileUrl,
        canvas,
        autoplay: true,
        stateMachines: 'bumpy',
        onLoad: () => {
          r.resizeDrawingSurfaceToCanvas();
        },
        onError: (err: Error) => {
          console.error('Rive error:', err);
        },
      });
    } catch (error) {
      console.error('Failed to initialize Rive:', error);
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

