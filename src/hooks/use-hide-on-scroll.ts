import { useEffect, useRef, useState } from 'react';

/**
 * True while the visitor is scrolling down past `offset`; false again as soon as they scroll up.
 * Used to slide the fixed header out of the way while browsing.
 */
export function useHideOnScroll(offset = 80, tolerance = 6) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (y <= offset) setHidden(false);
      else if (delta > tolerance) setHidden(true);
      else if (delta < -tolerance) setHidden(false);
      // Ignore tiny jitters so the header doesn't flicker
      if (Math.abs(delta) > tolerance) lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [offset, tolerance]);

  return hidden;
}
