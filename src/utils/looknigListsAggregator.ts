export const looknigListsAggregator = () => {
  const containers = document.querySelectorAll<HTMLElement>('[looknig-for-a-lists-items]');

  if (!containers.length) {
    return;
  }

  containers.forEach((container) => {
    const waiter = container.querySelector<HTMLElement>('[looknig-for-a-lists-items_waiter]');

    if (!waiter) {
      return;
    }

    const listItems = container.querySelectorAll('ul li, ol li');

    if (!listItems.length) {
      return;
    }

    const collectedTexts = Array.from(listItems)
      .map((item) => item.textContent?.trim())
      .filter((text): text is string => Boolean(text && text.length));

    if (!collectedTexts.length) {
      return;
    }

    const combinedText = collectedTexts.join(', ');

    if (waiter.textContent === combinedText) {
      return;
    }

    waiter.textContent = combinedText;
  });
};

