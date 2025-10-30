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
      const tags = filterTags.split(',').map(tag => tag.trim());
      tags.forEach(tag => {
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

  // Function to filter cards based on selected filters
  const filterCards = () => {
    if (selectedFilters.size === 0) {
      // Show all cards if no filters selected
      allCards.forEach((card) => {
        const cardElement = card as HTMLElement;
        cardElement.style.display = '';
        // Reset grid-column to let CSS handle it
        cardElement.style.removeProperty('grid-column');
      });
      console.log('arLabFilters: Showing all cards (no filters selected)');
    } else {
      // Filter cards based on selected categories
      allCards.forEach((card) => {
        const filterTags = card.getAttribute('filter-tags');
        const cardElement = card as HTMLElement;
        
        if (!filterTags) {
          cardElement.style.display = 'none';
          return;
        }

        const cardTags = filterTags.split(',').map(tag => tag.trim());
        // Show card if it has at least one of the selected filters
        const hasMatchingTag = cardTags.some(tag => selectedFilters.has(tag));
        
        cardElement.style.display = hasMatchingTag ? '' : 'none';
        
        // Clean up grid-column styles on tablet/mobile
        if (!isDesktop()) {
          cardElement.style.removeProperty('grid-column');
        }
      });
      console.log('arLabFilters: Filtered cards by:', Array.from(selectedFilters));
      
      // Recalculate grid positions for visible cards (desktop only)
      recalculateGridPositions();
    }
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
      } else {
        selectedFilters.delete(category);
      }
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

