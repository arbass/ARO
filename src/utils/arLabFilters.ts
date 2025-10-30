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

  // Function to filter cards based on selected filters
  const filterCards = () => {
    if (selectedFilters.size === 0) {
      // Show all cards if no filters selected
      allCards.forEach((card) => {
        (card as HTMLElement).style.display = '';
      });
      console.log('arLabFilters: Showing all cards (no filters selected)');
    } else {
      // Filter cards based on selected categories
      allCards.forEach((card) => {
        const filterTags = card.getAttribute('filter-tags');
        if (!filterTags) {
          (card as HTMLElement).style.display = 'none';
          return;
        }

        const cardTags = filterTags.split(',').map(tag => tag.trim());
        // Show card if it has at least one of the selected filters
        const hasMatchingTag = cardTags.some(tag => selectedFilters.has(tag));
        
        (card as HTMLElement).style.display = hasMatchingTag ? '' : 'none';
      });
      console.log('arLabFilters: Filtered cards by:', Array.from(selectedFilters));
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
};

