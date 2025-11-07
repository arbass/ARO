export const parentLinkWrapper = () => {
  const makeLinkElements = document.querySelectorAll('.make-link');
  
  if (makeLinkElements.length) {
    makeLinkElements.forEach((linkElement) => {
      // Check if it's an anchor element with href
      if (linkElement instanceof HTMLAnchorElement && linkElement.href) {
        const parentElement = linkElement.parentElement;
        
        if (parentElement && parentElement !== document.body) {
          // Get the href from the .make-link element
          const href = linkElement.href;
          
          // Create new anchor element
          const newLink = document.createElement('a');
          newLink.href = href;
          
          // Copy all attributes from parent except href (if it exists)
          Array.from(parentElement.attributes).forEach((attr) => {
            if (attr.name !== 'href') {
              newLink.setAttribute(attr.name, attr.value);
            }
          });
          
          // Move all children from parent to new link
          while (parentElement.firstChild) {
            newLink.appendChild(parentElement.firstChild);
          }
          
          // Replace parent with new link
          parentElement.parentNode?.replaceChild(newLink, parentElement);
        }
      }
    });
  }
};

