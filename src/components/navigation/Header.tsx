import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Search, X, ChevronDown, Menu, Shield, User } from 'lucide-react';
import AccountNavLink from '@/components/navigation/AccountNavLink';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { pageLinks } from './nav-links';
import { useCategories } from '@/contexts/CategoriesContext';
import { buildShopNavLinks } from '@/lib/categories';
import { STICKY_NAV_CLASS, PAGE_X, NAV_LINK_BASE, navLinkClass } from '@/lib/page-layout';
import { useCart } from '@/contexts/CartContext';
import SiteLogo from '@/components/brand/SiteLogo';

interface HeaderProps {
  variant?: 'solid' | 'transparent';
}

const Header = ({ variant = 'solid' }: HeaderProps) => {
  const { cartCount } = useCart();
  const { isAdmin } = useAuth();
  const { categories } = useCategories();
  const shopLinks = buildShopNavLinks(categories);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isMobileShopOpen, setIsMobileShopOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const shopRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsShopOpen(false);
    setIsMobileMenuOpen(false);
    setIsMobileShopOpen(false);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shopRef.current && !shopRef.current.contains(e.target as Node)) {
        setIsShopOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isHomePage = location.pathname === '/';
  const useLightText = isHomePage && !isScrolled && variant === 'transparent';
  const textClass = useLightText ? 'text-white' : 'text-black';
  const solidBar = isScrolled || !isHomePage || variant === 'solid';
  const isShopActive = location.pathname === '/products';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const mainNavClass = (active: boolean) =>
    cn(NAV_LINK_BASE, navLinkClass(active, useLightText));

  return (
    <header
      className={cn(
        STICKY_NAV_CLASS,
        solidBar ? 'bg-white' : 'bg-transparent',
        isScrolled && solidBar && 'shadow-sm border-b border-black/10'
      )}
    >
      <div className={cn('relative max-w-[1400px] mx-auto', PAGE_X)}>
      {/* Top right: Search + Cart */}
      <div className="absolute top-4 right-4 sm:top-5 sm:right-5 md:top-7 md:right-12 lg:right-16 flex items-center gap-2 sm:gap-3 md:gap-4 z-10">
        <button
          type="button"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className={cn(
            'text-[10px] font-bold tracking-[0.2em] uppercase hover:opacity-60 hidden sm:block',
            textClass
          )}
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className={cn('sm:hidden p-1', textClass)}
          aria-label="Search"
        >
          <Search className="w-4 h-4" strokeWidth={2} />
        </button>

        <AccountNavLink className={textClass} textClass={textClass} />

        <Link
          to="/cart"
          className={cn(
            'min-h-[44px] flex items-center text-[10px] font-bold tracking-[0.2em] uppercase gap-1 hover:opacity-60 px-0.5',
            textClass
          )}
        >
          Cart
          <span
            className={cn(
              'text-[9px] min-w-[18px] h-[18px] inline-flex items-center justify-center border tabular-nums',
              useLightText ? 'border-white text-white' : 'border-black text-black'
            )}
          >
            {cartCount}
          </span>
        </Link>
      </div>

      {/* Mobile menu toggle */}
      <button
        type="button"
        className={cn(
          'absolute top-4 left-4 sm:top-5 sm:left-5 md:hidden z-10 min-w-[44px] min-h-[44px] flex items-center justify-center',
          textClass
        )}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Menu"
      >
        {isMobileMenuOpen ? (
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Close</span>
        ) : (
          <Menu className="w-5 h-5" strokeWidth={2} />
        )}
      </button>

      {/* Centered logo + nav below */}
      <div className="flex flex-col items-center text-center pt-14 pb-4 sm:pt-16 sm:pb-5 md:pt-9 md:pb-6">
        <Link to="/" className="mb-0 md:mb-7">
          <SiteLogo
            variant={useLightText ? 'hero' : 'light'}
            className="h-12 sm:h-14 md:h-[5.75rem] lg:h-28 mx-auto transition-all duration-300"
          />
        </Link>

        <nav className="hidden md:flex items-center justify-center gap-10 lg:gap-12">
          <div ref={shopRef} className="relative">
            <button
              type="button"
              onClick={() => setIsShopOpen((open) => !open)}
              onMouseEnter={() => setIsShopOpen(true)}
              className={cn(
                'inline-flex items-center gap-1',
                mainNavClass(isShopActive || isShopOpen)
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
                <div className="bg-white border border-black/10 min-w-[220px] py-8 px-6 flex flex-col items-center gap-5 shadow-sm">
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
              className={mainNavClass(location.pathname === item.path)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      </div>

      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-t border-black/10 p-4 z-50">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <form
              onSubmit={handleSearch}
              className="flex-1 flex items-center border-b border-black py-2"
            >
              <Input
                type="text"
                placeholder="SEARCH PRODUCTS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-none focus-visible:ring-0 bg-transparent text-[10px] tracking-[0.2em] uppercase font-bold rounded-none"
                autoFocus
              />
              <button type="submit" className="text-[10px] font-bold tracking-[0.2em] uppercase text-black">
                Go
              </button>
            </form>
            <button type="button" onClick={() => setIsSearchOpen(false)} aria-label="Close search">
              <X className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>
      )}

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-[60] md:hidden flex flex-col items-center justify-center text-center p-8">
          <button
            type="button"
            className="absolute top-5 right-4 text-[10px] font-bold tracking-[0.2em] uppercase"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Close
          </button>

          <Link to="/" className="mb-8" onClick={() => setIsMobileMenuOpen(false)}>
            <SiteLogo variant="light" className="h-14 mx-auto" />
          </Link>

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
              className="inline-flex items-center gap-1 text-[12px] font-bold tracking-[0.2em] uppercase text-black"
            >
              Shop
              <ChevronDown
                className={cn('w-3 h-3 transition-transform', isMobileShopOpen && 'rotate-180')}
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
                className="text-[12px] font-bold tracking-[0.2em] uppercase text-black"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

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

export default Header;
