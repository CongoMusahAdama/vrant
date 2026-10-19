import { useEffect, useRef, useState } from 'react';

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollRevealOptions = {}
) {
  const { threshold = 0.12, rootMargin = '0px 0px -6% 0px', triggerOnce = true } = options;
  const ref = useRef<T>(null);

  // Start as visible if already in the viewport (above the fold) — prevents
  // the "flash of invisible content" on page load / refresh.
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    const node = ref.current;
    if (!node) return false;
    const rect = node.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // If already visible from initial SSR/hydration check — skip observer
    if (isVisible && triggerOnce) return;

    // Immediately check if element is already in viewport on mount
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setIsVisible(true);
      if (triggerOnce) return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) observer.disconnect();
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, isVisible]);

  return { ref, isVisible };
}
