import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isMobile || !isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={cn(
        'fixed z-[85] flex items-center justify-center',
        'h-8 w-8 min-h-0 min-w-0 p-0',
        'bottom-20 right-6 sm:bottom-24 sm:right-8 md:bottom-28 md:right-10',
        'bg-black text-white border border-black/20',
        'shadow-md active:scale-95 transition-transform',
        'animate-fade-in'
      )}
    >
      <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />
    </button>
  );
};

export default ScrollToTop;
