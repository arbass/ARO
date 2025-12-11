interface CounterCache {
  projectCount: number;
  arCount: number;
  timestamp: number;
}

const CACHE_KEY = 'cardCounterCache';
const ONE_DAY_MS = 1 * 24 * 60 * 60 * 1000; // 1 day in milliseconds

const getCachedData = (): CounterCache | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CounterCache = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid (less than one day old)
    if (now - data.timestamp < ONE_DAY_MS) {
      // console.log('CardCounterUpdater: Using cached data');
      return data;
    }

    // console.log('CardCounterUpdater: Cache expired, will fetch new data');
    return null;
  } catch (error) {
    // console.error('CardCounterUpdater: Error reading cache:', error);
    return null;
  }
};

const setCachedData = (projectCount: number, arCount: number): void => {
  try {
    const data: CounterCache = {
      projectCount,
      arCount,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    // console.log('CardCounterUpdater: Data cached successfully');
  } catch (error) {
    // console.error('CardCounterUpdater: Error saving cache:', error);
  }
};

const waitForElements = async (selector: string, maxAttempts = 10, delay = 100): Promise<NodeListOf<Element>> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      // console.log(`CardCounterUpdater: Found ${elements.length} elements with ${selector} on attempt ${attempt + 1}`);
      return elements;
    }
    // console.log(`CardCounterUpdater: Attempt ${attempt + 1}/${maxAttempts} - waiting for ${selector}...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return document.querySelectorAll(selector); // Return empty NodeList if nothing found
};

const fetchProjectCount = async (): Promise<number> => {
  // Check if we're already on the /projects page
  const currentPath = window.location.pathname;
  // console.log(`CardCounterUpdater: Current path is ${currentPath}`);

  if (currentPath === '/projects' || currentPath.endsWith('/projects')) {
    // We're on the projects page, count directly (with wait for dynamic content)
    // console.log('CardCounterUpdater: Already on /projects page, counting cards directly');
    const projectCards = await waitForElements('[project-card-wrapper]');
    // console.log(`CardCounterUpdater: Found ${projectCards.length} project cards on current page`);
    return projectCards.length;
  }

  // We're on a different page, need to fetch
  // console.log('CardCounterUpdater: Fetching /projects page...');
  const response = await fetch('/projects');
  
  if (!response.ok) {
    // console.error(`CardCounterUpdater: Failed to fetch /projects, status: ${response.status}`);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const html = await response.text();
  // console.log(`CardCounterUpdater: Received HTML (${html.length} characters)`);

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Try multiple possible selectors
  let projectCards = doc.querySelectorAll('[project-card-wrapper]');
  // console.log(`CardCounterUpdater: Found ${projectCards.length} elements with [project-card-wrapper]`);

  // If no results, try alternative selectors
  if (projectCards.length === 0) {
    projectCards = doc.querySelectorAll('[data-project-card-wrapper]');
    // console.log(`CardCounterUpdater: Trying [data-project-card-wrapper]: found ${projectCards.length}`);
  }

  if (projectCards.length === 0) {
    projectCards = doc.querySelectorAll('.project-card-wrapper');
    // console.log(`CardCounterUpdater: Trying .project-card-wrapper: found ${projectCards.length}`);
  }

  // Log first few elements for debugging
  if (projectCards.length > 0) {
    // console.log('CardCounterUpdater: Sample element:', projectCards[0]);
  }
  
  return projectCards.length;
};

const fetchArCount = async (): Promise<number> => {
  // Check if we're already on the /ar-lab page
  const currentPath = window.location.pathname;
  
  if (currentPath === '/ar-lab' || currentPath.endsWith('/ar-lab')) {
    // We're on the ar-lab page, count directly (with wait for dynamic content)
    // console.log('CardCounterUpdater: Already on /ar-lab page, counting cards directly');
    const arCards = await waitForElements('[card-ar-lab]');
    // console.log(`CardCounterUpdater: Found ${arCards.length} AR cards on current page`);
    return arCards.length;
  }

  // We're on a different page, need to fetch
  // console.log('CardCounterUpdater: Fetching /ar-lab page...');
  const response = await fetch('/ar-lab');
  
  if (!response.ok) {
    // console.error(`CardCounterUpdater: Failed to fetch /ar-lab, status: ${response.status}`);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const html = await response.text();
  // console.log(`CardCounterUpdater: Received HTML (${html.length} characters)`);

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Try multiple possible selectors
  let arCards = doc.querySelectorAll('[card-ar-lab]');
  // console.log(`CardCounterUpdater: Found ${arCards.length} elements with [card-ar-lab]`);

  // If no results, try alternative selectors
  if (arCards.length === 0) {
    arCards = doc.querySelectorAll('[data-card-ar-lab]');
    // console.log(`CardCounterUpdater: Trying [data-card-ar-lab]: found ${arCards.length}`);
  }

  if (arCards.length === 0) {
    arCards = doc.querySelectorAll('.card-ar-lab');
    // console.log(`CardCounterUpdater: Trying .card-ar-lab: found ${arCards.length}`);
  }

  // Log first few elements for debugging
  if (arCards.length > 0) {
    // console.log('CardCounterUpdater: Sample element:', arCards[0]);
  }
  
  return arCards.length;
};

const clearCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    // console.log('CardCounterUpdater: Cache cleared successfully! Reload the page to fetch fresh data.');
  } catch (error) {
    // console.error('CardCounterUpdater: Error clearing cache:', error);
  }
};

const setupCacheClearShortcut = () => {
  // Listen for 'l' key press to clear cache
  window.addEventListener('keydown', (event) => {
    if (event.key === 'l' || event.key === 'L') {
      clearCache();
    }
  });
  // console.log('CardCounterUpdater: Press "L" key to clear cache');
};

export const cardCounterUpdater = async () => {
  // console.log('CardCounterUpdater: Initializing...');

  const projectCounters = document.querySelectorAll('[counter-projects]');
  const arCounters = document.querySelectorAll('[counter-ar]');

  // console.log(`CardCounterUpdater: Found ${projectCounters.length} project counter(s) and ${arCounters.length} AR counter(s)`);

  // Setup keyboard shortcut for cache clearing
  setupCacheClearShortcut();

  // Check if any counter elements exist on the page
  if (!projectCounters.length && !arCounters.length) {
    // console.log('CardCounterUpdater: No counter elements found on page, exiting');
    return;
  }

  // Try to get cached data first
  const cachedData = getCachedData();

  let projectCount: number;
  let arCount: number;

  if (cachedData) {
    // Use cached data
    projectCount = cachedData.projectCount;
    arCount = cachedData.arCount;
    // console.log(`CardCounterUpdater: Using cached counts - Projects: ${projectCount}, AR: ${arCount}`);
  } else {
    // Fetch fresh data
    try {
      const fetchPromises: Promise<number>[] = [];
      
      if (projectCounters.length) {
        fetchPromises.push(fetchProjectCount());
      } else {
        fetchPromises.push(Promise.resolve(0));
      }

      if (arCounters.length) {
        fetchPromises.push(fetchArCount());
      } else {
        fetchPromises.push(Promise.resolve(0));
      }

      const [fetchedProjectCount, fetchedArCount] = await Promise.all(fetchPromises);
      projectCount = fetchedProjectCount;
      arCount = fetchedArCount;

      // console.log(`CardCounterUpdater: Fresh counts - Projects: ${projectCount}, AR: ${arCount}`);

      // Cache the fresh data
      setCachedData(projectCount, arCount);
      // console.log('CardCounterUpdater: Fetched and cached fresh data');
    } catch (error) {
      // console.error('CardCounterUpdater: Error fetching data:', error);
      return;
    }
  }

  // Update project counter elements
  if (projectCounters.length) {
    projectCounters.forEach((counter) => {
      counter.textContent = projectCount.toString();
    });
    // console.log(`CardCounterUpdater: Updated ${projectCounters.length} project counter(s) with count: ${projectCount}`);
  }

  // Update AR counter elements
  if (arCounters.length) {
    arCounters.forEach((counter) => {
      counter.textContent = arCount.toString();
    });
    // console.log(`CardCounterUpdater: Updated ${arCounters.length} AR counter(s) with count: ${arCount}`);
  }
};

