export const dvhTrickFixer = () => {
  const dvhElements = document.querySelectorAll('[dvh-trick]');

  if (dvhElements.length === 0) {
    return;
  }

  // Get root font size for rem calculations
  const getRootFontSize = (): number => {
    return parseFloat(getComputedStyle(document.documentElement).fontSize);
  };

  // Convert px to rem
  const pxToRem = (px: number): number => {
    return px / getRootFontSize();
  };

  // Fix dvh values for mobile breakpoints
  const fixDvhValues = () => {
    const isMobile = window.innerWidth <= 991;

    if (isMobile) {
      dvhElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        
        // Get computed height in pixels
        const computedHeight = htmlElement.getBoundingClientRect().height;
        
        // Convert to rem
        const heightInRem = pxToRem(computedHeight);
        
        // Set fixed height in rem
        htmlElement.style.height = `${heightInRem}rem`;

        // console.log(
        //   `DvhTrickFixer: Fixed element height to ${heightInRem.toFixed(2)}rem (was ${computedHeight}px)`
        // );
      });
    } else {
      // Reset to original dvh values on desktop
      dvhElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        // Remove inline height to let original CSS work
        htmlElement.style.removeProperty('height');
        // console.log('DvhTrickFixer: Reset to original dvh values (desktop mode)');
      });
    }
  };

  // Run on initial load
  fixDvhValues();

  // Listen for resize events to handle breakpoint changes
  let resizeTimeout: ReturnType<typeof setTimeout>;
  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      fixDvhValues();
    }, 250); // Debounce resize events
  };

  window.addEventListener('resize', handleResize);

  // Cleanup function
  return () => {
    window.removeEventListener('resize', handleResize);
  };
};

