export const studioSliderLabels = () => {
  // Check if studio slider wrappers exist
  const sliderWrappers = document.querySelectorAll('[studio-slider-wrapper]');
  if (!sliderWrappers.length) {
    return;
  }

  // Process each slider wrapper
  sliderWrappers.forEach((wrapper) => {
    const label = wrapper.querySelector('[studio-slider-wrapper_label]') as HTMLElement | null;

    if (!label) {
      return;
    }

    // Add transition to label for smooth text changes
    label.style.transition = 'opacity 100ms ease-in-out';

    // Function to find slide element with studio-slider-wrapper_slide attribute from active swiper slide
    const findSlideElement = (): HTMLElement | null => {
      // Find active swiper slide
      const activeSwiperSlide = wrapper.querySelector('.swiper-slide-active') as HTMLElement | null;
      
      if (!activeSwiperSlide) {
        return null;
      }

      // Find the first ancestor with studio-slider-wrapper_slide attribute
      let element: HTMLElement | null = activeSwiperSlide;
      while (element) {
        if (element.hasAttribute('studio-slider-wrapper_slide')) {
          return element;
        }
        element = element.parentElement;
      }

      // Fallback: look for studio-slider-wrapper_slide element inside active slide
      const slideElement = activeSwiperSlide.querySelector('[studio-slider-wrapper_slide]') as HTMLElement | null;
      return slideElement;
    };

    // Function to update label text with transition
    const updateLabel = () => {
      const slideElement = findSlideElement();
      
      if (!slideElement) {
        return;
      }

      // Get innerHTML to preserve original HTML structure including <br> tags
      const newContent = slideElement.innerHTML.trim();
      
      if (!newContent) {
        return;
      }
      
      // Fade out
      label.style.opacity = '0';
      
      // Update content after fade out
      setTimeout(() => {
        label.innerHTML = newContent;
        // Fade in
        label.style.opacity = '1';
      }, 100);
    };

    // Create observer to watch for active slide changes
    const observer = new MutationObserver(() => {
      updateLabel();
    });

    // Start observing the wrapper for class changes
    observer.observe(wrapper, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
    });

    // Initialize with first active slide
    updateLabel();
  });
};

