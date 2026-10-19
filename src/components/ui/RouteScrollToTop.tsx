import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { NEW_ARRIVALS_HASH, scrollToNewArrivals } from '@/lib/scroll-to';

/** Scroll to top on route change (works with BrowserRouter; replaces ScrollRestoration). */
const RouteScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash === NEW_ARRIVALS_HASH) {
      const timer = window.setTimeout(() => scrollToNewArrivals(), 80);
      return () => window.clearTimeout(timer);
    }
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};

export default RouteScrollToTop;
