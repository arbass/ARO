export const studioSliderLabels = () => {
  // Check if studio slider wrappers exist
  const sliderWrappers = document.querySelectorAll('[studio-slider-wrapper]');
  if (!sliderWrappers.length) {
    return;
  }

  // Process each slider wrapper
  sliderWrappers.forEach((wrapper) => {
    const label = wrapper.querySelector('[studio-slider-wrapper_label]') as HTMLElement | null;
    const slides = wrapper.querySelectorAll('[studio-slider-wrapper_slide]') as NodeListOf<HTMLElement>;

    if (!label || !slides.length) {
      return;
    }

    // Add transition to label for smooth text changes
    label.style.transition = 'opacity 100ms ease-in-out';

    // Function to update label text with transition
    const updateLabel = (activeSlide: HTMLElement) => {
      const newText = activeSlide.getAttribute('studio-slider-wrapper_slide') || '';
      
      // Fade out
      label.style.opacity = '0';
      
      // Update text after fade out
      setTimeout(() => {
        label.textContent = newText;
        // Fade in
        label.style.opacity = '1';
      }, 100);
    };

    // Create observer to watch for active slide changes
    const observer = new MutationObserver(() => {
      // Find active slide (usually has class 'is-active' or 'swiper-slide-active')
      let activeSlide = wrapper.querySelector('[studio-slider-wrapper_slide].is-active') as HTMLElement | null;
      
      // Fallback: check for swiper active class
      if (!activeSlide) {
        activeSlide = wrapper.querySelector('[studio-slider-wrapper_slide].swiper-slide-active') as HTMLElement | null;
      }
      
      // Fallback: use first slide if no active slide found
      if (!activeSlide && slides.length > 0) {
        activeSlide = slides[0];
      }

      if (activeSlide) {
        updateLabel(activeSlide);
      }
    });

    // Start observing the wrapper for class changes
    observer.observe(wrapper, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
    });

    // Initialize with first active slide or first slide
    let initialSlide = wrapper.querySelector('[studio-slider-wrapper_slide].is-active') as HTMLElement | null;
    if (!initialSlide) {
      initialSlide = wrapper.querySelector('[studio-slider-wrapper_slide].swiper-slide-active') as HTMLElement | null;
    }
    if (!initialSlide && slides.length > 0) {
      initialSlide = slides[0];
    }

    if (initialSlide) {
      label.textContent = initialSlide.getAttribute('studio-slider-wrapper_slide') || '';
      label.style.opacity = '1';
    }
  });
};

