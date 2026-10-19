export const NEW_ARRIVALS_SECTION_ID = 'new-arrivals';
export const NEW_ARRIVALS_HASH = `#${NEW_ARRIVALS_SECTION_ID}`;

export function scrollToSection(
  id: string,
  behavior: ScrollBehavior = 'smooth'
) {
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' });
  });
}

export function scrollToNewArrivals(behavior: ScrollBehavior = 'smooth') {
  scrollToSection(NEW_ARRIVALS_SECTION_ID, behavior);
}
