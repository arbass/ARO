export const anyVisualBeforeAfter = () => {
  const containers = document.querySelectorAll('.any-visual');

  if (!containers.length) return;

  containers.forEach((container) => {
    if (!(container instanceof HTMLElement)) return;

    const beforeEl = container.querySelector('.any-visual_before-after.is-before') as HTMLElement | null;
    const afterEl = container.querySelector('.any-visual_before-after.is-after') as HTMLElement | null;
    const divider = container.querySelector('.any-visual_divider') as HTMLElement | null;

    if (!beforeEl || !afterEl || !divider) return;

    // Ensure base styles only once per container
    container.style.position ||= 'relative';
    container.style.overflow ||= 'hidden';

    // Prepare layers - before is static, after is positioned absolute
    beforeEl.style.position = 'static';
    beforeEl.style.width = '100%';
    beforeEl.style.height = '100%';
    
    afterEl.style.position = 'absolute';
    afterEl.style.top = '0';
    afterEl.style.left = '0';
    afterEl.style.width = '100%';
    afterEl.style.height = '100%';

    // Divider visuals
    divider.style.position = 'absolute';
    divider.style.top = '0';
    divider.style.bottom = '0';
    divider.style.width = '2px';
    divider.style.background = 'currentColor';
    divider.style.pointerEvents = 'none';
    divider.style.left = '50%';
    divider.style.zIndex = '10';

    // Clip helpers
    const setBeforeWidth = (ratio: number, animated = false) => {
      const clamped = Math.max(0, Math.min(1, ratio));
      const percent = clamped * 100;
      
      if (animated) {
        // Add smooth transition for elegant return to center
        afterEl.style.transition = 'clip-path 300ms ease-out';
        divider.style.transition = 'left 300ms ease-out';
      } else {
        // Remove transition for immediate cursor following
        afterEl.style.transition = 'none';
        divider.style.transition = 'none';
      }
      
      // Clip the after layer to show only the right part
      afterEl.style.clipPath = `inset(0 0 0 ${percent}%)`;
      divider.style.left = `${percent}%`;
    };

    // Initial state at 50/50
    setBeforeWidth(0.5);

    // Check if desktop (hover enabled only on >991px)
    const isDesktop = () => window.innerWidth > 991;

    // Mouse tracking behavior (desktop only)
    const onMouseMove = (e: MouseEvent) => {
      if (!isDesktop()) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;
      setBeforeWidth(ratio, false); // No animation when following cursor
    };

    const onMouseEnter = () => {
      if (isDesktop()) {
        container.addEventListener('mousemove', onMouseMove);
      }
    };

    const onMouseLeave = () => {
      if (isDesktop()) {
        container.removeEventListener('mousemove', onMouseMove);
        setBeforeWidth(0.5, true); // Smooth animation when leaving
      }
    };

    // Setup event listeners
    container.addEventListener('mouseenter', onMouseEnter);
    container.addEventListener('mouseleave', onMouseLeave);

    // Defensive cleanup for SPA-like environments
    const disconnect = () => {
      container.removeEventListener('mouseenter', onMouseEnter);
      container.removeEventListener('mouseleave', onMouseLeave);
      container.removeEventListener('mousemove', onMouseMove);
    };

    // Attach cleanup on pagehide if supported
    window.addEventListener('pagehide', disconnect, { once: true });
  });
};


