import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronDown, Menu, Shield, User } from 'lucide-react';
import AccountNavLink from '@/components/navigation/AccountNavLink';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { pageLinks } from './nav-links';
import { useCategories } from '@/contexts/CategoriesContext';
import { buildShopNavLinks } from '@/lib/categories';
import { STICKY_NAV_CLASS, NAV_LINK_BASE, navLinkClass } from '@/lib/page-layout';
import SiteLogo from '@/components/brand/SiteLogo';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface ShopHeaderProps {
  cartCount?: number;
}

const ShopHeader = ({ cartCount = 0 }: ShopHeaderProps) => {
  const { isAdmin } = useAuth();
  const { categories } = useCategories();
  const shopLinks = buildShopNavLinks(categories);
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileShopOpen, setIsMobileShopOpen] = useState(false);
  const shopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const [searchParams] = useSearchParams();
  const isShopActive =
    location.pathname === '/products' || location.pathname.startsWith('/products/');
  const isAccountActive = location.pathname === '/account';

  useEffect(() => {
    setIsShopOpen(false);
    setIsMobileMenuOpen(false);
    setIsMobileShopOpen(false);
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shopRef.current && !shopRef.current.contains(e.target as Node)) {
        setIsShopOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={cn(
        STICKY_NAV_CLASS,
        isScrolled && 'shadow-sm border-b border-black/10'
      )}
    >
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 lg:px-16">
      <div className="absolute top-4 right-4 sm:top-5 sm:right-5 md:top-8 md:right-12 lg:right-16 z-10 flex items-center gap-1 sm:gap-3 md:gap-4 min-h-[44px]">
        <ThemeToggle className="p-1 text-black hover:opacity-60" />
        <AccountNavLink className="text-black" />
        <Link
          to="/cart"
          className="min-h-[44px] flex items-center text-[10px] font-bold tracking-[0.2em] uppercase text-black hover:opacity-60 gap-1 px-1"
        >
        Cart
        <span className="text-[9px] min-w-[18px] h-[18px] inline-flex items-center justify-center border border-black tabular-nums">
          {cartCount}
        </span>
      </Link>
      </div>

      <button
        type="button"
        className="absolute top-4 left-4 sm:top-5 sm:left-5 md:hidden z-10 text-black min-w-[44px] min-h-[44px] flex items-center justify-center"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Menu"
      >
        {isMobileMenuOpen ? (
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Close</span>
        ) : (
          <Menu className="w-5 h-5" strokeWidth={2} />
        )}
      </button>

      <div className="flex flex-col items-center text-center pt-14 pb-4 sm:pt-16 sm:pb-5 md:pt-10 md:pb-6 px-2 md:px-8">
        <Link to="/" className="mb-0 md:mb-4 lg:mb-6 block">
          <SiteLogo
            variant="light"
            className="h-12 sm:h-14 md:h-[5rem] lg:h-24 xl:h-28 mx-auto"
          />
        </Link>

        <nav className="hidden md:flex items-center justify-center gap-10 lg:gap-14">
          <div ref={shopRef} className="relative">
            <button
              type="button"
              onClick={() => setIsShopOpen((open) => !open)}
              onMouseEnter={() => setIsShopOpen(true)}
              className={cn(
                'inline-flex items-center gap-1',
                NAV_LINK_BASE,
                navLinkClass(isShopActive || isShopOpen)
              )}
              aria-expanded={isShopOpen}
            >
              Shop
              <ChevronDown
                className={cn('w-3 h-3 transition-transform', isShopOpen && 'rotate-180')}
                strokeWidth={2.5}
              />
            </button>

            {isShopOpen && (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-[60]"
                onMouseLeave={() => setIsShopOpen(false)}
              >
                <div className="bg-white border border-black/10 min-w-[220px] py-8 px-6 flex flex-col items-center gap-5">
                  {shopLinks.map((item) => (
                    <Link
                      key={item.path + item.label}
                      to={item.path}
                      className="text-[10px] font-bold tracking-[0.2em] uppercase text-black hover:opacity-60 transition-opacity text-center whitespace-nowrap"
                      onClick={() => setIsShopOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {pageLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(NAV_LINK_BASE, navLinkClass(location.pathname === item.path))}
            >
              {item.label}
            </Link>
          ))}

          <Link
            to={isAdmin ? '/admin' : '/account'}
            className={cn(NAV_LINK_BASE, navLinkClass(isAccountActive))}
          >
            {isAdmin ? 'Admin' : 'My account'}
          </Link>

          <Link
            to="/"
            className={cn(NAV_LINK_BASE, navLinkClass(location.pathname === '/'))}
          >
            Home
          </Link>
        </nav>
      </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-[70] flex flex-col items-center justify-center p-8">
          <button
            type="button"
            className="absolute top-6 right-4 text-[10px] font-bold tracking-[0.2em] uppercase"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Close
          </button>

          <nav className="flex flex-col items-center gap-6 w-full max-w-xs">
            <Link
              to={isAdmin ? '/admin' : '/account'}
              className="w-full py-3 min-h-[48px] flex items-center justify-center gap-2 border border-black text-[11px] font-bold tracking-[0.2em] uppercase text-black bg-black/[0.02]"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {isAdmin ? (
                <Shield className="w-4 h-4" strokeWidth={2} />
              ) : (
                <User className="w-4 h-4" strokeWidth={2} />
              )}
              {isAdmin ? 'Admin panel' : 'My account'}
            </Link>

            <button
              type="button"
              onClick={() => setIsMobileShopOpen(!isMobileShopOpen)}
              className="inline-flex items-center gap-1 text-[12px] font-bold tracking-[0.2em] uppercase"
            >
              Shop
              <ChevronDown
                className={cn('w-3 h-3', isMobileShopOpen && 'rotate-180')}
                strokeWidth={2.5}
              />
            </button>

            {isMobileShopOpen &&
              shopLinks.map((item) => (
                <Link
                  key={item.path + item.label}
                  to={item.path}
                  className="text-[10px] font-bold tracking-[0.2em] uppercase text-black/70"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

            {pageLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-[12px] font-bold tracking-[0.2em] uppercase"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <Link
              to="/"
              className="text-[10px] font-bold tracking-[0.2em] uppercase text-black/50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>

            <Link
              to="/cart"
              className="text-[12px] font-bold tracking-[0.2em] uppercase text-black"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Cart ({cartCount})
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default ShopHeader;
