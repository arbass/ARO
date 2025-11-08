export const anyVisualBeforeAfter = () => {
  const containers = document.querySelectorAll('.any-visual');

  if (!containers.length) return;

  containers.forEach((container) => {
    if (!(container instanceof HTMLElement)) return;

    const beforeEl = container.querySelector('.any-visual_before-after.is-before') as HTMLElement | null;
    const afterEl = container.querySelector('.any-visual_before-after.is-after') as HTMLElement | null;
    const divider = container.querySelector('.any-visual_divider') as HTMLElement | null;

    if (!beforeEl || !afterEl || !divider) return;

    // Setup base styles
    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    beforeEl.style.position = 'static';
    beforeEl.style.width = '100%';
    beforeEl.style.height = '100%';
    
    afterEl.style.position = 'absolute';
    afterEl.style.top = '0';
    afterEl.style.left = '0';
    afterEl.style.width = '100%';
    afterEl.style.height = '100%';

    divider.style.position = 'absolute';
    divider.style.top = '0';
    divider.style.bottom = '0';
    divider.style.width = '2px';
    divider.style.background = 'currentColor';
    divider.style.pointerEvents = 'none';
    divider.style.left = '50%';
    divider.style.zIndex = '10';

    // State
    let currentPosition = 0.5;
    let targetPosition = 0.5;
    let isAnimating = false;
    let animationFrame: number | null = null;
    let isFirstHover = true;

    // Check if desktop
    const isDesktop = () => window.innerWidth > 991;

    // Update visual position
    const updatePosition = (ratio: number) => {
      const clamped = Math.max(0, Math.min(1, ratio));
      const percent = clamped * 100;
      afterEl.style.clipPath = `inset(0 0 0 ${percent}%)`;
      divider.style.left = `${percent}%`;
      currentPosition = clamped;
    };

    // Initialize at center
    updatePosition(0.5);

    // Smooth animation to target
    const animateToTarget = () => {
      if (!isAnimating) return;

      const diff = targetPosition - currentPosition;
      const step = diff * 0.15; // Smooth easing factor

      if (Math.abs(diff) > 0.001) {
        updatePosition(currentPosition + step);
        animationFrame = requestAnimationFrame(animateToTarget);
      } else {
        updatePosition(targetPosition);
        isAnimating = false;
        isFirstHover = false; // Mark first hover as complete
        animationFrame = null;
      }
    };

    // Start smooth animation
    const startAnimation = (target: number) => {
      targetPosition = Math.max(0, Math.min(1, target));
      
      if (!isAnimating) {
        isAnimating = true;
        animateToTarget();
      }
    };

    // Stop animation
    const stopAnimation = () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      isAnimating = false;
    };

    // Mouse move handler
    const onMouseMove = (e: MouseEvent) => {
      if (!isDesktop()) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;

      if (isFirstHover) {
        // First hover: smooth animation
        startAnimation(ratio);
      } else if (isAnimating) {
        // Still animating from first hover: update target
        targetPosition = Math.max(0, Math.min(1, ratio));
      } else {
        // After first animation complete: instant update
        updatePosition(ratio);
      }
    };

    // Mouse enter handler
    const onMouseEnter = () => {
      if (!isDesktop()) return;
      stopAnimation();
      isFirstHover = true;
    };

    // Mouse leave handler
    const onMouseLeave = () => {
      if (!isDesktop()) return;
      stopAnimation();
      isFirstHover = true;
      startAnimation(0.5); // Smooth return to center
    };

    // Add event listeners
    container.addEventListener('mouseenter', onMouseEnter);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);

    // Cleanup
    const cleanup = () => {
      container.removeEventListener('mouseenter', onMouseEnter);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
      stopAnimation();
    };

    window.addEventListener('pagehide', cleanup, { once: true });
  });
};
