export const currentYearUpdater = () => {
  const currentYearElement = document.getElementById('current-year');

  if (currentYearElement) {
    const currentYear = new Date().getFullYear();
    currentYearElement.textContent = currentYear.toString();
    // console.log(`CurrentYearUpdater: Updated year to ${currentYear}`);
  }
};

