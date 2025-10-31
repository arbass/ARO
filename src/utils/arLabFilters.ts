import './arLabFilters.css';

export const arLabFilters = () => {
  const allCards = document.querySelectorAll('[card-ar-lab]');
  if (!allCards.length) {
    console.log('arLabFilters: No AR Lab cards found');
    return;
  }

  const filterForm = document.querySelector('#email-form');
  const templateCheckbox = document.querySelector('.w-checkbox.checkbox');

  if (!filterForm || !templateCheckbox) {
    console.log('arLabFilters: Filter form or template checkbox not found');
    return;
  }

  console.log(`arLabFilters: Found ${allCards.length} cards`);

  // Extract all unique categories from cards
  const categoriesSet = new Set<string>();

  allCards.forEach((card) => {
    const filterTags = card.getAttribute('filter-tags');
    if (filterTags) {
      // Split by comma and trim whitespace
      const tags = filterTags.split(',').map((tag) => tag.trim());
      tags.forEach((tag) => {
        if (tag) categoriesSet.add(tag);
      });
    }
  });

  const categories = Array.from(categoriesSet).sort();
  console.log('arLabFilters: Found categories:', categories);

  // Clear existing checkboxes (keep only template if needed or remove all)
  filterForm.innerHTML = '';

  // Track selected filters
  const selectedFilters = new Set<string>();

  // Check if desktop screen size (992px+)
  const isDesktop = () => window.innerWidth >= 992;

  // Function to recalculate grid positions for visible cards
  const recalculateGridPositions = () => {
    // Only apply grid positions on desktop
    if (!isDesktop()) {
      console.log('arLabFilters: Tablet/mobile detected, skipping grid recalculation');
      return;
    }

    const visibleCards: HTMLElement[] = [];

    allCards.forEach((card) => {
      const cardElement = card as HTMLElement;
      if (cardElement.style.display !== 'none') {
        visibleCards.push(cardElement);
      }
    });

    // Apply grid-column styles based on visible card index
    visibleCards.forEach((card, index) => {
      const position = (index % 3) + 1; // 1, 2, or 3

      let gridColumnValue = '';

      if (position === 1) {
        // cols 1-2
        gridColumnValue = '1 / span 2';
      } else if (position === 2) {
        // cols 4-5
        gridColumnValue = '4 / span 2';
      } else {
        // cols 7-8
        gridColumnValue = '7 / span 2';
      }

      // Use setProperty with 'important' to override CSS !important rules
      card.style.setProperty('grid-column', gridColumnValue, 'important');
    });
  };

  // Function to filter cards based on selected filters with smooth animations
  const filterCards = () => {
    const ANIMATION_DURATION = 200; // ms

    if (selectedFilters.size === 0) {
      // Show all cards if no filters selected
      allCards.forEach((card) => {
        const cardElement = card as HTMLElement;

        // If card was hidden, animate it in
        if (cardElement.style.display === 'none') {
          cardElement.style.display = '';
          cardElement.classList.add('is-filtering-out');

          // Remove animation class after display is set
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              cardElement.classList.remove('is-filtering-out');
            });
          });
        }

        // Reset grid-column to let CSS handle it
        cardElement.style.removeProperty('grid-column');
      });
      console.log('arLabFilters: Showing all cards (no filters selected)');

      // Recalculate grid after animation
      setTimeout(() => {
        recalculateGridPositions();
      }, ANIMATION_DURATION);
    } else {
      // Determine which cards to show/hide
      const cardsToHide: HTMLElement[] = [];
      const cardsToShow: HTMLElement[] = [];

      allCards.forEach((card) => {
        const filterTags = card.getAttribute('filter-tags');
        const cardElement = card as HTMLElement;

        if (!filterTags) {
          cardsToHide.push(cardElement);
          return;
        }

        const cardTags = filterTags.split(',').map((tag) => tag.trim());
        const hasMatchingTag = cardTags.some((tag) => selectedFilters.has(tag));

        if (hasMatchingTag) {
          cardsToShow.push(cardElement);
        } else {
          cardsToHide.push(cardElement);
        }
      });

      // Animate out cards that need to be hidden
      cardsToHide.forEach((card) => {
        if (card.style.display !== 'none') {
          card.classList.add('is-filtering-out');

          setTimeout(() => {
            card.style.display = 'none';
            card.classList.remove('is-filtering-out');
          }, ANIMATION_DURATION);
        }
      });

      // Animate in cards that need to be shown
      cardsToShow.forEach((card) => {
        if (card.style.display === 'none') {
          card.style.display = '';
          card.classList.add('is-filtering-out');

          // Clean up grid-column styles on tablet/mobile
          if (!isDesktop()) {
            card.style.removeProperty('grid-column');
          }

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              card.classList.remove('is-filtering-out');
            });
          });
        } else {
          // Card already visible, just ensure grid is clean on mobile
          if (!isDesktop()) {
            card.style.removeProperty('grid-column');
          }
        }
      });

      console.log('arLabFilters: Filtered cards by:', Array.from(selectedFilters));

      // Recalculate grid positions after animation completes
      setTimeout(() => {
        recalculateGridPositions();
      }, ANIMATION_DURATION);
    }
  };

  // Function to reorder checkboxes (active ones first)
  const reorderCheckboxes = () => {
    const checkboxWrappers = Array.from(filterForm.querySelectorAll('.w-checkbox.checkbox')) as HTMLElement[];
    
    // Sort: active first (is-active class), then by original order
    checkboxWrappers.sort((a, b) => {
      const aActive = a.classList.contains('is-active');
      const bActive = b.classList.contains('is-active');
      const aOrder = parseInt(a.getAttribute('data-original-order') || '0');
      const bOrder = parseInt(b.getAttribute('data-original-order') || '0');
      
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return aOrder - bOrder;
    });
    
    // Reappend in new order (DOM will handle the smooth transition via CSS)
    checkboxWrappers.forEach(wrapper => {
      filterForm.appendChild(wrapper);
    });
  };

  // Create checkbox for each category
  categories.forEach((category, index) => {
    const checkboxWrapper = templateCheckbox.cloneNode(true) as HTMLElement;
    const checkbox = checkboxWrapper.querySelector('input[type="checkbox"]') as HTMLInputElement;
    const label = checkboxWrapper.querySelector('.checkbox_label') as HTMLElement;

    // Update checkbox ID and label
    const checkboxId = `filter-${category.toLowerCase().replace(/\s+/g, '-')}-${index}`;
    checkbox.id = checkboxId;
    checkbox.name = checkboxId;
    
    // Store original order for later sorting
    checkboxWrapper.setAttribute('data-original-order', index.toString());
    checkboxWrapper.setAttribute('data-category', category);

    // Set label text
    if (label) {
      label.textContent = category;
      label.setAttribute('for', checkboxId);
    }

    // Add change event listener
    checkbox.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.checked) {
        selectedFilters.add(category);
        checkboxWrapper.classList.add('is-active');
      } else {
        selectedFilters.delete(category);
        checkboxWrapper.classList.remove('is-active');
      }
      
      // Reorder checkboxes with animation
      reorderCheckboxes();
      
      // Filter cards
      filterCards();
    });

    filterForm.appendChild(checkboxWrapper);
  });

  console.log(`arLabFilters: Created ${categories.length} filter checkboxes`);

  // Handle window resize to adjust grid positions
  let resizeTimeout: number;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(() => {
      // If filters are active, recalculate positions
      if (selectedFilters.size > 0) {
        if (isDesktop()) {
          recalculateGridPositions();
        } else {
          // On tablet/mobile, remove all grid-column overrides
          allCards.forEach((card) => {
            (card as HTMLElement).style.removeProperty('grid-column');
          });
          console.log('arLabFilters: Switched to tablet/mobile, removed grid overrides');
        }
      }
    }, 150);
  });
};
